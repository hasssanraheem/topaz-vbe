import { useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import PeriodSelector from '../components/PeriodSelector.jsx';
import { PERIODS, PRODUCTS, AREAS, COMPETITORS } from '../data/mockData.js';
import { loadAllDecisions } from '../logic/storage.js';

function gbp(v) { return v != null ? `£${Number(v).toLocaleString('en-GB')}` : '—'; }
function num(v) { return v != null ? Number(v).toLocaleString('en-GB') : '—'; }

function getP(n) { return PERIODS[n] || PERIODS[1]; }

export default function ReportsPage({ sub, onNavigate, teamNumber }) {
  const [period, setPeriod] = useState(1);
  const pData = getP(period);
  const allDec = loadAllDecisions(teamNumber || 1);
  const dec = allDec[period] || {};
  const accounts = pData.accounts || {};
  const resources = pData.resources || {};
  const productStats = pData.productStats || {};

  const SUB_REPORTS = [
    { key: 'decisions-made', label: 'Decisions Made' },
    { key: 'resources', label: 'Resources Employed' },
    { key: 'product-stats', label: 'Product Statistics' },
    { key: 'overhead-costs', label: 'Overhead Costs Analysis' },
    { key: 'pnl', label: 'Profit & Loss' },
    { key: 'balance-sheet', label: 'Balance Sheet' },
    { key: 'cash-flow', label: 'Cash Flow' },
    { key: 'group-info', label: 'Group Information' },
    { key: 'performance', label: 'Company Performance' },
  ];

  const activeSub = sub || 'decisions-made';

  function renderContent() {
    switch (activeSub) {
      case 'decisions-made':
        return <DecisionsMadeReport dec={dec} pData={pData} />;
      case 'resources':
        return <ResourcesReport pData={pData} />;
      case 'product-stats':
        return <ProductStatsReport pData={pData} />;
      case 'overhead-costs':
        return <OverheadCostsReport pData={pData} />;
      case 'pnl':
        return <PnLReport accounts={accounts} />;
      case 'balance-sheet':
        return <BalanceSheetReport accounts={accounts} />;
      case 'cash-flow':
        return <CashFlowReport accounts={accounts} />;
      case 'group-info':
        return <GroupInfoReport />;
      case 'performance':
        return <PerformanceReport pData={pData} />;
      default:
        return <p>Select a report from the sub-menu.</p>;
    }
  }

  return (
    <div>
      <h2>Reports</h2>
      <div className="demo-notice">Demonstration data — not official Topaz-VBE data.</div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="sub-nav-tabs">
        {SUB_REPORTS.map(r => (
          <button key={r.key}
            className={`sub-tab${activeSub === r.key ? ' active' : ''}`}
            onClick={() => onNavigate('reports', r.key)}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="report-body">
        {renderContent()}
      </div>
    </div>
  );
}

function DecisionsMadeReport({ dec, pData }) {
  if (!dec || Object.keys(dec).length === 0) {
    return <p>No submitted decisions found for this period.</p>;
  }
  return (
    <div>
      <h3>Decisions Made</h3>
      <DataTable headers={['Decision', 'Value']} rows={[
        { cells: ['Shift Level', dec.shiftLevel || '—'] },
        { cells: ['Assembly Workers Hourly Wage', dec.assemblyWage ? `£${Number(dec.assemblyWage).toFixed(2)}/hr` : '—'] },
        { cells: ['Days Credit Allowed', dec.daysCredit || '—'] },
        { cells: ['Salesperson Salary (quarterly)', dec.salespersonSalary ? gbp(dec.salespersonSalary) : '—'] },
        { cells: ['Sales Commission', dec.salesCommission != null ? `${dec.salesCommission}%` : '—'] },
        { cells: ['Management Budget', dec.managementBudget ? gbp(dec.managementBudget) : '—'] },
        { cells: ['Dividend Rate', dec.dividendRate != null ? `${dec.dividendRate}p/share` : '—'] },
        { cells: ['Vans (buy/sell)', dec.vansBuySell != null ? dec.vansBuySell : '—'] },
        { cells: ['Contract Maintenance hrs/machine', dec.contractMaintenance || '—'] },
        { cells: ['Machines to Sell', dec.machinesToSell || 0] },
        { cells: ['Machines to Order', dec.machinesToOrder || 0] },
        { cells: ['Materials Ordered (units)', dec.materialsQty || 0] },
        { cells: ['Buy Competitor Info', dec.buyCompetitorInfo ? 'Yes' : 'No'] },
        { cells: ['Buy Market Shares Info', dec.buyMarketShares ? 'Yes' : 'No'] },
      ]} />
      <h4>Prices — Home (£)</h4>
      <DataTable headers={['Product', ...PRODUCTS]} rows={[
        { cells: ['Home', ...(dec.prices?.home || []).map(v => gbp(v))] },
        { cells: ['Export', ...(dec.prices?.export || []).map(v => gbp(v))] },
      ]} />
      <h4>Advertising (£)</h4>
      <DataTable headers={['Product', ...AREAS]} rows={
        PRODUCTS.map((prod, p) => ({
          cells: [prod, ...(dec.advertising?.[p] || [0,0,0,0]).map(gbp)]
        }))
      } />
    </div>
  );
}

function ResourcesReport({ pData }) {
  const r = pData.resources || {};
  const pers = r.personnel || {};
  return (
    <div>
      <h3>Resources Employed</h3>
      <DataTable headers={['Resource', 'Value']} rows={[
        { cells: ['Machines Available', r.machinesAvailable || '—'] },
        { cells: ['Vehicles Available', r.vehiclesAvailable || '—'] },
        { cells: ['Salespeople', pers.salespeople?.nextQtr ?? '—'] },
        { cells: ['Assembly Workers', pers.assemblyWorkers?.nextQtr ?? '—'] },
        { cells: ['Machinists', pers.machinists?.nextQtr ?? '—'] },
      ]} />
      <h4>Product Stocks by Area (units)</h4>
      <DataTable headers={['Product', ...AREAS, 'Total']} rows={
        PRODUCTS.map((prod, p) => {
          const stock = pData.productStats?.stockByArea?.[p] || [0,0,0,0];
          const total = stock.reduce((s, v) => s + v, 0);
          return { cells: [prod, ...stock.map(num), num(total)] };
        })
      } />
    </div>
  );
}

function ProductStatsReport({ pData }) {
  const ps = pData.productStats || {};
  return (
    <div>
      <h3>Product Statistics</h3>
      <DataTable headers={['Product', 'Sales (units)', 'Revenue (£)', 'Avg Price (£)', 'Quality']} rows={
        PRODUCTS.map((prod, p) => ({
          cells: [
            prod,
            num(ps.sales?.[p]),
            gbp(ps.revenue?.[p]),
            gbp(ps.avgPrice?.[p]),
            ps.quality?.[p] || '—',
          ]
        }))
      } />
      <DataTable headers={['Product', 'Dev Spend', 'Dev Status', 'Improvement']} rows={
        PRODUCTS.map((prod, p) => ({
          cells: [
            prod,
            gbp(ps.devSpend?.[p]),
            ps.devStatus?.[p] || '—',
            ps.improvements?.[p] || '—',
          ]
        }))
      } />
    </div>
  );
}

function OverheadCostsReport({ pData }) {
  const oc = pData.overheadCosts || {};
  return (
    <div>
      <h3>Overhead Costs Analysis</h3>
      <DataTable headers={['Item', 'Amount (£)']} rows={[
        { cells: ['Salesperson Salaries', gbp(oc.salespersonSalaries)] },
        { cells: ['Sales Commission', gbp(oc.salesCommission)] },
        { cells: ['Management Budget', gbp(oc.managementBudget)] },
        { cells: ['Product Development', gbp(oc.productDevelopment)] },
        { cells: ['Advertising', gbp(oc.advertising)] },
        { cells: ['Business Intelligence', gbp(oc.businessIntelligence)] },
        { cells: ['Recruitment Costs', gbp(oc.recruitmentCosts)] },
        { cells: ['Dismissal Costs', gbp(oc.dismissalCosts)] },
        { cells: ['Training Costs', gbp(oc.trainingCosts)] },
        { cells: ['Machine Depreciation', gbp(oc.machineDepreciation)] },
        { cells: ['Vehicle Depreciation', gbp(oc.vehicleDepreciation)] },
        { cells: ['Maintenance (contracted)', gbp(oc.maintenanceContracted)] },
        { cells: ['Maintenance (uncontracted)', gbp(oc.maintenanceUncontracted)] },
        { cells: ['External Storage', gbp(oc.externalStorage)] },
        { cells: ['Bank Charges / Overdraft Interest', gbp(oc.bankCharges)] },
        { cells: ['Total Overheads', gbp(oc.totalOverheads)], total: true },
      ]} />
    </div>
  );
}

function PnLReport({ accounts }) {
  return (
    <div>
      <h3>Profit &amp; Loss Account</h3>
      <DataTable headers={['Item', 'Amount (£)']} rows={[
        { cells: ['Sales Revenue', gbp(accounts.salesRevenue)] },
        { cells: ['Cost of Sales', gbp(accounts.costOfSales)] },
        { cells: ['Gross Profit / (Loss)', gbp(accounts.grossProfit)], total: true },
        { cells: ['Total Overheads', gbp(accounts.totalOverheads)] },
        { cells: ['Net Profit / (Loss) before Tax', gbp(accounts.netProfitBeforeTax)], total: true },
        { cells: ['Corporation Tax', gbp(accounts.corporationTax)] },
        { cells: ['Net Profit / (Loss) after Tax', gbp(accounts.netProfit)], total: true },
        { cells: ['Dividends Paid', gbp(accounts.dividendsPaid)] },
        { cells: ['Retained Profit', gbp(accounts.retainedProfit)], total: true },
      ]} />
    </div>
  );
}

function BalanceSheetReport({ accounts }) {
  return (
    <div>
      <h3>Balance Sheet</h3>
      <h4>Fixed Assets</h4>
      <DataTable headers={['Item', 'Amount (£)']} rows={[
        { cells: ['Machines at cost', gbp(accounts.machinesAtCost)] },
        { cells: ['Less: Accumulated Depreciation', gbp(accounts.machineDepnAccum)] },
        { cells: ['Net Book Value — Machines', gbp(accounts.machinesNBV)], total: true },
        { cells: ['Vehicles at cost', gbp(accounts.vehiclesAtCost)] },
        { cells: ['Less: Accumulated Depreciation', gbp(accounts.vehicleDepnAccum)] },
        { cells: ['Net Book Value — Vehicles', gbp(accounts.vehiclesNBV)], total: true },
        { cells: ['Total Fixed Assets', gbp(accounts.fixedAssets)], total: true },
      ]} />
      <h4>Current Assets</h4>
      <DataTable headers={['Item', 'Amount (£)']} rows={[
        { cells: ['Product Stocks', gbp(accounts.productStocks)] },
        { cells: ['Material Stocks', gbp(accounts.materialStocks)] },
        { cells: ['Debtors', gbp(accounts.debtors)] },
        { cells: ['Cash Invested', gbp(accounts.cashInvested)] },
        { cells: ['Total Current Assets', gbp(accounts.currentAssets)], total: true },
        { cells: ['Total Assets', gbp(accounts.totalAssets)], total: true },
      ]} />
      <h4>Liabilities and Net Worth</h4>
      <DataTable headers={['Item', 'Amount (£)']} rows={[
        { cells: ['Tax Assessed and Due', gbp(accounts.taxDue)] },
        { cells: ['Creditors', gbp(accounts.creditors)] },
        { cells: ['Bank Overdraft', gbp(accounts.bankOverdraft)] },
        { cells: ['Current Liabilities', gbp(accounts.currentLiabilities)], total: true },
        { cells: ['Net Assets', gbp(accounts.netAssets)], total: true },
        { cells: ['Share Capital', gbp(accounts.shareCapital)] },
        { cells: ['Reserves', gbp(accounts.reserves)] },
        { cells: ['Net Worth', gbp(accounts.netWorth)], total: true },
      ]} />
    </div>
  );
}

function CashFlowReport({ accounts }) {
  return (
    <div>
      <h3>Cash Flow Statement</h3>
      <DataTable headers={['Item', 'Amount (£)']} rows={[
        { cells: ['Trading Receipts (cash in)', gbp(accounts.tradingReceipts)] },
        { cells: ['Trading Payments (cash out)', gbp(accounts.tradingPayments)] },
        { cells: ['Net Trading Cash Flow', gbp(accounts.netCashFlow)], total: true },
        { cells: ['Capital Expenditure', gbp(accounts.capitalExpenditure)] },
        { cells: ['Tax Payments', gbp(accounts.taxPayments)] },
        { cells: ['Dividends Paid', gbp(accounts.dividendsPaid)] },
        { cells: ['Net Cash Movement', gbp(accounts.netCashMovement)], total: true },
        { cells: ['Bank Overdraft b/f', gbp(accounts.bankOverdraftBF)] },
        { cells: ['Bank Overdraft c/f', gbp(accounts.bankOverdraft)], total: true },
        { cells: ['Cash Invested', gbp(accounts.cashInvested)] },
        { cells: ['Overdraft Limit (next quarter)', gbp(accounts.overdraftLimitNext)] },
      ]} />
    </div>
  );
}

function GroupInfoReport() {
  return (
    <div>
      <h3>Group Information</h3>
      <p style={{ fontSize: '0.85em', color: '#555', marginBottom: 8 }}>
        Mock competitor data — not from the live Topaz-VBE system.
      </p>
      <DataTable headers={['Company', 'Net Worth (£)', 'Sales Revenue (£)', 'Net Profit (£)', 'Share Price (£)']} rows={
        COMPETITORS.map(c => ({
          cells: [c.name, gbp(c.netWorth), gbp(c.salesRevenue), gbp(c.netProfit), gbp(c.sharePrice)]
        }))
      } />
    </div>
  );
}

function PerformanceReport({ pData }) {
  const perf = pData.performance || {};
  return (
    <div>
      <h3>Company Performance</h3>
      <DataTable headers={['KPI', 'Value']} rows={[
        { cells: ['Market Share — South', perf.marketShareSouth ? `${perf.marketShareSouth}%` : '—'] },
        { cells: ['Market Share — West', perf.marketShareWest ? `${perf.marketShareWest}%` : '—'] },
        { cells: ['Market Share — North', perf.marketShareNorth ? `${perf.marketShareNorth}%` : '—'] },
        { cells: ['Market Share — Export', perf.marketShareExport ? `${perf.marketShareExport}%` : '—'] },
        { cells: ['Share Price', perf.sharePrice ? gbp(perf.sharePrice) : '—'] },
        { cells: ['Dividends Paid This Year', perf.dividendsPaid ? gbp(perf.dividendsPaid) : '—'] },
        { cells: ['Cumulative Profit', perf.cumulativeProfit ? gbp(perf.cumulativeProfit) : '—'] },
        { cells: ['Net Worth', perf.netWorth ? gbp(perf.netWorth) : '—'] },
      ]} />
    </div>
  );
}
