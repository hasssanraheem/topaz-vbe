// calculations.js
// SIMPLIFIED model — not the proprietary Topaz-VBE engine.
// These formulas are clearly labelled approximations for educational use.
// See Help page for full disclaimer.

import {
  MACHINING_TIME, MIN_ASSEMBLY_TIME, MATERIAL_CONTENT,
  SHIFT_HOURS, PRODUCTION_COSTS, SCRAP_VALUE, GUARANTEE_COST,
  STOCK_VALUATION, PERSONNEL_COSTS, INFO_COSTS,
  FIXED_OVERHEAD, VARIABLE_OVERHEAD_RATE, CREDIT_CONTROL_COST,
  MACHINE_DEPRECIATION, VEHICLE_DEPRECIATION,
  MARKET_BASE, DEMAND_FACTOR, REF_PRICE, PRICE_SENSITIVITY,
} from '../data/mockData.js';

export function fmt(n) {
  return Math.round(n).toLocaleString('en-GB');
}

// ── Capacity checks ────────────────────────────────────────────────────────────

export function calcMachineHoursRequired(deliverySchedule, assemblyTimes) {
  let total = 0;
  for (let p = 0; p < 3; p++) {
    const units = deliverySchedule[p].reduce((s, v) => s + Math.max(0, v), 0);
    total += units * MACHINING_TIME[p] / 60;
  }
  return Math.round(total);
}

export function calcMachineHoursAvailable(machines, shiftLevel) {
  return machines * (SHIFT_HOURS[shiftLevel] || 576);
}

export function calcAssemblyHoursRequired(deliverySchedule, assemblyTimes) {
  let total = 0;
  for (let p = 0; p < 3; p++) {
    const units = deliverySchedule[p].reduce((s, v) => s + Math.max(0, v), 0);
    total += units * assemblyTimes[p] / 60;
  }
  return Math.round(total);
}

export function calcAssemblyHoursAvailable(assemblyWorkers) {
  return assemblyWorkers * 576;
}

// ── Demand / units sold (SIMPLIFIED — labelled assumption) ───────────────────

export function calcDemand(prices, advertising, salespeopleAlloc, assemblyTimes, periodSeasonality = 1.0) {
  const demand = [[], [], []];
  const areas = 4;
  for (let p = 0; p < 3; p++) {
    for (let a = 0; a < areas; a++) {
      const price = a === 3 ? prices.export[p] : prices.home[p];
      const base = MARKET_BASE[a] * DEMAND_FACTOR[p] * periodSeasonality;

      // Price effect: demand falls as price rises above reference
      const priceRatio = REF_PRICE[p] > 0 ? (price - REF_PRICE[p]) / REF_PRICE[p] : 0;
      const priceEffect = Math.max(0, 1 - priceRatio * PRICE_SENSITIVITY[p]);

      // Advertising effect (diminishing returns)
      const adSpend = advertising[p][a] || 0;
      const advertEffect = 1 + Math.sqrt(adSpend) / 900;

      // Selling effect
      const sellingEffect = 1 + (salespeopleAlloc[a] || 0) * 0.05;

      // Quality effect (assembly time above minimum)
      const minTime = MIN_ASSEMBLY_TIME[p];
      const actualTime = Math.max(minTime, assemblyTimes[p]);
      const qualityEffect = 1 + (actualTime - minTime) / minTime * 0.08;

      demand[p][a] = Math.round(base * priceEffect * advertEffect * sellingEffect * qualityEffect);
    }
  }
  return demand;
}

// ── Revenue ──────────────────────────────────────────────────────────────────

export function calcRevenue(prices, unitsSold) {
  let total = 0;
  const revenue = [[], [], []];
  for (let p = 0; p < 3; p++) {
    for (let a = 0; a < 4; a++) {
      const price = a === 3 ? prices.export[p] : prices.home[p];
      revenue[p][a] = price * (unitsSold[p][a] || 0);
      total += revenue[p][a];
    }
  }
  return { revenue, totalRevenue: total };
}

// ── Personnel costs ──────────────────────────────────────────────────────────

export function calcPersonnelCosts(dec, salespeople, assemblyWorkers) {
  const { salespersonSalary, salesCommission, salespeopleAlloc,
          salespeopleRecruit, salespersonsDismiss, salespersonsTrain,
          assemblyRecruit, assemblyDismiss, assemblyTrain, assemblyWage } = dec;

  // Sales force
  const spExpenses = salespeople * INFO_COSTS.salespersonExpenses;
  const spSalaries = salespeople * salespersonSalary;
  // Commission estimated on base revenue proxy
  const spCommission = 0; // included in salesForce overhead via salesOffice
  const salesForceCost = spSalaries + spExpenses + spCommission;

  // Assembly wages (simplified: workers × avg hours × rate)
  const assemblyHours = assemblyWorkers * 480; // simplified avg
  const assemblyWageCost = assemblyHours * assemblyWage;

  // Machinist wages (auto-managed)
  const machinists = dec.machines ? dec.machines * 4 * dec.shiftLevel : 24;
  const machinistHours = Math.max(400, 420);
  const machinistWage = assemblyWage * 0.65;
  const machinistCost = machinists * machinistHours * machinistWage;

  // Recruitment / dismissal / training
  const recruitCost =
    (salespeopleRecruit || 0) * PERSONNEL_COSTS.salesperson.recruit +
    (salespersonsDismiss || 0) * PERSONNEL_COSTS.salesperson.dismiss +
    (salespersonsTrain || 0) * PERSONNEL_COSTS.salesperson.train +
    (assemblyRecruit || 0) * PERSONNEL_COSTS.assemblyWorker.recruit +
    (assemblyDismiss || 0) * PERSONNEL_COSTS.assemblyWorker.dismiss +
    (assemblyTrain || 0) * PERSONNEL_COSTS.assemblyWorker.train;

  return { salesForceCost, assemblyWageCost, machinistCost, recruitCost };
}

// ── Production costs ─────────────────────────────────────────────────────────

export function calcProductionCosts(machines, shiftLevel, machineHoursUsed, totalUnitsProduced) {
  const supervision = PRODUCTION_COSTS.supervisionPerShift * shiftLevel;
  const overhead = PRODUCTION_COSTS.overheadPerMachine * machines;
  const running = PRODUCTION_COSTS.runningCostPerHour * machineHoursUsed;
  const planning = PRODUCTION_COSTS.planningCostPerUnit * totalUnitsProduced;
  return { supervision, overhead, running, planning, total: supervision + overhead + running + planning };
}

// ── Maintenance ──────────────────────────────────────────────────────────────

export function calcMaintenanceCost(machines, contractedHours) {
  return machines * contractedHours * 60; // £60/hour contracted
}

// ── Materials cost ───────────────────────────────────────────────────────────

export function calcMaterialsCost(qty, supplierDiscount, materialPrice) {
  const discounts = [0, 0.10, 0.15, 0.30];
  const deliveryCharges = [0, 200, 300, 100];
  const disc = discounts[supplierDiscount] || 0;
  const delivery = deliveryCharges[supplierDiscount] || 0;
  return qty * (materialPrice / 1000) * (1 - disc) + delivery;
}

// ── Stock values ─────────────────────────────────────────────────────────────

export function calcStockValue(stocks) {
  let total = 0;
  for (let p = 0; p < 3; p++) {
    const units = stocks[p].reduce((s, v) => s + (v || 0), 0);
    total += units * STOCK_VALUATION[p];
  }
  return total;
}

// ── Total overheads (simplified) ─────────────────────────────────────────────

export function calcOverheads(dec, salesForceCost, recruitCost, maintenanceCost,
                               advertisingTotal, totalOrdersValue, unitsSoldTotal,
                               transportCost, productDevTotal) {
  const salesOffice = totalOrdersValue * 0.01;
  const creditControl = unitsSoldTotal * CREDIT_CONTROL_COST;
  const businessIntel =
    (dec.buyCompetitorInfo ? INFO_COSTS.competitorActivities : 0) +
    (dec.buyMarketShares ? INFO_COSTS.marketShares : 0);
  const managementBudget = dec.managementBudget || 40000;

  const baseOverheads =
    advertisingTotal + salesForceCost + salesOffice +
    transportCost + productDevTotal + recruitCost +
    maintenanceCost + FIXED_OVERHEAD + businessIntel +
    managementBudget + creditControl;

  const misc = baseOverheads * VARIABLE_OVERHEAD_RATE + FIXED_OVERHEAD;
  const total = baseOverheads + misc;

  return {
    advertisingTotal, salesForceCost, salesOffice,
    transportCost, productDevTotal, personnelDept: recruitCost,
    maintenanceCost, businessIntel, managementBudget, creditControl, misc, total,
  };
}

// ── Live recalc summary for decision pages ────────────────────────────────────

export function recalcSummary(dec, periodData) {
  const machines = periodData?.resources?.machinesAvailable || 6;
  const assemblyWorkers = periodData?.resources?.personnel?.assemblyWorkers?.start || 40;
  const salespeople = periodData?.resources?.personnel?.salespeople?.start || 6;

  const machHrsReq = calcMachineHoursRequired(dec.deliverySchedule, dec.assemblyTimes);
  const machHrsAvail = calcMachineHoursAvailable(machines, dec.shiftLevel);
  const asmHrsReq = calcAssemblyHoursRequired(dec.deliverySchedule, dec.assemblyTimes);
  const asmHrsAvail = calcAssemblyHoursAvailable(assemblyWorkers);

  const demand = calcDemand(dec.prices, dec.advertising, dec.salespeopleAlloc, dec.assemblyTimes);
  const totalUnits = dec.deliverySchedule.map(row => row.reduce((s, v) => s + Math.max(0, v), 0));
  const totalUnitsProduced = totalUnits.reduce((s, v) => s + v, 0);

  const unitsSold = demand.map((row, p) =>
    row.map((d, a) => Math.min(d, (dec.deliverySchedule[p][a] || 0) + 10))
  );
  const unitsSoldTotal = unitsSold.flat().reduce((s, v) => s + v, 0);

  const advertisingTotal = dec.advertising.flat().reduce((s, v) => s + (v || 0), 0);
  const productDevTotal = dec.productDev.reduce((s, v) => s + (v || 0), 0);

  const { revenue, totalRevenue } = calcRevenue(dec.prices, unitsSold);
  const totalOrdersValue = totalRevenue * 0.95;

  const maintenanceCost = calcMaintenanceCost(machines, dec.contractMaintenance || 0);
  const { salesForceCost, assemblyWageCost, machinistCost, recruitCost } =
    calcPersonnelCosts(dec, salespeople, assemblyWorkers);

  const { total: overheadsTotal } = calcOverheads(
    dec, salesForceCost, recruitCost, maintenanceCost,
    advertisingTotal, totalOrdersValue, unitsSoldTotal, 30000, productDevTotal
  );

  const openingStockValue = periodData?.accounts?.openingStockValue || 100000;
  const materialPrice = periodData?.economy?.materialPrice || 12000;
  const materialsCost = calcMaterialsCost(dec.materialsQty || 0, dec.materialsSupplier || 0, materialPrice);

  const machineRunningCost = machHrsReq * 7 + machines * 2000 + dec.shiftLevel * 10000 + totalUnitsProduced;
  const closingStockValue = periodData?.accounts?.closingStockValue || 110000;

  const costOfSales = openingStockValue + materialsCost + assemblyWageCost + machinistCost + machineRunningCost - closingStockValue;
  const grossProfit = totalRevenue - costOfSales;
  const netProfit = grossProfit - overheadsTotal;

  return {
    machHrsReq, machHrsAvail,
    asmHrsReq, asmHrsAvail,
    machineOver: machHrsReq > machHrsAvail,
    assemblyOver: asmHrsReq > asmHrsAvail,
    totalRevenue: Math.round(totalRevenue),
    grossProfit: Math.round(grossProfit),
    netProfit: Math.round(netProfit),
    overheadsTotal: Math.round(overheadsTotal),
  };
}
