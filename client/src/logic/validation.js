// validation.js — field-level and cross-field validation

import { MIN_SALARY, MIN_MGMT_BUDGET, MIN_ASSEMBLY_WAGE, MIN_ASSEMBLY_TIME } from '../data/mockData.js';

function isInt(v) { return Number.isInteger(Number(v)) && !isNaN(Number(v)); }
function isNum(v) { return !isNaN(parseFloat(v)) && isFinite(v); }
function int(v) { return parseInt(v, 10); }
function num(v) { return parseFloat(v); }

// Returns '' if valid, or an error string.

export function validatePrices(prices) {
  const errors = { home: ['', '', ''], export: ['', '', ''] };
  for (let p = 0; p < 3; p++) {
    if (!isInt(prices.home[p]) || int(prices.home[p]) < 0)
      errors.home[p] = 'Must be a whole number ≥ 0 (enter 0 to withdraw product)';
    if (!isInt(prices.export[p]) || int(prices.export[p]) < 0)
      errors.export[p] = 'Must be a whole number ≥ 0';
  }
  return errors;
}

export function validateAdvertising(advertising) {
  const errors = advertising.map(row => row.map(v => {
    if (!isInt(v) || int(v) < 0) return 'Must be a whole number ≥ 0';
    return '';
  }));
  return errors;
}

export function validateProductDev(productDev) {
  return productDev.map(v => {
    if (!isInt(v) || int(v) < 0) return 'Must be a whole number ≥ 0';
    return '';
  });
}

export function validateDaysCredit(v) {
  if (!isInt(v) || int(v) < 0) return 'Must be a whole number ≥ 0';
  return '';
}

export function validateSalespeopleAlloc(alloc, total) {
  const errors = alloc.map(v => {
    if (!isInt(v) || int(v) < 0) return 'Must be a whole number ≥ 0';
    return '';
  });
  const sum = alloc.reduce((s, v) => s + (int(v) || 0), 0);
  if (sum > total) errors.push(`Total allocated (${sum}) exceeds available salespeople (${total})`);
  return errors;
}

export function validateSalespersonSalary(v) {
  if (!isInt(v) || int(v) < MIN_SALARY) return `Must be a whole number ≥ £${MIN_SALARY.toLocaleString('en-GB')}`;
  return '';
}

export function validateSalesCommission(v) {
  if (!isInt(v) || int(v) < 0 || int(v) > 100) return 'Must be a whole number 0–100';
  return '';
}

export function validateManagementBudget(v) {
  if (!isInt(v) || int(v) < MIN_MGMT_BUDGET) return `Must be ≥ £${MIN_MGMT_BUDGET.toLocaleString('en-GB')}`;
  return '';
}

export function validateDeliverySchedule(schedule) {
  return schedule.map(row => row.map(v => {
    if (!isInt(v)) return 'Must be a whole number (negative allowed for stock transfer)';
    return '';
  }));
}

export function validateShiftLevel(v) {
  if (![1, 2, 3].includes(int(v))) return 'Must be 1, 2 or 3';
  return '';
}

export function validateAssemblyTimes(times) {
  return times.map((v, p) => {
    const min = MIN_ASSEMBLY_TIME[p];
    if (!isInt(v) || int(v) < min) return `Must be a whole number ≥ ${min} minutes (minimum from Table 3)`;
    return '';
  });
}

export function validateContractMaintenance(v) {
  if (!isInt(v) || int(v) < 0) return 'Must be a whole number ≥ 0';
  return '';
}

export function validateMachinesToSell(v, owned) {
  if (!isInt(v) || int(v) < 0) return 'Must be a whole number ≥ 0';
  if (int(v) > owned) return `Cannot sell more machines than owned (${owned})`;
  return '';
}

export function validateMachinesToOrder(v) {
  if (!isInt(v) || int(v) < 0) return 'Must be a whole number ≥ 0';
  return '';
}

export function validateMaterialsQty(v) {
  if (!isInt(v) || int(v) < 0) return 'Must be a whole number ≥ 0';
  return '';
}

export function validateMaterialsDeliveries(v) {
  if (!isInt(v) || int(v) < 0) return 'Must be a whole number ≥ 0';
  return '';
}

export function validateRecruit(v) {
  if (!isInt(v) || int(v) < 0) return 'Must be a whole number ≥ 0';
  return '';
}

export function validateDismiss(v, current) {
  if (!isInt(v) || int(v) < 0) return 'Must be a whole number ≥ 0';
  if (int(v) > current) return `Cannot dismiss more than current staff (${current})`;
  return '';
}

export function validateTrain(v) {
  if (!isInt(v) || int(v) < 0) return 'Must be a whole number ≥ 0';
  return '';
}

export function validateAssemblyWage(v, prevWage) {
  if (!isNum(v) || num(v) < MIN_ASSEMBLY_WAGE) return `Must be ≥ £${MIN_ASSEMBLY_WAGE.toFixed(2)}/hour`;
  if (num(v) < num(prevWage)) return 'Assembly wage cannot be reduced below previous quarter rate';
  return '';
}

export function validateDividendRate(v, quarter, reserves) {
  if (!isInt(v) || int(v) < 0) return 'Must be a whole number ≥ 0';
  if ([2, 4].includes(quarter) && int(v) > 0) return 'Dividends may only be paid in Q1 and Q3';
  // Simplified reserve check — real check would need share count
  return '';
}

export function validateVansBuySell(v, owned) {
  if (!isInt(v)) return 'Must be a whole number (negative = sell)';
  if (int(v) < 0 && Math.abs(int(v)) > owned) return `Cannot sell more vehicles than owned (${owned})`;
  return '';
}

import {
  calcMachineHoursRequired,
  calcMachineHoursAvailable,
  calcAssemblyHoursRequired,
  calcAssemblyHoursAvailable,
} from './calculations.js';

// ── Full form validation ──────────────────────────────────────────────────────
// Returns { valid: bool, errors: {}, warnings: [] }

export function validateAll(dec, context) {
  const { machines = 6, assemblyWorkers = 40, salespeople = 6, quarter = 1, prevAssemblyWage = 8.50, vehicles = 4, reserves = 0 } = context;

  const errors = {};
  const warnings = [];

  const priceE = validatePrices(dec.prices);
  if (Object.values(priceE.home).some(e => e) || Object.values(priceE.export).some(e => e))
    errors.prices = priceE;

  const advE = validateAdvertising(dec.advertising);
  if (advE.some(row => row.some(e => e))) errors.advertising = advE;

  const devE = validateProductDev(dec.productDev);
  if (devE.some(e => e)) errors.productDev = devE;

  const creditE = validateDaysCredit(dec.daysCredit);
  if (creditE) errors.daysCredit = creditE;

  const allocE = validateSalespeopleAlloc(dec.salespeopleAlloc, salespeople);
  if (allocE.some(e => e)) errors.salespeopleAlloc = allocE;

  const salE = validateSalespersonSalary(dec.salespersonSalary);
  if (salE) errors.salespersonSalary = salE;

  const commE = validateSalesCommission(dec.salesCommission);
  if (commE) errors.salesCommission = commE;

  const mgmtE = validateManagementBudget(dec.managementBudget);
  if (mgmtE) errors.managementBudget = mgmtE;

  const delE = validateDeliverySchedule(dec.deliverySchedule);
  if (delE.some(row => row.some(e => e))) errors.deliverySchedule = delE;

  const shiftE = validateShiftLevel(dec.shiftLevel);
  if (shiftE) errors.shiftLevel = shiftE;

  const asmTimeE = validateAssemblyTimes(dec.assemblyTimes);
  if (asmTimeE.some(e => e)) errors.assemblyTimes = asmTimeE;

  const maintE = validateContractMaintenance(dec.contractMaintenance);
  if (maintE) errors.contractMaintenance = maintE;

  const mSellE = validateMachinesToSell(dec.machinesToSell, machines);
  if (mSellE) errors.machinesToSell = mSellE;

  const mOrdE = validateMachinesToOrder(dec.machinesToOrder);
  if (mOrdE) errors.machinesToOrder = mOrdE;

  const matQtyE = validateMaterialsQty(dec.materialsQty);
  if (matQtyE) errors.materialsQty = matQtyE;

  const matDelE = validateMaterialsDeliveries(dec.materialsDeliveries);
  if (matDelE) errors.materialsDeliveries = matDelE;

  const spRecE = validateRecruit(dec.salespeopleRecruit);
  if (spRecE) errors.salespeopleRecruit = spRecE;

  const spDisE = validateDismiss(dec.salespersonsDismiss, salespeople);
  if (spDisE) errors.salespersonsDismiss = spDisE;

  const spTrainE = validateTrain(dec.salespersonsTrain);
  if (spTrainE) errors.salespersonsTrain = spTrainE;

  const awRecE = validateRecruit(dec.assemblyRecruit);
  if (awRecE) errors.assemblyRecruit = awRecE;

  const awDisE = validateDismiss(dec.assemblyDismiss, assemblyWorkers);
  if (awDisE) errors.assemblyDismiss = awDisE;

  const awTrainE = validateTrain(dec.assemblyTrain);
  if (awTrainE) errors.assemblyTrain = awTrainE;

  const awWageE = validateAssemblyWage(dec.assemblyWage, prevAssemblyWage);
  if (awWageE) errors.assemblyWage = awWageE;

  const divE = validateDividendRate(dec.dividendRate, quarter, reserves);
  if (divE) errors.dividendRate = divE;

  const vansE = validateVansBuySell(dec.vansBuySell, vehicles);
  if (vansE) errors.vansBuySell = vansE;

  // Cross-field capacity warnings
  const mHrsReq = calcMachineHoursRequired(dec.deliverySchedule, dec.assemblyTimes);
  const mHrsAvail = calcMachineHoursAvailable(machines, dec.shiftLevel);
  if (mHrsReq > mHrsAvail)
    warnings.push(`Machine hours required (${mHrsReq.toLocaleString('en-GB')}) exceed available (${mHrsAvail.toLocaleString('en-GB')}). Production will be reduced.`);

  const aHrsReq = calcAssemblyHoursRequired(dec.deliverySchedule, dec.assemblyTimes);
  const aHrsAvail = calcAssemblyHoursAvailable(assemblyWorkers);
  if (aHrsReq > aHrsAvail)
    warnings.push(`Assembly hours required (${aHrsReq.toLocaleString('en-GB')}) exceed available (${aHrsAvail.toLocaleString('en-GB')}). Production will be reduced.`);

  return { valid: Object.keys(errors).length === 0, errors, warnings };
}
