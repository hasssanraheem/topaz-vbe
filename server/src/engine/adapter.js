// adapter.js — converts between frontend (camelCase) decision format
// and engine (snake_case) format used by simulation.js.
// This lets the frontend keep its own field names while the engine stays canonical.

const { DEFAULT_DECISIONS } = require('./tables');

const AREAS_LOWER = ['export', 'south', 'west', 'north']; // engine order

/**
 * Convert frontend decision object → engine decision object.
 * Frontend stores full £ values; engine uses £'000 where noted.
 */
function frontendToEngine(f) {
  if (!f) return { ...DEFAULT_DECISIONS };
  const prom = f.promotion || {};

  // researchExp: frontend stores [P1,P2,P3] in full £ → engine uses total £'000
  const resArr = f.researchExp || [0, 0, 0];
  const resTotal000 = resArr.reduce((s, v) => s + (parseFloat(v) || 0), 0) / 1000;

  // assemblyWage: frontend stores float £ → engine uses {pounds, pence}
  const wage = parseFloat(f.assemblyWage) || 9.50;
  const wagePounds = Math.floor(wage);
  const wagePence  = Math.round((wage - wagePounds) * 100);

  // salespersonSalary: frontend stores full £ → engine uses £'000
  const salary000 = (parseFloat(f.salespersonSalary) || 2000) / 1000;

  // managementBudget: frontend stores full £ → engine uses £'000
  const budget000 = (parseFloat(f.managementBudget) || 40000) / 1000;

  // salespeopleAlloc: frontend [export, south, west, north] → engine {export, south, west, north}
  const alloc = f.salespeopleAlloc || [2, 4, 3, 5];
  const salespeople = {
    export: parseInt(alloc[0]) || 0,
    south:  parseInt(alloc[1]) || 0,
    west:   parseInt(alloc[2]) || 0,
    north:  parseInt(alloc[3]) || 0,
  };

  // deliverySchedule: frontend [product][area] → engine make_deliver: {area: [P1,P2,P3]}
  const ds = f.deliverySchedule || [[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  const makeDeliver = {};
  for (let ai = 0; ai < 4; ai++) {
    const aName = AREAS_LOWER[ai];
    makeDeliver[aName] = [
      parseInt(ds[0]?.[ai]) || 0,
      parseInt(ds[1]?.[ai]) || 0,
      parseInt(ds[2]?.[ai]) || 0,
    ];
  }

  // Personnel changes
  const spChanges = {
    recruit: parseInt(f.salespeopleRecruit) || 0,
    dismiss: parseInt(f.salespersonsDismiss) || 0,
    train:   parseInt(f.salespersonsTrain)  || 0,
  };
  const asmChanges = {
    recruit: parseInt(f.assemblyRecruit) || 0,
    dismiss: parseInt(f.assemblyDismiss) || 0,
    train:   parseInt(f.assemblyTrain)   || 0,
  };

  // Promotion: frontend has tradePres/adSupport/merchandising/support (all in full £)
  // engine expects trade_press/advertising/support/merchandising in £'000 per product
  function promConvert(arr) {
    return [0, 1, 2].map(i => (parseFloat(arr?.[i]) || 0) / 1000);
  }

  return {
    product_improvements:  (f.implementImprovement || [false, false, false]).map(Boolean),
    prices: {
      export: (f.prices?.export || [120, 180, 260]).map(Number),
      home:   (f.prices?.home   || [110, 165, 240]).map(Number),
    },
    promotion: {
      trade_press:  promConvert(prom.tradePres),
      advertising:  promConvert(prom.adSupport),
      support:      promConvert(prom.support),
      merchandising:promConvert(prom.merchandising),
    },
    assembly_time_minutes: (f.assemblyTimes || [110, 160, 320]).map(Number),
    salespeople,
    sales_remuneration: {
      quarterly_salary_000: salary000,
      commission_pct: parseFloat(f.salesCommission) || 5.0,
    },
    assembly_wage: { pounds: wagePounds, pence: wagePence },
    shift_level:   parseInt(f.shiftLevel) || 1,
    management_budget_000: budget000,
    contract_maintenance_hours: parseInt(f.contractMaintenance) || 0,
    machines_to_sell:     parseInt(f.machinesToSell)  || 0,
    new_machines_to_order:parseInt(f.machinesToOrder) || 0,
    dividend_rate_pence:  parseFloat(f.dividendRate)  || 0,
    days_credit_allowed:  parseInt(f.daysCredit)      || 30,
    vans_to_buy:  parseInt(f.vansToBuy)  || 0,
    vans_to_sell: parseInt(f.vansToSell) || 0,
    info_wanted: {
      other_companies: Boolean(f.buyCompetitorInfo),
      market_shares:   Boolean(f.buyMarketShares),
    },
    make_deliver: makeDeliver,
    research_expenditure_000: resTotal000,
    salespeople_changes: spChanges,
    assembly_changes:    asmChanges,
    raw_material: {
      units_to_order: parseInt(f.materialsQty)       || 0,
      supplier_no:    parseInt(f.materialsSupplier)   || 1,
      num_deliveries: parseInt(f.materialsDeliveries) || 1,
    },
  };
}

module.exports = { frontendToEngine };
