// Quarter simulation — ported from engine/topaz_engine/simulation.py
// Pure functions, no randomness, no I/O. All teams processed in one deterministic batch.
// SPEC.md section 8.

const { AREAS, PRODUCTS, TABLES, DEFAULT_DECISIONS, INITIAL_STATE } = require('./tables');

const PENETRATION   = { 1: 0.0011, 2: 0.0007, 3: 0.0004 }; // documented assumption
const EXPORT_DAMPING = 0.15;   // documented assumption
const SHARES_ISSUED  = 1_000_000;
const MACHINIST_WAGE_PER_HR = 10.50; // assumption: not stated in the manual tables

// ── Helpers ────────────────────────────────────────────────────────────────────

function _num(v, def = 0.0) {
  const f = parseFloat(v);
  return isFinite(f) ? f : def;
}

function _r(x) { return Math.round(parseFloat(x) * 100) / 100; }

function _merge(base, override) {
  const out = {};
  for (const [k, v] of Object.entries(base)) {
    out[k] = Array.isArray(v) ? [...v] : (v && typeof v === 'object' ? { ...v } : v);
  }
  for (const [k, v] of Object.entries(override || {})) {
    if (v === null || v === undefined) continue;
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = { ...out[k], ...v };
    } else {
      out[k] = v;
    }
  }
  return out;
}

function _pad3(v, defaults) {
  const arr = Array.isArray(v) ? v : [];
  return [0, 1, 2].map(i => (i < arr.length ? _num(arr[i], defaults[i]) : defaults[i]));
}

function _normDecisions(d) {
  d = _merge(DEFAULT_DECISIONS, d);
  for (const mkt of ['export', 'home']) {
    d.prices[mkt] = _pad3(d.prices[mkt], DEFAULT_DECISIONS.prices[mkt]);
  }
  for (const k of ['trade_press', 'advertising', 'support', 'merchandising']) {
    d.promotion[k] = _pad3(d.promotion[k], DEFAULT_DECISIONS.promotion[k]);
  }
  d.assembly_time_minutes = _pad3(d.assembly_time_minutes, DEFAULT_DECISIONS.assembly_time_minutes);
  d.product_improvements  = _pad3(d.product_improvements,  DEFAULT_DECISIONS.product_improvements);
  for (const a of AREAS) {
    d.make_deliver[a] = _pad3(d.make_deliver[a], DEFAULT_DECISIONS.make_deliver[a]);
    d.salespeople[a]  = _num(d.salespeople[a], 0.0);
  }
  d.shift_level = parseInt(_num(d.shift_level, 1));
  if (![1, 2, 3].includes(d.shift_level)) d.shift_level = 1;
  const sup = parseInt(_num(d.raw_material.supplier_no, 1));
  d.raw_material.supplier_no = [0, 1, 2, 3].includes(sup) ? sup : 1;
  return d;
}

function _creditDiscount(days) {
  for (const [maxDays, disc] of TABLES.T23.tiers) {
    if (days <= maxDays) return disc;
  }
  return TABLES.T23.default;
}

// ── Opening balances ───────────────────────────────────────────────────────────

function _openings(prev, companyNumber) {
  if (!prev) {
    const p = {};
    for (const a of AREAS) for (const pr of PRODUCTS) {
      p[`${a}:${pr}`] = INITIAL_STATE.product_stock_per_area_product;
    }
    const t21 = TABLES.T21.product_valuation;
    const stockValue = Object.entries(p).reduce((s, [key, v]) => {
      const pr = parseInt(key.split(':')[1]);
      return s + v * t21[pr];
    }, 0);
    return {
      machines_count: INITIAL_STATE.machines,
      machines_value: INITIAL_STATE.machines * TABLES.T18.machine_cost,
      vehicles_count: INITIAL_STATE.vehicles,
      vehicles_value: INITIAL_STATE.vehicles * TABLES.T18.vehicle_cost,
      assembly_workers: INITIAL_STATE.assembly_workers,
      machinists: INITIAL_STATE.machinists,
      property: parseFloat(INITIAL_STATE.property),
      material_stock: INITIAL_STATE.material_stock,
      material_price: parseFloat(INITIAL_STATE.material_price_per_1000),
      product_stock: p,
      product_stock_value: parseFloat(stockValue),
      debtors: 0.0, tax_due: 0.0, creditors: 0.0,
      cash: parseFloat(INITIAL_STATE.cash_invested),
      overdraft: 0.0, unsecured: 0.0,
      reserves: parseFloat(INITIAL_STATE.reserves),
      share_price: parseFloat(INITIAL_STATE.share_price),
      net_worth: parseFloat(INITIAL_STATE.share_capital + INITIAL_STATE.reserves),
      prev_after_next: 0.0,
    };
  }
  const r  = prev.resources     || {};
  const bs = prev.balance_sheet || {};
  const oh = prev.overheads     || {};
  const prodStock = {};
  for (const row of (prev.products || [])) {
    prodStock[`${row.area}:${row.product}`] = row.closing_stock;
  }
  let sp = parseFloat(INITIAL_STATE.share_price);
  for (const c of (prev.group?.companies || [])) {
    if (c.company_number === companyNumber) sp = _num(c.share_price, sp);
  }
  const afterNext = ['advertising', 'trade_press', 'support', 'merchandising',
                     'info_charges', 'guarantee_servicing', 'maintenance', 'credit_control']
    .reduce((s, k) => s + _num(oh[k]), 0);
  return {
    machines_count:   parseInt(_num(r.machines?.owned,    INITIAL_STATE.machines)),
    machines_value:   _num(bs.machines),
    vehicles_count:   parseInt(_num(r.vehicles?.owned,    INITIAL_STATE.vehicles)),
    vehicles_value:   _num(bs.vehicles),
    assembly_workers: parseInt(_num(r.assembly?.workers,  INITIAL_STATE.assembly_workers)),
    machinists:       parseInt(_num(r.machines?.machinists, INITIAL_STATE.machinists)),
    property:         _num(bs.property, INITIAL_STATE.property),
    material_stock:   parseInt(_num(r.materials?.closing_stock)),
    material_price:   _num(r.materials?.price_per_1000, INITIAL_STATE.material_price_per_1000),
    product_stock:    prodStock,
    product_stock_value: _num(bs.product_stocks),
    debtors:   _num(bs.debtors),
    tax_due:   _num(bs.tax_due),
    creditors: _num(bs.creditors),
    cash:      _num(bs.cash_invested),
    overdraft: _num(bs.bank_overdraft),
    unsecured: _num(bs.unsecured_loans),
    reserves:  _num(bs.reserves, INITIAL_STATE.reserves),
    share_price: sp,
    net_worth:   _num(bs.net_worth, INITIAL_STATE.share_capital + INITIAL_STATE.reserves),
    prev_after_next: afterNext,
  };
}

// ── Phase A: production + attractiveness ───────────────────────────────────────

function _phaseA(team, d, mv, avgPrice) {
  const cn  = team.team.company_number;
  const op  = _openings(team.prev || null, cn);
  const shift = d.shift_level;
  const t3 = TABLES.T3, t5 = TABLES.T5, t16 = TABLES.T16;

  const sched = {};
  for (const a of AREAS) {
    sched[a] = {};
    for (const p of PRODUCTS) sched[a][p] = Math.max(parseInt(_num(d.make_deliver[a][p - 1])), 0);
  }
  const totalSched = AREAS.reduce((s, a) => s + PRODUCTS.reduce((s2, p) => s2 + sched[a][p], 0), 0);

  const soldM = Math.min(Math.max(parseInt(_num(d.machines_to_sell)), 0), op.machines_count);
  const newM  = Math.max(parseInt(_num(d.new_machines_to_order)), 0);
  const machines = op.machines_count - soldM + newM;
  const machAvail = machines * t5[shift].machine_hours_per_q;

  const workers = Math.max(
    op.assembly_workers + parseInt(_num(d.assembly_changes.recruit)) - parseInt(_num(d.assembly_changes.dismiss)), 0
  );
  const assyAvail = workers * (t16.basic_hours_per_q + t16.saturday_overtime[shift] + t16.sunday_overtime);

  const ordered   = Math.max(parseInt(_num(d.raw_material.units_to_order)), 0);
  const delivered = ordered; // full in-quarter delivery
  const matAvail  = op.material_stock + delivered;
  const matPrice  = op.material_price * (1 + mv.mat_change / 100);

  const at = d.assembly_time_minutes;
  const machNeed = AREAS.reduce((s, a) =>
    s + PRODUCTS.reduce((s2, p) => s2 + sched[a][p] * t3[p].machining_min / 60, 0), 0);
  const assyNeed = AREAS.reduce((s, a) =>
    s + PRODUCTS.reduce((s2, p) => s2 + sched[a][p] * Math.max(at[p - 1], t3[p].assembly_min) / 60, 0), 0);
  const matNeed  = AREAS.reduce((s, a) =>
    s + PRODUCTS.reduce((s2, p) => s2 + sched[a][p] * t3[p].material_content, 0), 0);

  const ratios = [1.0];
  if (machNeed > 0) ratios.push(machAvail / machNeed);
  if (assyNeed > 0) ratios.push(assyAvail / assyNeed);
  if (matNeed  > 0) ratios.push(matAvail  / matNeed);
  const scale = Math.min(...ratios);

  const produced = {};
  for (const a of AREAS) { produced[a] = {}; for (const p of PRODUCTS) produced[a][p] = Math.floor(sched[a][p] * scale); }
  const producedTotal = Math.floor(totalSched * scale);
  let rem = producedTotal - AREAS.reduce((s, a) => s + PRODUCTS.reduce((s2, p) => s2 + produced[a][p], 0), 0);
  const order = AREAS.flatMap(a => PRODUCTS.map(p => [a, p]));
  let guard = 0, idx = 0;
  while (rem > 0 && guard < totalSched + 16) {
    const [a, p] = order[idx % order.length]; idx++; guard++;
    if (produced[a][p] < sched[a][p]) { produced[a][p]++; rem--; }
  }

  const researchPounds = _num(d.research_expenditure_000) * 1000;
  const imp  = d.product_improvements;
  const star = {};
  for (const p of PRODUCTS) star[p] = Math.max(1.0, Math.min(5.0, 1 + researchPounds / 20000 + (imp[p - 1] ? 1 : 0)));

  const rejected = {}, sellable = {};
  for (const a of AREAS) {
    rejected[a] = {}; sellable[a] = {};
    for (const p of PRODUCTS) {
      const rate = Math.max(0.005, 0.03 - 0.01 * star[p]);
      rejected[a][p] = Math.round(produced[a][p] * rate);
      sellable[a][p] = produced[a][p] - rejected[a][p];
    }
  }

  const opening = {};
  for (const a of AREAS) {
    opening[a] = {};
    for (const p of PRODUCTS) opening[a][p] = parseInt(_num(op.product_stock[`${a}:${p}`], 60));
  }

  // Attractiveness index
  const promo = d.promotion;
  const promoF = {};
  for (const p of PRODUCTS) {
    const total = ['trade_press', 'advertising', 'support', 'merchandising']
      .reduce((s, k) => s + _num(promo[k][p - 1]), 0);
    promoF[p] = 1 + 0.15 * Math.log(1 + total);
  }
  const outlets = TABLES.T1.outlets;
  const salesF  = {};
  for (const a of AREAS) salesF[a] = 1 + 2.0 * (d.salespeople[a] / (outlets[a] / 500));
  const qualF   = {};
  for (const p of PRODUCTS) qualF[p] = 1 + 0.06 * (star[p] - 1);

  const ownPrice = {};
  for (const a of AREAS) {
    ownPrice[a] = {};
    for (const p of PRODUCTS) ownPrice[a][p] = _num(d.prices[a === 'export' ? 'export' : 'home'][p - 1]);
  }

  const a1 = {};
  for (const a of AREAS) {
    a1[a] = {};
    const mkt = a === 'export' ? 'export' : 'home';
    for (const p of PRODUCTS) {
      const pf = ownPrice[a][p] > 0 ? Math.pow(avgPrice[p][mkt] / ownPrice[a][p], 2.0) : 0.2;
      a1[a][p] = promoF[p] * salesF[a] * qualF[p] * Math.max(0.2, Math.min(5.0, pf));
    }
  }

  const machHrsUsed = AREAS.reduce((s, a) =>
    s + PRODUCTS.reduce((s2, p) => s2 + produced[a][p] * t3[p].machining_min / 60, 0), 0);
  const assyHrsUsed = AREAS.reduce((s, a) =>
    s + PRODUCTS.reduce((s2, p) => s2 + produced[a][p] * Math.max(at[p - 1], t3[p].assembly_min) / 60, 0), 0);
  const matUsed = AREAS.reduce((s, a) =>
    s + PRODUCTS.reduce((s2, p) => s2 + produced[a][p] * t3[p].material_content, 0), 0);

  const boughtV = Math.max(parseInt(_num(d.vans_to_buy)), 0);
  const soldV   = Math.min(Math.max(parseInt(_num(d.vans_to_sell)), 0), op.vehicles_count);
  const vehicles = op.vehicles_count - soldV + boughtV;

  const share = {}, demandUnits = {}, sales = {};
  for (const a of AREAS) {
    share[a] = {}; demandUnits[a] = {}; sales[a] = {};
    for (const p of PRODUCTS) { share[a][p] = 0.0; demandUnits[a][p] = 0; sales[a][p] = 0; }
  }

  return {
    op, sched, totalSched, produced, rejected, sellable, opening,
    ownPrice, star, machines, soldM, newM, vehicles, boughtV, soldV,
    workers, machAvail, assyAvail, machHrsUsed, assyHrsUsed, matUsed,
    matAvail, matPrice, ordered, delivered, a1, share, demandUnits, sales,
  };
}

// ── Phase B: P&L, balance sheet, cash flow, report assembly ──────────────────

function _phaseB(team, d, pa, mv, industry, year, quarter, nowIso) {
  const cn   = team.team.company_number;
  const name = team.team.name;
  const op   = pa.op;
  const shift = d.shift_level;
  const premium = TABLES.T16.shift_premium[shift];
  const { T3: t3, T4: t4, T7: t7, T8: t8, T12: t12, T14: t14, T18: t18, T20: t20, T21: t21 } = TABLES;

  const sales = {};
  for (const a of AREAS) {
    sales[a] = {};
    for (const p of PRODUCTS) {
      sales[a][p] = Math.min(pa.demandUnits[a][p], pa.sellable[a][p] + pa.opening[a][p]);
    }
  }
  pa.sales = sales;

  const backlog = {}, closing = {};
  for (const a of AREAS) {
    backlog[a] = {}; closing[a] = {};
    for (const p of PRODUCTS) {
      backlog[a][p] = pa.demandUnits[a][p] - sales[a][p];
      closing[a][p] = pa.sellable[a][p] + pa.opening[a][p] - sales[a][p];
    }
  }
  const unitsSold = AREAS.reduce((s, a) => s + PRODUCTS.reduce((s2, p) => s2 + sales[a][p], 0), 0);
  const disc      = _creditDiscount(_num(d.days_credit_allowed));
  const revenue   = AREAS.reduce((s, a) =>
    s + PRODUCTS.reduce((s2, p) => s2 + sales[a][p] * pa.ownPrice[a][p], 0), 0) * (1 - disc);

  // Cost of sales
  const openingStockValue = op.product_stock_value;
  const materialsCost     = pa.matUsed * op.material_price / 1000;
  const wage = _num(d.assembly_wage.pounds) + _num(d.assembly_wage.pence) / 100;
  const assemblyWages    = pa.assyHrsUsed * wage * (1 + premium);
  const machinistsWages  = pa.machHrsUsed * MACHINIST_WAGE_PER_HR * (1 + premium);
  const machineRunning   = pa.machHrsUsed * t8.machine_running_per_hr;
  const closingStockValue = AREAS.reduce((s, a) =>
    s + PRODUCTS.reduce((s2, p) => s2 + closing[a][p] * t21.product_valuation[p], 0), 0);
  const costOfSales = openingStockValue + materialsCost + assemblyWages + machinistsWages + machineRunning - closingStockValue;
  const gross = revenue - costOfSales;

  // Overheads
  const promo = d.promotion;
  const advertising   = promo.advertising.reduce((s, x) => s + _num(x), 0) * 1000;
  const tradePressOH  = promo.trade_press.reduce((s, x) => s + _num(x), 0) * 1000;
  const supportOH     = promo.support.reduce((s, x) => s + _num(x), 0) * 1000;
  const merchandising = promo.merchandising.reduce((s, x) => s + _num(x), 0) * 1000;
  const nSp           = AREAS.reduce((s, a) => s + d.salespeople[a], 0);
  const salesPayroll  = nSp * Math.max(_num(d.sales_remuneration.quarterly_salary_000) * 1000, 2000);
  const salesForce    = salesPayroll + nSp * 3000;
  const research      = _num(d.research_expenditure_000) * 1000;
  const management    = _num(d.management_budget_000) * 1000;
  const ch = _num(d.contract_maintenance_hours);
  const maintenance   = ch * t4.contracted_per_hr_per_machine + 0.05 * ch * t4.uncontracted_per_hr;
  const supervision   = t8.supervision_per_shift * shift;
  const productionOH  = t8.production_overheads_per_machine * pa.machines;
  const planning      = t8.planning_per_unit * pa.totalSched;
  const info = d.info_wanted;
  const infoCharges   = (info.other_companies ? 5000 : 0) + (info.market_shares ? 5000 : 0);
  const creditControl = t20.credit_control_per_unit * unitsSold;
  const guarantee     = PRODUCTS.reduce((s, p) =>
    s + 0.02 * AREAS.reduce((s2, a) => s2 + sales[a][p], 0) * t7[p], 0);
  const closingTotal  = AREAS.reduce((s, a) => s + PRODUCTS.reduce((s2, p) => s2 + closing[a][p], 0), 0);
  const warehousing   = (
    t12.warehouse_fixed_per_q + t12.warehouse_admin_per_q
    + t12.per_order * _num(d.raw_material.num_deliveries)
    + t12.external_storage_per_unit * Math.max(0, closingTotal - t12.factory_storage_units)
    + t12.market_area_storage_per_unit * closingTotal
  );
  const fixedOverheads   = t20.fixed_overheads_per_q;
  const variableOverhead = t20.variable_overhead_rate * revenue;
  const totalOverheads   = advertising + tradePressOH + supportOH + merchandising
    + salesForce + research + management + maintenance + supervision + productionOH
    + planning + infoCharges + creditControl + guarantee + warehousing + fixedOverheads + variableOverhead;

  const operating    = gross - totalOverheads;
  const depreciation = t18.machine_depreciation_per_q * op.machines_value
                     + t18.vehicle_depreciation_per_q * op.vehicles_value;
  const interestReceived = op.cash * Math.max(0.0, mv.bank - 2) / 100 / 4;
  const interestPaid     = op.overdraft * (mv.bank + 4) / 100 / 4;
  const pbt    = operating + interestReceived - interestPaid - depreciation;
  const tax    = t20.tax_rate_annual * Math.max(pbt, 0);
  const net    = pbt - tax;
  const dividend = _num(d.dividend_rate_pence) / 100 * SHARES_ISSUED;
  const retained = net - dividend;

  // Balance sheet
  const soldM = pa.soldM, newM = pa.newM;
  const unitMV  = op.machines_count ? op.machines_value / op.machines_count : 0.0;
  const soldMV  = soldM * unitMV;
  const machinesValue = op.machines_value * (1 - t18.machine_depreciation_per_q)
                       + newM * t18.machine_order_payment - soldMV;
  const unitVV  = op.vehicles_count ? op.vehicles_value / op.vehicles_count : 0.0;
  const soldVV  = pa.soldV * unitVV;
  const vehiclesValue = op.vehicles_value * (1 - t18.vehicle_depreciation_per_q)
                       + pa.boughtV * t18.vehicle_cost - soldVV;
  const prop        = op.property;
  const fixedAssets = prop + machinesValue + vehiclesValue;
  const productStocks   = closingStockValue;
  const matClosing      = pa.matAvail - pa.matUsed;
  const materialStocks  = t21.material_valuation_rate * pa.matPrice * matClosing / 1000;
  const debtors         = revenue * _num(d.days_credit_allowed) / 90;
  const taxDue          = tax;
  const sup             = t14[d.raw_material.supplier_no];
  const materialPurchase = (pa.delivered * op.material_price / 1000 * (1 - sup.discount) + sup.delivery_charge);
  const afterNext = advertising + tradePressOH + supportOH + merchandising + infoCharges + guarantee + maintenance + creditControl;
  const nextQ     = research + salesPayroll + warehousing + materialPurchase + 0.5 * newM * t18.machine_order_payment;
  const creditors = nextQ + afterNext + op.prev_after_next;
  const noncash   = fixedAssets + productStocks + materialStocks + debtors;
  const reserves      = op.reserves + retained;
  const shareCapital  = parseFloat(INITIAL_STATE.share_capital);
  const netWorth      = shareCapital + reserves;
  const clExOd        = taxDue + creditors + op.unsecured;
  const plug          = netWorth + clExOd - noncash;
  let cash, overdraft;
  if (plug >= 0) { cash = plug; overdraft = 0.0; }
  else           { cash = 0.0;  overdraft = -plug; }
  const currentLiabilities = taxDue + creditors + overdraft + op.unsecured;
  const totalAssets = noncash + cash;
  const netAssets   = totalAssets - currentLiabilities;
  const odLimit = Math.max(0.0, cash + 0.5 * (productStocks + machinesValue + materialStocks + debtors) + 0.25 * prop - (taxDue + creditors));
  const spRaw   = op.share_price * (1 + 0.6 * net / Math.max(op.net_worth, 1));
  const sharePrice = Math.round(Math.max(0.10, Math.min(50.00, spRaw)) * 100 + 1e-7) / 100;

  // Cash flow
  const tradingReceipts  = revenue - (debtors - op.debtors);
  const cashCosts        = materialsCost + assemblyWages + machinistsWages + machineRunning + totalOverheads;
  const tradingPayments  = cashCosts - (creditors - op.creditors);
  const taxPaid          = op.tax_due;
  const netOperating     = tradingReceipts - tradingPayments - taxPaid;
  const capitalReceipts  = soldMV + soldVV;
  const capitalPayments  = newM * t18.machine_order_payment + pa.boughtV * t18.vehicle_cost;
  const netInvesting     = capitalReceipts - capitalPayments;
  const dividendsPaid    = dividend;
  const netFinancing     = (overdraft - op.overdraft) - dividendsPaid - interestPaid;
  const netCashFlow      = netOperating + netInvesting + netFinancing;

  // Products list
  const products = [];
  for (const a of AREAS) {
    for (const p of PRODUCTS) {
      products.push({
        product: p, area: a,
        scheduled:     parseInt(pa.sched[a][p]),
        produced:      parseInt(pa.produced[a][p]),
        rejected:      parseInt(pa.rejected[a][p]),
        demand:        parseInt(pa.demandUnits[a][p]),
        sales:         parseInt(sales[a][p]),
        backlog:       parseInt(backlog[a][p]),
        closing_stock: parseInt(closing[a][p]),
        price:         _r(pa.ownPrice[a][p]),
        improvement:   Boolean(d.product_improvements[p - 1]),
      });
    }
  }

  const utilM = pa.machAvail ? pa.machHrsUsed / pa.machAvail * 100 : 0.0;
  const utilA = pa.assyAvail ? pa.assyHrsUsed / pa.assyAvail * 100 : 0.0;

  const report = {
    meta: {
      industry_id:     industry.id,
      simulation_code: industry.simulation_code,
      group_number:    team.team.group_number || 1,
      company_number:  cn, company_name: name,
      year, quarter,
      published_at:    nowIso || new Date().toISOString(),
      auto_pass:       Boolean(team.auto_pass),
      demo_data:       false,
    },
    decisions: d,
    resources: {
      machines: {
        owned: pa.machines, new_installed: newM, sold: soldM,
        hours_available: _r(pa.machAvail), hours_used: _r(pa.machHrsUsed),
        utilisation_pct: _r(utilM),
        machinists: op.machinists,
        machinists_required: pa.machines * TABLES.T5[shift].machinists_per_machine,
      },
      assembly: {
        workers: pa.workers,
        hours_available: _r(pa.assyAvail), hours_used: _r(pa.assyHrsUsed),
        utilisation_pct: _r(utilA), wage_rate: _r(wage),
      },
      vehicles: { owned: pa.vehicles, bought: pa.boughtV, sold: pa.soldV },
      materials: {
        opening_stock: parseInt(op.material_stock),
        ordered: pa.ordered, delivered: pa.delivered,
        used: parseInt(pa.matUsed), closing_stock: parseInt(matClosing),
        price_per_1000: _r(pa.matPrice),
      },
    },
    products,
    overheads: {
      advertising: _r(advertising), trade_press: _r(tradePressOH),
      support: _r(supportOH), merchandising: _r(merchandising),
      sales_force: _r(salesForce), research: _r(research), management: _r(management),
      maintenance: _r(maintenance), supervision: _r(supervision),
      production_overheads: _r(productionOH), planning: _r(planning),
      info_charges: _r(infoCharges), credit_control: _r(creditControl),
      guarantee_servicing: _r(guarantee), warehousing: _r(warehousing),
      fixed_overheads: _r(fixedOverheads), variable_overhead: _r(variableOverhead),
      total: _r(totalOverheads),
    },
    pnl: {
      sales_revenue: _r(revenue), opening_stock_value: _r(openingStockValue),
      materials: _r(materialsCost), assembly_wages: _r(assemblyWages),
      machinists_wages: _r(machinistsWages), machine_running: _r(machineRunning),
      closing_stock_value: _r(closingStockValue), cost_of_sales: _r(costOfSales),
      gross_profit: _r(gross), total_overheads: _r(totalOverheads),
      operating_profit: _r(operating), interest_received: _r(interestReceived),
      interest_paid: _r(interestPaid), depreciation: _r(depreciation),
      profit_before_tax: _r(pbt), tax_assessed: _r(tax),
      net_profit: _r(net), dividend_paid: _r(dividend), retained_profit: _r(retained),
    },
    balance_sheet: {
      property: _r(prop), machines: _r(machinesValue), vehicles: _r(vehiclesValue),
      fixed_assets: _r(fixedAssets), product_stocks: _r(productStocks),
      material_stocks: _r(materialStocks), debtors: _r(debtors),
      cash_invested: _r(cash), total_assets: _r(totalAssets),
      tax_due: _r(taxDue), creditors: _r(creditors), bank_overdraft: _r(overdraft),
      unsecured_loans: _r(op.unsecured), current_liabilities: _r(currentLiabilities),
      net_assets: _r(netAssets), share_capital: _r(shareCapital),
      reserves: _r(reserves), net_worth: _r(netWorth), overdraft_limit: _r(odLimit),
    },
    cash_flow: {
      trading_receipts: _r(tradingReceipts), trading_payments: _r(tradingPayments),
      tax_paid: _r(taxPaid), net_operating: _r(netOperating),
      interest_received: _r(interestReceived), capital_receipts: _r(capitalReceipts),
      capital_payments: _r(capitalPayments), net_investing: _r(netInvesting),
      interest_paid: _r(interestPaid), dividends_paid: _r(dividendsPaid),
      net_financing: _r(netFinancing), net_cash_flow: _r(netCashFlow),
    },
    group: {}, // filled in computeQuarter once all teams are done
    economic: {
      gdp_growth_pct: mv.gdp, unemployment_pct: mv.unemp,
      central_bank_rate: mv.bank, inflation_pct: mv.infl,
      recession: mv.recession, material_price_next_q: _r(pa.matPrice),
    },
  };

  const dividendPct = sharePrice ? _r(_num(d.dividend_rate_pence) / 100 / sharePrice * 100) : 0.0;
  const summary = {
    company_number: cn, company_name: name,
    share_price: sharePrice, dividend_pct: dividendPct,
    net_profit: _r(net), net_worth: _r(netWorth),
  };
  return { report, summary };
}

// ── Main entry point ───────────────────────────────────────────────────────────

/**
 * Simulate one quarter for all teams.
 *
 * @param {object} industry  - { id, simulation_code, ... }
 * @param {number} year
 * @param {number} quarter
 * @param {Array}  teams     - [{ team_id, team: { company_number, name, group_number }, decisions, prev, auto_pass }]
 * @param {object} macro     - { gdp_growth_pct, inflation_pct, recession, central_bank_rate, unemployment_pct, material_price_change_pct }
 * @param {string} [nowIso]  - fixed timestamp for determinism testing
 * @returns {object}         - { [team_id]: report }
 */
function computeQuarter(industry, year, quarter, teams, macro, nowIso) {
  macro = macro || {};
  const mv = {
    gdp:        _num(macro.gdp_growth_pct, 2.5),
    infl:       _num(macro.inflation_pct, 0.0),
    recession:  Boolean(macro.recession),
    bank:       _num(macro.central_bank_rate, 8.0),
    unemp:      _num(macro.unemployment_pct, 5.0),
    mat_change: _num(macro.material_price_change_pct, 0.0),
  };

  const ordered = [...teams].sort((a, b) => a.team.company_number - b.team.company_number);
  const decs    = ordered.map(t => [t, _normDecisions(t.decisions)]);
  if (!decs.length) return {};

  // Average prices across all teams (for attractiveness/price elasticity)
  const avgPrice = {};
  for (const p of PRODUCTS) {
    avgPrice[p] = {
      home:   decs.reduce((s, [, d]) => s + d.prices.home[p - 1],   0) / decs.length,
      export: decs.reduce((s, [, d]) => s + d.prices.export[p - 1], 0) / decs.length,
    };
  }

  // Macro demand per area per product (before attractiveness share)
  const demand = {};
  for (const a of AREAS) {
    demand[a] = {};
    const hh = TABLES.T1.households[a];
    for (const p of PRODUCTS) {
      let q = hh * PENETRATION[p] * (1 + mv.gdp / 100) * (mv.recession ? 0.85 : 1) * (1 - mv.infl / 400);
      if (a === 'export') q *= EXPORT_DAMPING;
      demand[a][p] = Math.max(q, 1.0);
    }
  }

  // Phase A for every team
  const pas = decs.map(([t, d]) => _phaseA(t, d, mv, avgPrice));

  // Distribute demand shares via attractiveness index
  for (const a of AREAS) {
    for (const p of PRODUCTS) {
      const a1s  = pas.map(pa => pa.a1[a][p]);
      const s1   = a1s.reduce((s, v) => s + v, 0) || 1.0;
      pas.forEach((pa, i) => {
        const sh = a1s[i] / s1;
        pa.share[a][p]       = sh;
        pa.demandUnits[a][p] = Math.round(sh * demand[a][p]);
      });
    }
  }

  // Phase B for every team
  const reports = {}, summaries = [];
  for (let i = 0; i < decs.length; i++) {
    const [t, d] = decs[i];
    const { report, summary } = _phaseB(t, d, pas[i], mv, industry, year, quarter, nowIso);
    reports[t.team_id] = report;
    summaries.push(summary);
  }

  // Group section (same for all teams)
  const companies = summaries.map(s => ({
    company_number: s.company_number, company_name: s.company_name,
    share_price: s.share_price, dividend_pct: s.dividend_pct,
    net_profit: s.net_profit, net_worth: s.net_worth,
  }));
  const marketShares = {};
  for (const a of AREAS) {
    marketShares[a] = {};
    for (const p of PRODUCTS) {
      const sl  = pas.map(pa => pa.sales[a][p]);
      const tot = sl.reduce((s, v) => s + v, 0);
      marketShares[a][p] = sl.map(x => tot ? Math.round(x / tot * 10000) / 10000 : 0.0);
    }
  }
  const group = { companies, market_shares: marketShares };
  for (const rep of Object.values(reports)) rep.group = group;

  return reports;
}

module.exports = { computeQuarter };
