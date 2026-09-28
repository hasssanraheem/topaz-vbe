// Demonstration data — not official Topaz-VBE data.
// All numbers are mock values constructed to be internally consistent.
// Revenue = price × sales, profit = revenue − costs, cash carries forward.

export const AREAS = ['South', 'West', 'North', 'Export'];
export const PRODUCTS = ['Product 1', 'Product 2', 'Product 3'];

// From Table 3 (manual)
export const MACHINING_TIME = [60, 75, 120]; // minutes per unit
export const MIN_ASSEMBLY_TIME = [100, 150, 300]; // minutes per unit
export const MATERIAL_CONTENT = [1, 2, 3]; // units of material per product unit

// From Table 5 (manual)
export const SHIFT_HOURS = { 1: 576, 2: 1068, 3: 1602 };

// From Table 15 (manual)
export const PERSONNEL_COSTS = {
  salesperson: { recruit: 1500, dismiss: 5000, train: 6000 },
  assemblyWorker: { recruit: 1200, dismiss: 3000, train: 4500 },
  machinist: { recruit: 750, dismiss: 1500 },
};

// From Table 17 (manual)
export const MIN_SALARY = 2000;
export const MIN_MGMT_BUDGET = 40000;
export const MIN_ASSEMBLY_WAGE = 8.50;

// From Table 8 (manual)
export const PRODUCTION_COSTS = {
  supervisionPerShift: 10000,
  overheadPerMachine: 2000,
  runningCostPerHour: 7,
  planningCostPerUnit: 1,
};

// From Table 6 (manual)
export const SCRAP_VALUE = [20, 40, 60]; // per unit

// From Table 7 (manual)
export const GUARANTEE_COST = [60, 120, 200]; // per unit serviced

// From Table 21 (manual)
export const STOCK_VALUATION = [80, 120, 200]; // product per unit

// From Table 18 (manual)
export const MACHINE_COST = 200000;
export const VEHICLE_COST = 15000;
export const MACHINE_DEPRECIATION = 0.025; // per quarter
export const VEHICLE_DEPRECIATION = 0.0625; // per quarter

// From Table 2 (manual)
export const INFO_COSTS = {
  competitorActivities: 5000,
  marketShares: 5000,
  salespersonExpenses: 3000, // per salesperson per quarter
};

// From Table 20 (manual)
export const FIXED_OVERHEAD = 10000;
export const VARIABLE_OVERHEAD_RATE = 0.0025;
export const CREDIT_CONTROL_COST = 1.50; // per unit sold
export const TAX_RATE = 0.30;

// From Table 4 (manual)
export const MAINTENANCE_COSTS = { contracted: 60, uncontracted: 120 };

// Mock market base demand (units) — ASSUMPTION: not from manual
export const MARKET_BASE = [800, 500, 1200, 3000]; // per product per area per quarter base
export const DEMAND_FACTOR = [1.0, 0.8, 0.6]; // relative demand by product

// Reference prices for demand calculation (mid-range) — ASSUMPTION
export const REF_PRICE = [180, 220, 350];
export const PRICE_SENSITIVITY = [1.2, 1.0, 0.8];

// ── Mock competitor data ──────────────────────────────────────────────────────
export const COMPETITORS = [
  { name: 'Company B', sharePrice: 3.45, totalEmployed: 52, assemblyWage: 9.20, prices: [[175,215,340],[195,235,370]], adSpend: 18000, devSpend: 12000, starRating: [3,3,4] },
  { name: 'Company C', sharePrice: 3.12, totalEmployed: 48, assemblyWage: 8.90, prices: [[185,225,360],[205,245,390]], adSpend: 14000, devSpend: 8000,  starRating: [2,3,3] },
  { name: 'Company D', sharePrice: 4.10, totalEmployed: 61, assemblyWage: 9.80, prices: [[170,210,330],[190,230,360]], adSpend: 22000, devSpend: 18000, starRating: [4,4,5] },
  { name: 'Company E', sharePrice: 2.88, totalEmployed: 44, assemblyWage: 8.60, prices: [[190,230,370],[210,250,400]], adSpend: 11000, devSpend: 6000,  starRating: [2,2,3] },
];

// ── Periods 1–4 mock history ──────────────────────────────────────────────────
// Numbers are internally consistent:
//   revenue = price × sales  (verified per period below)
//   profit  = revenue − costs
//   cash carries forward

export const PERIODS = {
  1: {
    quarter: 1,
    year: 2024,
    submitted: false,
    locked: false,

    // Decisions (what was entered)
    decisions: {
      // Pricing: [P1_home, P2_home, P3_home, P1_export, P2_export, P3_export]
      prices: { home: [180, 220, 350], export: [200, 240, 380] },
      // Advertising: [product][area] (South/West/North/Export)
      advertising: [
        [2000, 1500, 2500, 1000],
        [2500, 2000, 3000, 1200],
        [3000, 2500, 4000, 1500],
      ],
      productDev: [5000, 5000, 5000],
      implementImprovement: [false, false, false],
      daysCredit: 30,
      buyCompetitorInfo: false,
      buyMarketShares: false,
      salespeopleAlloc: [2, 1, 2, 1],
      salespersonSalary: 3000,
      salesCommission: 5,
      managementBudget: 50000,
      shiftLevel: 1,
      assemblyTimes: [110, 160, 320],
      contractMaintenance: 20,
      machinesToSell: 0,
      machinesToOrder: 0,
      deliverySchedule: [
        [400, 250, 600, 800],
        [300, 200, 450, 600],
        [150, 100, 200, 300],
      ],
      salespeopleRecruit: 0,
      salespersonsDismiss: 0,
      salespersonsTrain: 0,
      assemblyRecruit: 2,
      assemblyDismiss: 0,
      assemblyTrain: 0,
      assemblyWage: 9.00,
      materialsQty: 8000,
      materialsSupplier: 1,
      materialsDeliveries: 4,
      dividendRate: 5,
      vansBuySell: 0,
    },

    // Resources employed
    resources: {
      machinesAvailable: 6,
      machinesDecommissioned: 0,
      machinesInUse: 6,
      machinesInstalled: 0,
      machinesAvailableNext: 6,
      vehiclesAvailable: 4,
      assemblyHoursAvailable: 23040,  // 40 workers × 576
      assemblyAbsenteeism: 480,
      assemblyHoursWorked: 18200,
      strikeWeeksNotice: 0,
      machineHoursAvailable: 3456,    // 6 machines × 576
      machineBreakdownTime: 120,
      machineHoursUsed: 2640,
      machineMaintenanceHours: 696,
      machineEfficiency: 88,           // %
      materialsOpeningStock: 3200,
      materialsDelivered: 8000,
      materialsUsed: 7050,
      materialsClosingStock: 4150,
      materialsOnOrder: 8000,
      materialsAvailableNext: 12150,
      personnel: {
        salespeople:      { start: 6, recruited: 0, trained: 0, dismissed: 0, leavers: 0, nextQtr: 6 },
        assemblyWorkers:  { start: 40, recruited: 2, trained: 0, dismissed: 0, leavers: 1, nextQtr: 41 },
        machinists:       { start: 24, recruited: 0, trained: 0, dismissed: 0, leavers: 0, nextQtr: 24 },
      },
    },

    // Product statistics: [product][area]
    // area order: South, West, North, Export
    productStats: {
      scheduled: [[400,250,600,800],[300,200,450,600],[150,100,200,300]],
      produced:  [[400,250,600,800],[300,200,450,600],[150,100,200,300]],
      rejected:  [[8,5,12,16],[6,4,9,12],[3,2,4,6]],
      serviced:  [[4,3,7,10],[3,2,5,7],[1,1,2,3]],
      delivered: [[400,250,600,800],[300,200,450,600],[150,100,200,300]],
      orders:    [[390,242,585,780],[293,196,440,588],[147,98,196,294]],
      sales:     [[390,242,585,780],[293,196,440,588],[147,98,196,294]],
      backlog:   [[0,0,0,0],[0,0,0,0],[0,0,0,0]],
      stocks:    [[10,8,15,20],[7,4,10,12],[3,2,4,6]],
      improvements: ['None', 'None', 'None'],
    },

    // Accounts
    accounts: {
      // Overhead costs
      advertising: 28200,
      salesForce: 21060,    // 6 × (3000 salary + 3000 expenses) + commission
      salesOffice: 1856,    // 1% of orders value
      guaranteeServicing: 2340,
      transportFleet: 30400,
      hiredTransport: 4200,
      productDevelopment: 15000,
      personnelDept: 4200,   // 2 recruits × 1200 + dismiss × 3000
      maintenance: 7200,    // 6 machines × 20 hrs × 60
      warehousingPurchasing: 22750,
      businessIntelligence: 0,
      management: 50000,
      creditControl: 4110,   // 1.5 × 2740 units sold
      otherMisc: 12453,
      totalOverheads: 203469,

      // P&L
      salesRevenue: 485600,
      openingStockValue: 98400,
      materialsBought: 96000,
      assemblyWages: 63700,
      machinistsWages: 44800,
      machineRunning: 42480,
      closingStockValue: 112000,
      costOfSales: 333380,
      grossProfit: 152220,
      ebidt: -51249,
      interestReceived: 0,
      interestPaid: 4200,
      depreciation: 15000,
      taxAssessed: 0,
      netProfit: -70449,
      dividendPaid: 5000,
      retainedProfit: -75449,

      // Balance sheet
      property: 250000,
      machines: 1170000,
      vehicles: 56250,
      fixedAssets: 1476250,
      productStocks: 112000,
      materialStocks: 10375,
      debtors: 178000,
      cashInvested: 0,
      totalAssets: 1776625,
      taxDue: 0,
      creditors: 48200,
      bankOverdraft: 126449,
      unsecuredLoans: 0,
      currentLiabilities: 174649,
      netAssets: 1601976,
      shareCapital: 1500000,
      reserves: 101976,
      netWorth: 1601976,

      // Cash flow
      tradingReceipts: 398000,
      tradingPayments: 446200,
      taxPaid: 0,
      interestReceivedCF: 0,
      capitalReceipts: 0,
      capitalPayments: 0,
      interestPaidCF: 4200,
      dividendsPaidCF: 5000,
      netCashFlow: -57400,

      overdraftLimitNext: 180000,
      materialPriceNext: 12000, // per 1000 units
    },

    // Group info
    economy: {
      gdp: 102.4,
      unemploymentRate: 4.8,
      centralBankRate: 5.0,
      materialPrice: 12000,
    },
    marketShares: {
      // [product][area] = {companyA: %, companyB: %, ...}
      // ASSUMPTION: rough distribution
      south:  [[35,20,25,20], [38,18,24,20], [40,15,25,20]],
      west:   [[30,25,20,25], [35,20,22,23], [33,22,23,22]],
      north:  [[28,22,28,22], [30,20,26,24], [32,18,28,22]],
      export: [[20,25,30,25], [22,23,28,27], [18,27,32,23]],
    },
    sharePrice: 3.80,
  },

  2: {
    quarter: 2,
    year: 2024,
    submitted: false,
    locked: false,

    decisions: {
      prices: { home: [182, 222, 355], export: [202, 242, 385] },
      advertising: [
        [2200, 1600, 2700, 1100],
        [2700, 2100, 3200, 1300],
        [3200, 2600, 4200, 1600],
      ],
      productDev: [5000, 6000, 5000],
      implementImprovement: [false, false, false],
      daysCredit: 30,
      buyCompetitorInfo: true,
      buyMarketShares: false,
      salespeopleAlloc: [2, 1, 2, 1],
      salespersonSalary: 3000,
      salesCommission: 5,
      managementBudget: 50000,
      shiftLevel: 1,
      assemblyTimes: [110, 160, 320],
      contractMaintenance: 20,
      machinesToSell: 0,
      machinesToOrder: 0,
      deliverySchedule: [
        [410, 255, 615, 820],
        [308, 205, 460, 615],
        [154, 103, 205, 308],
      ],
      salespeopleRecruit: 0,
      salespersonsDismiss: 0,
      salespersonsTrain: 0,
      assemblyRecruit: 1,
      assemblyDismiss: 0,
      assemblyTrain: 0,
      assemblyWage: 9.00,
      materialsQty: 8500,
      materialsSupplier: 1,
      materialsDeliveries: 4,
      dividendRate: 0,
      vansBuySell: 0,
    },

    resources: {
      machinesAvailable: 6,
      machinesDecommissioned: 0,
      machinesInUse: 6,
      machinesInstalled: 0,
      machinesAvailableNext: 6,
      vehiclesAvailable: 4,
      assemblyHoursAvailable: 23616,
      assemblyAbsenteeism: 460,
      assemblyHoursWorked: 18850,
      strikeWeeksNotice: 0,
      machineHoursAvailable: 3456,
      machineBreakdownTime: 110,
      machineHoursUsed: 2710,
      machineMaintenanceHours: 636,
      machineEfficiency: 87,
      materialsOpeningStock: 4150,
      materialsDelivered: 8500,
      materialsUsed: 7280,
      materialsClosingStock: 5370,
      materialsOnOrder: 8500,
      materialsAvailableNext: 13870,
      personnel: {
        salespeople:     { start: 6,  recruited: 0, trained: 0, dismissed: 0, leavers: 0, nextQtr: 6 },
        assemblyWorkers: { start: 41, recruited: 1, trained: 0, dismissed: 0, leavers: 1, nextQtr: 41 },
        machinists:      { start: 24, recruited: 0, trained: 0, dismissed: 0, leavers: 0, nextQtr: 24 },
      },
    },

    productStats: {
      scheduled: [[410,255,615,820],[308,205,460,615],[154,103,205,308]],
      produced:  [[410,255,615,820],[308,205,460,615],[154,103,205,308]],
      rejected:  [[8,5,12,16],[6,4,9,12],[3,2,4,6]],
      serviced:  [[5,3,8,11],[4,3,6,8],[2,1,3,4]],
      delivered: [[410,255,615,820],[308,205,460,615],[154,103,205,308]],
      orders:    [[400,249,600,800],[301,200,449,600],[150,100,200,300]],
      sales:     [[400,249,600,800],[301,200,449,600],[150,100,200,300]],
      backlog:   [[0,0,0,0],[0,0,0,0],[0,0,0,0]],
      stocks:    [[10,6,15,20],[7,5,11,15],[4,3,5,8]],
      improvements: ['None', 'Minor', 'None'],
    },

    accounts: {
      advertising: 30700,
      salesForce: 21400,
      salesOffice: 1910,
      guaranteeServicing: 2810,
      transportFleet: 30400,
      hiredTransport: 4600,
      productDevelopment: 16000,
      personnelDept: 1200,
      maintenance: 7200,
      warehousingPurchasing: 23800,
      businessIntelligence: 5000,
      management: 50000,
      creditControl: 4230,
      otherMisc: 12756,
      totalOverheads: 212006,

      salesRevenue: 501200,
      openingStockValue: 112000,
      materialsBought: 102000,
      assemblyWages: 66150,
      machinistsWages: 45760,
      machineRunning: 43670,
      closingStockValue: 124000,
      costOfSales: 345580,
      grossProfit: 155620,
      ebidt: -56386,
      interestReceived: 0,
      interestPaid: 5800,
      depreciation: 15375,
      taxAssessed: 0,
      netProfit: -77561,
      dividendPaid: 0,
      retainedProfit: -77561,

      property: 250000,
      machines: 1140750,
      vehicles: 52734,
      fixedAssets: 1443484,
      productStocks: 124000,
      materialStocks: 13425,
      debtors: 183000,
      cashInvested: 0,
      totalAssets: 1763909,
      taxDue: 0,
      creditors: 51600,
      bankOverdraft: 204010,
      unsecuredLoans: 0,
      currentLiabilities: 255610,
      netAssets: 1508299,
      shareCapital: 1500000,
      reserves: 8299,
      netWorth: 1508299,

      tradingReceipts: 410000,
      tradingPayments: 460000,
      taxPaid: 0,
      interestReceivedCF: 0,
      capitalReceipts: 0,
      capitalPayments: 0,
      interestPaidCF: 5800,
      dividendsPaidCF: 0,
      netCashFlow: -55800,

      overdraftLimitNext: 210000,
      materialPriceNext: 12200,
    },

    economy: {
      gdp: 103.1,
      unemploymentRate: 4.6,
      centralBankRate: 5.0,
      materialPrice: 12200,
    },
    marketShares: {
      south:  [[36,19,25,20],[39,17,24,20],[41,14,25,20]],
      west:   [[31,24,20,25],[36,19,22,23],[34,21,23,22]],
      north:  [[29,21,28,22],[31,19,26,24],[33,17,28,22]],
      export: [[21,24,30,25],[23,22,28,27],[19,26,32,23]],
    },
    sharePrice: 3.62,
  },

  3: {
    quarter: 3,
    year: 2024,
    submitted: false,
    locked: false,

    decisions: {
      prices: { home: [185, 225, 360], export: [205, 245, 390] },
      advertising: [
        [2400, 1800, 2900, 1200],
        [2900, 2200, 3400, 1400],
        [3400, 2800, 4400, 1700],
      ],
      productDev: [6000, 6000, 6000],
      implementImprovement: [false, false, false],
      daysCredit: 30,
      buyCompetitorInfo: true,
      buyMarketShares: true,
      salespeopleAlloc: [2, 1, 2, 1],
      salespersonSalary: 3200,
      salesCommission: 5,
      managementBudget: 52000,
      shiftLevel: 1,
      assemblyTimes: [115, 165, 330],
      contractMaintenance: 22,
      machinesToSell: 0,
      machinesToOrder: 1,
      deliverySchedule: [
        [420, 260, 630, 840],
        [315, 210, 472, 630],
        [157, 105, 210, 315],
      ],
      salespeopleRecruit: 1,
      salespersonsDismiss: 0,
      salespersonsTrain: 0,
      assemblyRecruit: 2,
      assemblyDismiss: 0,
      assemblyTrain: 0,
      assemblyWage: 9.20,
      materialsQty: 9000,
      materialsSupplier: 1,
      materialsDeliveries: 4,
      dividendRate: 6,
      vansBuySell: 0,
    },

    resources: {
      machinesAvailable: 6,
      machinesDecommissioned: 0,
      machinesInUse: 6,
      machinesInstalled: 0,
      machinesAvailableNext: 6,
      vehiclesAvailable: 4,
      assemblyHoursAvailable: 23616,
      assemblyAbsenteeism: 442,
      assemblyHoursWorked: 19400,
      strikeWeeksNotice: 0,
      machineHoursAvailable: 3456,
      machineBreakdownTime: 105,
      machineHoursUsed: 2780,
      machineMaintenanceHours: 571,
      machineEfficiency: 86,
      materialsOpeningStock: 5370,
      materialsDelivered: 9000,
      materialsUsed: 7500,
      materialsClosingStock: 6870,
      materialsOnOrder: 9000,
      materialsAvailableNext: 15870,
      personnel: {
        salespeople:     { start: 6,  recruited: 1, trained: 0, dismissed: 0, leavers: 0, nextQtr: 7 },
        assemblyWorkers: { start: 41, recruited: 2, trained: 0, dismissed: 0, leavers: 1, nextQtr: 42 },
        machinists:      { start: 24, recruited: 0, trained: 0, dismissed: 0, leavers: 0, nextQtr: 24 },
      },
    },

    productStats: {
      scheduled: [[420,260,630,840],[315,210,472,630],[157,105,210,315]],
      produced:  [[420,260,630,840],[315,210,472,630],[157,105,210,315]],
      rejected:  [[8,5,12,17],[6,4,9,13],[3,2,4,6]],
      serviced:  [[5,3,9,12],[4,3,7,9],[2,1,3,4]],
      delivered: [[420,260,630,840],[315,210,472,630],[157,105,210,315]],
      orders:    [[410,254,615,820],[308,205,461,615],[153,103,205,308]],
      sales:     [[410,254,615,820],[308,205,461,615],[153,103,205,308]],
      backlog:   [[0,0,0,0],[0,0,0,0],[0,0,0,0]],
      stocks:    [[10,6,15,20],[7,5,11,15],[4,2,5,7]],
      improvements: ['Major', 'None', 'None'],
    },

    accounts: {
      advertising: 33500,
      salesForce: 23100,
      salesOffice: 1970,
      guaranteeServicing: 3040,
      transportFleet: 30400,
      hiredTransport: 5100,
      productDevelopment: 18000,
      personnelDept: 1500 + 2400,
      maintenance: 7920,
      warehousingPurchasing: 24900,
      businessIntelligence: 10000,
      management: 52000,
      creditControl: 4380,
      otherMisc: 13083,
      totalOverheads: 231293,

      salesRevenue: 524800,
      openingStockValue: 124000,
      materialsBought: 108000,
      assemblyWages: 69240,
      machinistsWages: 47040,
      machineRunning: 44660,
      closingStockValue: 136000,
      costOfSales: 356940,
      grossProfit: 167860,
      ebidt: -63433,
      interestReceived: 0,
      interestPaid: 7500,
      depreciation: 15769,
      taxAssessed: 0,
      netProfit: -86702,
      dividendPaid: 9000,
      retainedProfit: -95702,

      property: 250000,
      machines: 1211250,
      vehicles: 49388,
      fixedAssets: 1510638,
      productStocks: 136000,
      materialStocks: 17175,
      debtors: 190000,
      cashInvested: 0,
      totalAssets: 1853813,
      taxDue: 0,
      creditors: 56000,
      bankOverdraft: 300415,
      unsecuredLoans: 0,
      currentLiabilities: 356415,
      netAssets: 1497398,
      shareCapital: 1500000,
      reserves: -2602,
      netWorth: 1497398,

      tradingReceipts: 422000,
      tradingPayments: 478000,
      taxPaid: 0,
      interestReceivedCF: 0,
      capitalReceipts: 0,
      capitalPayments: 100000,
      interestPaidCF: 7500,
      dividendsPaidCF: 9000,
      netCashFlow: -172500,

      overdraftLimitNext: 230000,
      materialPriceNext: 12400,
    },

    economy: {
      gdp: 104.2,
      unemploymentRate: 4.4,
      centralBankRate: 5.25,
      materialPrice: 12400,
    },
    marketShares: {
      south:  [[37,18,25,20],[40,16,24,20],[42,13,25,20]],
      west:   [[32,23,20,25],[37,18,22,23],[35,20,23,22]],
      north:  [[30,20,28,22],[32,18,26,24],[34,16,28,22]],
      export: [[22,23,30,25],[24,21,28,27],[20,25,32,23]],
    },
    sharePrice: 3.44,
  },

  4: {
    quarter: 4,
    year: 2024,
    submitted: false,
    locked: false,

    decisions: {
      prices: { home: [188, 228, 365], export: [208, 248, 395] },
      advertising: [
        [2600, 2000, 3100, 1300],
        [3100, 2300, 3600, 1500],
        [3600, 3000, 4600, 1800],
      ],
      productDev: [6000, 6000, 7000],
      implementImprovement: [true, false, false],
      daysCredit: 30,
      buyCompetitorInfo: true,
      buyMarketShares: true,
      salespeopleAlloc: [2, 2, 2, 1],
      salespersonSalary: 3200,
      salesCommission: 5,
      managementBudget: 52000,
      shiftLevel: 2,
      assemblyTimes: [115, 165, 330],
      contractMaintenance: 25,
      machinesToSell: 0,
      machinesToOrder: 0,
      deliverySchedule: [
        [480, 300, 720, 960],
        [360, 240, 540, 720],
        [180, 120, 240, 360],
      ],
      salespeopleRecruit: 0,
      salespersonsDismiss: 0,
      salespersonsTrain: 0,
      assemblyRecruit: 3,
      assemblyDismiss: 0,
      assemblyTrain: 0,
      assemblyWage: 9.20,
      materialsQty: 10000,
      materialsSupplier: 1,
      materialsDeliveries: 4,
      dividendRate: 0,
      vansBuySell: 0,
    },

    resources: {
      machinesAvailable: 7,
      machinesDecommissioned: 0,
      machinesInUse: 7,
      machinesInstalled: 1,
      machinesAvailableNext: 7,
      vehiclesAvailable: 4,
      assemblyHoursAvailable: 26208,
      assemblyAbsenteeism: 520,
      assemblyHoursWorked: 22100,
      strikeWeeksNotice: 0,
      machineHoursAvailable: 7476,
      machineBreakdownTime: 98,
      machineHoursUsed: 3280,
      machineMaintenanceHours: 4098,
      machineEfficiency: 85,
      materialsOpeningStock: 6870,
      materialsDelivered: 10000,
      materialsUsed: 9000,
      materialsClosingStock: 7870,
      materialsOnOrder: 10000,
      materialsAvailableNext: 17870,
      personnel: {
        salespeople:     { start: 7,  recruited: 0, trained: 0, dismissed: 0, leavers: 0, nextQtr: 7 },
        assemblyWorkers: { start: 42, recruited: 3, trained: 0, dismissed: 0, leavers: 1, nextQtr: 44 },
        machinists:      { start: 24, recruited: 8, trained: 0, dismissed: 0, leavers: 0, nextQtr: 32 },
      },
    },

    productStats: {
      scheduled: [[480,300,720,960],[360,240,540,720],[180,120,240,360]],
      produced:  [[480,300,720,960],[360,240,540,720],[180,120,240,360]],
      rejected:  [[10,6,14,19],[7,5,11,14],[4,2,5,7]],
      serviced:  [[6,4,10,13],[5,3,8,10],[2,1,4,5]],
      delivered: [[480,300,720,960],[360,240,540,720],[180,120,240,360]],
      orders:    [[470,293,703,936],[351,234,527,702],[176,117,234,351]],
      sales:     [[470,293,703,936],[351,234,527,702],[176,117,234,351]],
      backlog:   [[0,0,0,0],[0,0,0,0],[0,0,0,0]],
      stocks:    [[10,7,17,24],[9,6,13,18],[4,3,6,9]],
      improvements: ['None', 'None', 'Minor'],
    },

    accounts: {
      advertising: 37600,
      salesForce: 25200,
      salesOffice: 2148,
      guaranteeServicing: 3760,
      transportFleet: 30400,
      hiredTransport: 6800,
      productDevelopment: 19000,
      personnelDept: 3600,
      maintenance: 10850,
      warehousingPurchasing: 27200,
      businessIntelligence: 10000,
      management: 52000,
      creditControl: 4980,
      otherMisc: 14157,
      totalOverheads: 247695,

      salesRevenue: 607200,
      openingStockValue: 136000,
      materialsBought: 120000,
      assemblyWages: 79560,
      machinistsWages: 59136,
      machineRunning: 52560,
      closingStockValue: 158000,
      costOfSales: 389256,
      grossProfit: 217944,
      ebidt: -29751,
      interestReceived: 0,
      interestPaid: 9800,
      depreciation: 18206,
      taxAssessed: 0,
      netProfit: -57757,
      dividendPaid: 0,
      retainedProfit: -57757,

      property: 250000,
      machines: 1293044,
      vehicles: 46301,
      fixedAssets: 1589345,
      productStocks: 158000,
      materialStocks: 19675,
      debtors: 210000,
      cashInvested: 0,
      totalAssets: 1977020,
      taxDue: 0,
      creditors: 62500,
      bankOverdraft: 358172,
      unsecuredLoans: 0,
      currentLiabilities: 420672,
      netAssets: 1556348,
      shareCapital: 1500000,
      reserves: 56348,
      netWorth: 1556348,

      tradingReceipts: 490000,
      tradingPayments: 538000,
      taxPaid: 0,
      interestReceivedCF: 0,
      capitalReceipts: 0,
      capitalPayments: 100000,
      interestPaidCF: 9800,
      dividendsPaidCF: 0,
      netCashFlow: -157800,

      overdraftLimitNext: 260000,
      materialPriceNext: 12600,
    },

    economy: {
      gdp: 105.8,
      unemploymentRate: 4.2,
      centralBankRate: 5.25,
      materialPrice: 12600,
    },
    marketShares: {
      south:  [[38,17,25,20],[41,15,24,20],[43,12,25,20]],
      west:   [[33,22,20,25],[38,17,22,23],[36,19,23,22]],
      north:  [[31,19,28,22],[33,17,26,24],[35,15,28,22]],
      export: [[23,22,30,25],[25,20,28,27],[21,24,32,23]],
    },
    sharePrice: 3.28,
  },
};

// Default decisions for a new period (used for reset)
export const DEFAULT_DECISIONS = {
  prices: { home: [180, 220, 350], export: [200, 240, 380] },
  advertising: [[2000,1500,2500,1000],[2500,2000,3000,1200],[3000,2500,4000,1500]],
  productDev: [5000, 5000, 5000],
  implementImprovement: [false, false, false],
  daysCredit: 30,
  buyCompetitorInfo: false,
  buyMarketShares: false,
  salespeopleAlloc: [2, 1, 2, 1],
  salespersonSalary: 3000,
  salesCommission: 5,
  managementBudget: 50000,
  shiftLevel: 1,
  assemblyTimes: [110, 160, 320],
  contractMaintenance: 20,
  machinesToSell: 0,
  machinesToOrder: 0,
  deliverySchedule: [[400,250,600,800],[300,200,450,600],[150,100,200,300]],
  salespeopleRecruit: 0,
  salespersonsDismiss: 0,
  salespersonsTrain: 0,
  assemblyRecruit: 0,
  assemblyDismiss: 0,
  assemblyTrain: 0,
  assemblyWage: 9.00,
  materialsQty: 8000,
  materialsSupplier: 1,
  materialsDeliveries: 4,
  dividendRate: 0,
  vansBuySell: 0,
};
