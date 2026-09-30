// Decision validation — ported from engine/topaz_engine/validation.py
// SPEC.md section 7. Never throws on bad input — returns array of error strings.

const { AREAS, PRODUCTS, TABLES, DEFAULT_DECISIONS } = require('./tables');

function _get(data, ...path) {
  let cur = data;
  for (const key of path) {
    if (cur && typeof cur === 'object' && key in cur) cur = cur[key];
    else { cur = null; break; }
  }
  if (cur !== null && cur !== undefined) return cur;
  // Fall back to default
  cur = DEFAULT_DECISIONS;
  for (const key of path) {
    if (cur && typeof cur === 'object' && key in cur) cur = cur[key];
    else return null;
  }
  return cur;
}

function _f(v, def = 0.0) {
  const n = parseFloat(v);
  return isFinite(n) ? n : def;
}

function _isNonNegInt(v) {
  if (typeof v === 'boolean') return false;
  const f = parseFloat(v);
  return isFinite(f) && Number.isInteger(f) && f >= 0;
}

function validateDecisions(data, funds) {
  data = data || {};
  const errors = [];

  // Rule 1: all 6 prices > 0
  const prices = _get(data, 'prices') || {};
  for (const [market, label] of [['export', 'Export market'], ['home', 'Home market']]) {
    const plist = prices[market] || [];
    for (let i = 0; i < 3; i++) {
      const v = _f(plist[i] !== undefined ? plist[i] : null, 0.0);
      if (!(v > 0)) {
        errors.push(`Price for Product ${i + 1} (${label}) must be greater than 0.`);
      }
    }
  }

  // Rule 2: assembly time >= product minimum
  const at = _get(data, 'assembly_time_minutes') || [];
  for (const p of PRODUCTS) {
    const m = TABLES.T3[p].assembly_min;
    const v = _f(at[p - 1] !== undefined ? at[p - 1] : null, -1.0);
    if (v < m) {
      errors.push(`Assembly time for Product ${p} cannot be below the minimum of ${m} minutes.`);
    }
  }

  // Rule 3: shift level
  if (![1, 2, 3].includes(_get(data, 'shift_level'))) {
    errors.push('Shift level must be 1, 2 or 3.');
  }

  // Rule 4: salary / management minima (values in £'000)
  if (_f(_get(data, 'sales_remuneration', 'quarterly_salary_000'), 0.0) < 2.0) {
    errors.push('Sales quarterly salary must be at least £2,000 (2.0 in £\'000).');
  }
  if (_f(_get(data, 'management_budget_000'), 0.0) < 40.0) {
    errors.push('Management budget must be at least £40,000 (40.0 in £\'000).');
  }

  // Rule 5: supplier number; supplier 3 has automatic deliveries
  const sup = _get(data, 'raw_material', 'supplier_no');
  if (![0, 1, 2, 3].includes(sup)) {
    errors.push('Supplier number must be 0, 1, 2 or 3.');
  }
  if (sup === 3 && _get(data, 'raw_material', 'num_deliveries') !== 0) {
    errors.push('Supplier 3 delivers automatically 12 times per quarter: num_deliveries must be 0.');
  }

  // Rule 6: counts/quantities are non-negative integers; percentages 0-100
  const intFields = [
    ...AREAS.map(a => [[`salespeople`, a], `Salespeople (${a})`]),
    ...['recruit', 'dismiss', 'train'].map(k => [['salespeople_changes', k], `Salespeople changes (${k})`]),
    ...['recruit', 'dismiss', 'train'].map(k => [['assembly_changes', k], `Assembly changes (${k})`]),
    [['machines_to_sell'],         'Machines to sell'],
    [['new_machines_to_order'],    'New machines to order'],
    [['vans_to_buy'],              'Vans to buy'],
    [['vans_to_sell'],             'Vans to sell'],
    [['contract_maintenance_hours'], 'Contract maintenance hours'],
    [['raw_material', 'units_to_order'],  'Raw material units to order'],
    [['raw_material', 'num_deliveries'],  'Raw material number of deliveries'],
    [['assembly_wage', 'pounds'], 'Assembly wage (pounds)'],
    [['assembly_wage', 'pence'],  'Assembly wage (pence)'],
  ];
  for (const [path, label] of intFields) {
    if (!_isNonNegInt(_get(data, ...path))) {
      errors.push(`${label} must be a non-negative integer.`);
    }
  }
  const md = _get(data, 'make_deliver') || {};
  for (const a of AREAS) {
    for (let i = 0; i < (md[a] || []).length; i++) {
      if (!_isNonNegInt(md[a][i])) {
        errors.push(`Make/deliver units for Product ${i + 1} (${a}) must be a non-negative integer.`);
      }
    }
  }
  const pct = _f(_get(data, 'sales_remuneration', 'commission_pct'), -1.0);
  if (!(pct >= 0 && pct <= 100)) {
    errors.push('Sales commission percentage must be between 0 and 100.');
  }

  // Rule 7: affordability
  const promo = _get(data, 'promotion') || {};
  const promo000 = ['trade_press', 'advertising', 'support', 'merchandising']
    .reduce((s, k) => s + (promo[k] || [0, 0, 0]).reduce((a, x) => a + _f(x), 0), 0);
  const nSp = AREAS.reduce((s, a) => s + _f((_get(data, 'salespeople') || {})[a], 0), 0);
  const sal000 = _f(_get(data, 'sales_remuneration', 'quarterly_salary_000'));
  const wage = _f(_get(data, 'assembly_wage', 'pounds')) + _f(_get(data, 'assembly_wage', 'pence')) / 100;
  const rawUnits = _f(_get(data, 'raw_material', 'units_to_order'));
  const supIdx = sup in TABLES.T14 ? sup : 1;
  const t14 = TABLES.T14[supIdx] || { discount: 0.0, delivery_charge: 0 };
  const committed = (
    (_f(_get(data, 'research_expenditure_000')) + _f(_get(data, 'management_budget_000')) + promo000) * 1000
    + nSp * Math.max(sal000 * 1000, 2000) + nSp * 3000
    + 48 * 420 * wage
    + rawUnits * 0.50 * (1 - t14.discount) + t14.delivery_charge
    + _f(_get(data, 'new_machines_to_order')) * 100000
    + _f(_get(data, 'vans_to_buy')) * 15000
  );
  const f = funds || { cash_invested: 400000, overdraft_limit: 0 };
  const avail = _f(f.cash_invested) + _f(f.overdraft_limit);
  if (committed > avail) {
    errors.push(
      `Committed spend £${Math.round(committed).toLocaleString('en-GB')} exceeds available funds ` +
      `£${Math.round(avail).toLocaleString('en-GB')} (cash + overdraft limit). ` +
      `Reduce promotion, orders or recruitment.`
    );
  }

  // Rule 8: dividend and credit >= 0
  if (_f(_get(data, 'dividend_rate_pence'), -1.0) < 0) {
    errors.push('Dividend rate must be at least 0 pence.');
  }
  if (_f(_get(data, 'days_credit_allowed'), -1.0) < 0) {
    errors.push('Days credit allowed must be at least 0.');
  }

  return errors;
}

module.exports = { validateDecisions };
