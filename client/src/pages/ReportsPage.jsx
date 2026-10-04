import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable.jsx';
import PeriodSelector from '../components/PeriodSelector.jsx';
import { PERIODS, PRODUCTS, AREAS, COMPETITORS } from '../data/mockData.js';
import { loadAllDecisions } from '../logic/storage.js';
import { apiFetch } from '../lib/api.js';

function gbp(v) { return v != null ? `£${Number(v).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '—'; }
function num(v) { return v != null ? Number(v).toLocaleString('en-GB') : '—'; }
function pct(v) { return v != null ? `${(Number(v) * 100).toFixed(1)}%` : '—'; }

function getP(n) { return PERIODS[n] || PERIODS[1]; }

/**
 * Map the engine's report object (snake_case) to the display data shape
 * (accounts, resources, productStats, overheadCosts) used by sub-components.
 */
function engineReportToDisplay(r) {
  if (!r) return null;
  const pnl = r.pnl || {};
  const bs  = r.balance_sheet || {};
  const cf  = r.cash_flow || {};
  const oh  = r.overheads || {};
  const res = r.resources || {};

  const accounts = {
    salesRevenue:      pnl.sales_revenue,
    costOfSales:       pnl.cost_of_sales,
    grossProfit:       pnl.gross_profit,
    totalOverheads:    pnl.total_overheads,
    netProfitBeforeTax:pnl.profit_before_tax,
    corporationTax:    pnl.tax_assessed,
    netProfit:         pnl.net_profit,
    dividendsPaid:     pnl.dividend_paid,
    retainedProfit:    pnl.retained_profit,

    // Balance sheet
    machinesAtCost:    bs.machines,
    machineDepnAccum:  null,
    machinesNBV:       bs.machines,
    vehiclesAtCost:    bs.vehicles,
    vehicleDepnAccum:  null,
    vehiclesNBV:       bs.vehicles,
    fixedAssets:       bs.fixed_assets,
    productStocks:     bs.product_stocks,
    materialStocks:    bs.material_stocks,
    debtors:           bs.debtors,
    cashInvested:      bs.cash_invested,
    currentAssets:     (bs.product_stocks || 0) + (bs.material_stocks || 0) + (bs.debtors || 0) + (bs.cash_invested || 0),
    totalAssets:       bs.total_assets,
    taxDue:            bs.tax_due,
    creditors:         bs.creditors,
    bankOverdraft:     bs.bank_overdraft,
    currentLiabilities:bs.current_liabilities,
    netAssets:         bs.net_assets,
    shareCapital:      bs.share_capital,
    reserves:          bs.reserves,
    netWorth:          bs.net_worth,

    // Cash flow
    tradingReceipts:   cf.trading_receipts,
    tradingPayments:   cf.trading_payments,
    netCashFlow:       cf.net_operating,
    capitalExpenditure:cf.capital_payments,
    taxPayments:       cf.tax_paid,
    netCashMovement:   cf.net_cash_flow,
    bankOverdraftBF:   null,
    overdraftLimitNext:bs.overdraft_limit,
  };

  const resources = {
    machinesAvailable: res.machines?.owned,
    vehiclesAvailable: res.vehicles?.owned,
    personnel: {
      salespeople:    { nextQtr: Object.values(r.decisions?.salespeople || {}).reduce((s, v) => s + v, 0) },
      assemblyWorkers:{ nextQtr: res.assembly?.workers },
      machinists:     { nextQtr: res.machines?.machinists },
    },
  };

  // products array: [{product, area, sales, closing_stock, price, ...}]
  const prods = r.products || [];
  const productStats = {
    sales:    PRODUCTS.map((_, pi) => {
      const p = pi + 1;
      return prods.filter(x => x.product === p).reduce((s, x) => s + (x.sales || 0), 0);
    }),
    revenue:  PRODUCTS.map((_, pi) => {
      const p = pi + 1;
      return prods.filter(x => x.product === p).reduce((s, x) => s + (x.sales || 0) * (x.price || 0), 0);
    }),
    avgPrice: PRODUCTS.map((_, pi) => {
      const rows = prods.filter(x => x.product === pi + 1 && x.sales > 0);
      if (!rows.length) return null;
      const totSales = rows.reduce((s, x) => s + x.sales, 0);
      const totRev   = rows.reduce((s, x) => s + x.sales * x.price, 0);
      return totSales ? totRev / totSales : null;
    }),
    quality: PRODUCTS.map(() => '—'),
    stockByArea: AREAS.map((area, ai) => {
      return PRODUCTS.map((_, pi) => {
        const row = prods.find(x => x.product === pi + 1 && x.area === area.toLowerCase());
        return row?.closing_stock || 0;
      });
    }),
    improvements: PRODUCTS.map((_, pi) => {
      const row = prods.find(x => x.product === pi + 1);
      return row?.improvement ? 'Implemented' : 'None';
    }),
  };

  const overheadCosts = {
    salespersonSalaries: null,
    salesCommission:     null,
    managementBudget:    oh.management,
    productDevelopment:  oh.research,
    advertising:         oh.advertising,
    businessIntelligence:oh.info_charges,
    recruitmentCosts:    null,
    dismissalCosts:      null,
    trainingCosts:       null,
    machineDepreciation: null,
    vehicleDepreciation: null,
    maintenanceContracted:  oh.maintenance,
    maintenanceUncontracted:null,
    externalStorage:     oh.warehousing,
    bankCharges:         null,
    totalOverheads:      oh.total,
  };

  const group = r.group || {};

  return { accounts, resources, productStats, overheadCosts, group, meta: r.meta };
}

export default function ReportsPage({ sub, onNavigate, teamNumber }) {
  const [period, setPeriod] = useState(1);
  const [serverReport, setServerReport] = useState(null); // { accounts, resources, ... } or null
  const [reportRound, setReportRound] = useState(null);
  const [loadingReport, setLoadingReport] = useState(true);

  const pData = getP(period);
  const allDec = loadAllDecisions(teamNumber || 1);
  const dec = allDec[period] || {};
  const accounts = serverReport?.accounts || pData.accounts || {};
  const resources = serverReport?.resources || pData.resources || {};
  const productStats = serverReport?.productStats || pData.productStats || {};
  const overheadCosts = serverReport?.overheadCosts || pData.overheadCosts || {};
  const group = serverReport?.group || null;

  const isLive = Boolean(serverReport);

  // Fetch latest published report from server
  useEffect(() => {
    setLoadingReport(true);
    apiFetch('/api/decisions/report')
      .then(data => {
        if (data?.report) {
          const display = engineReportToDisplay(data.report);
          setServerReport(display);
          setReportRound(data.round);
        } else {
          setServerReport(null);
        }
      })
      .catch(() => setServerReport(null))
      .finally(() => setLoadingReport(false));
  }, []);

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
        return <ResourcesReport resources={resources} productStats={productStats} />;
      case 'product-stats':
        return <ProductStatsReport productStats={productStats} />;
      case 'overhead-costs':
        return <OverheadCostsReport overheadCosts={overheadCosts} />;
      case 'pnl':
        return <PnLReport accounts={accounts} />;
      case 'balance-sheet':
        return <BalanceSheetReport accounts={accounts} />;
      case 'cash-flow':
        return <CashFlowReport accounts={accounts} />;
      case 'group-info':
        return <GroupInfoReport group={group} />;
      case 'performance':
        return <PerformanceReport pData={pData} accounts={accounts} group={group} />;
      default:
        return <p>Select a report from the sub-menu.</p>;
    }
  }

  const groupLabel  = serverReport?.group?.group_number  ?? 1;
  const companyLabel = teamNumber ?? 1;
  const yearLabel   = serverReport?.meta?.year   ?? '—';
  const qtrLabel    = reportRound ?? '—';

  return (
    <div>
      {loadingReport ? (
        <div className="demo-notice">Loading reports…</div>
      ) : isLive ? (
        <div className="demo-notice" style={{ background: '#e6f4ea', color: '#1a5c2e', borderColor: '#8bc8a0' }}>
          Live results — Quarter {reportRound}
        </div>
      ) : (
        <div className="demo-notice">Demonstration data — no published results yet.</div>
      )}

      {!isLive && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      )}

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
        {/* Centred title block matching original Topaz-VBE report */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: 8, marginBottom: 14 }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.05em', letterSpacing: '0.06em' }}>
            THE TOPAZ MANAGEMENT SIMULATION REPORT
          </div>
          <div style={{ fontSize: '0.9em', marginTop: 2 }}>
            Group {groupLabel}&nbsp;&nbsp; Company {companyLabel}&nbsp;&nbsp; Year {yearLabel}&nbsp;&nbsp; Quarter {qtrLabel}
          </div>
        </div>
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
        { cells: ['Contract Maintenance hrs/machine', dec.contractMaintenance || '—'] },
        { cells: ['Machines to Sell', dec.machinesToSell || 0] },
        { cells: ['Machines to Order', dec.machinesToOrder || 0] },
        { cells: ['Materials Ordered (units)', dec.materialsQty || 0] },
        { cells: ['Buy Competitor Info', dec.buyCompetitorInfo ? 'Yes' : 'No'] },
        { cells: ['Buy Market Shares Info', dec.buyMarketShares ? 'Yes' : 'No'] },
      ]} />
      <h4>Prices (£)</h4>
      <DataTable headers={['Market', ...PRODUCTS]} rows={[
        { cells: ['Home', ...(dec.prices?.home || []).map(v => gbp(v))] },
        { cells: ['Export', ...(dec.prices?.export || []).map(v => gbp(v))] },
      ]} />
    </div>
  );
}

function ResourcesReport({ resources, productStats }) {
  const r = resources || {};
  const pers = r.personnel || {};
  return (
    <div>
      <h3>Resources Employed</h3>
      <DataTable headers={['Resource', 'Value']} rows={[
        { cells: ['Machines Available', r.machinesAvailable ?? '—'] },
        { cells: ['Vehicles Available', r.vehiclesAvailable ?? '—'] },
        { cells: ['Salespeople', pers.salespeople?.nextQtr ?? '—'] },
        { cells: ['Assembly Workers', pers.assemblyWorkers?.nextQtr ?? '—'] },
        { cells: ['Machinists', pers.machinists?.nextQtr ?? '—'] },
      ]} />
      <h4>Product Closing Stocks by Area (units)</h4>
      <DataTable headers={['Product', ...AREAS, 'Total']} rows={
        PRODUCTS.map((prod, p) => {
          const stock = productStats?.stockByArea?.map(areaStocks => areaStocks[p]) || [0,0,0,0];
          const total = stock.reduce((s, v) => s + v, 0);
          return { cells: [prod, ...stock.map(num), num(total)] };
        })
      } />
    </div>
  );
}

function ProductStatsReport({ productStats }) {
  const ps = productStats || {};
  return (
    <div>
      <h3>Product Statistics</h3>
      <DataTable headers={['Product', 'Sales (units)', 'Revenue (£)', 'Avg Price (£)', 'Improvement']} rows={
        PRODUCTS.map((prod, p) => ({
          cells: [
            prod,
            num(ps.sales?.[p]),
            gbp(ps.revenue?.[p]),
            gbp(ps.avgPrice?.[p]),
            ps.improvements?.[p] || '—',
          ]
        }))
      } />
    </div>
  );
}

function OverheadCostsReport({ overheadCosts }) {
  const oc = overheadCosts || {};
  return (
    <div>
      <h3>Overhead Costs Analysis</h3>
      <DataTable headers={['Item', 'Amount (£)']} rows={[
        { cells: ['Salesperson Salaries', gbp(oc.salespersonSalaries)] },
        { cells: ['Sales Commission', gbp(oc.salesCommission)] },
        { cells: ['Management Budget', gbp(oc.managementBudget)] },
        { cells: ['Product Development / Research', gbp(oc.productDevelopment)] },
        { cells: ['Advertising', gbp(oc.advertising)] },
        { cells: ['Business Intelligence', gbp(oc.businessIntelligence)] },
        { cells: ['Recruitment Costs', gbp(oc.recruitmentCosts)] },
        { cells: ['Dismissal Costs', gbp(oc.dismissalCosts)] },
        { cells: ['Training Costs', gbp(oc.trainingCosts)] },
        { cells: ['Machine Depreciation', gbp(oc.machineDepreciation)] },
        { cells: ['Vehicle Depreciation', gbp(oc.vehicleDepreciation)] },
        { cells: ['Maintenance (contracted)', gbp(oc.maintenanceContracted)] },
        { cells: ['External Storage / Warehousing', gbp(oc.externalStorage)] },
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
        { cells: ['Machines (NBV)', gbp(accounts.machinesNBV)] },
        { cells: ['Vehicles (NBV)', gbp(accounts.vehiclesNBV)] },
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
        { cells: ['Net Operating Cash Flow', gbp(accounts.netCashFlow)], total: true },
        { cells: ['Capital Expenditure', gbp(accounts.capitalExpenditure)] },
        { cells: ['Tax Payments', gbp(accounts.taxPayments)] },
        { cells: ['Dividends Paid', gbp(accounts.dividendsPaid)] },
        { cells: ['Net Cash Movement', gbp(accounts.netCashMovement)], total: true },
        { cells: ['Cash Invested c/f', gbp(accounts.cashInvested)] },
        { cells: ['Overdraft Limit (next quarter)', gbp(accounts.overdraftLimitNext)] },
      ]} />
    </div>
  );
}

function GroupInfoReport({ group }) {
  if (!group?.companies) {
    // Fall back to mock competitors
    return (
      <div>
        <h3>Group Information</h3>
        <p style={{ fontSize: '0.85em', color: '#555', marginBottom: 8 }}>
          Mock competitor data — no published results yet.
        </p>
        <DataTable headers={['Company', 'Net Worth (£)', 'Net Profit (£)', 'Share Price (£)']} rows={
          COMPETITORS.map(c => ({
            cells: [c.name, gbp(c.netWorth), gbp(c.netProfit), gbp(c.sharePrice)]
          }))
        } />
      </div>
    );
  }

  const companies = group.companies || [];
  const ms = group.market_shares || {};

  return (
    <div>
      <h3>Group Information</h3>
      <h4>Company Summary</h4>
      <DataTable
        headers={['Company', 'Net Worth (£)', 'Net Profit (£)', 'Share Price (£)', 'Dividend %']}
        rows={companies.map(c => ({
          cells: [
            `${c.company_name} (#${c.company_number})`,
            gbp(c.net_worth),
            gbp(c.net_profit),
            c.share_price != null ? `£${Number(c.share_price).toFixed(2)}` : '—',
            c.dividend_pct != null ? `${Number(c.dividend_pct).toFixed(1)}%` : '—',
          ]
        }))}
      />
      {Object.keys(ms).length > 0 && (
        <>
          <h4>Market Shares</h4>
          {AREAS.map(area => (
            <div key={area}>
              <h5 style={{ marginBottom: 4 }}>{area.charAt(0).toUpperCase() + area.slice(1)}</h5>
              <DataTable
                headers={['Product', ...companies.map(c => c.company_name || `Co.${c.company_number}`)]}
                rows={PRODUCTS.map((prod, pi) => ({
                  cells: [
                    prod,
                    ...(ms[area.toLowerCase()]?.[pi + 1] || []).map(v => pct(v)),
                  ]
                }))}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function PerformanceReport({ pData, accounts, group }) {
  const perf = pData.performance || {};
  const companies = group?.companies || [];
  const myNetWorth = accounts.netWorth ?? perf.netWorth;
  const mySharePrice = accounts.sharePrice ?? perf.sharePrice;

  return (
    <div>
      <h3>Company Performance</h3>
      <DataTable headers={['KPI', 'Value']} rows={[
        { cells: ['Net Worth', myNetWorth ? gbp(myNetWorth) : '—'] },
        { cells: ['Net Profit (after tax)', accounts.netProfit ? gbp(accounts.netProfit) : '—'] },
        { cells: ['Dividends Paid', accounts.dividendsPaid ? gbp(accounts.dividendsPaid) : '—'] },
        { cells: ['Share Price', mySharePrice ? `£${Number(mySharePrice).toFixed(2)}` : (perf.sharePrice ? gbp(perf.sharePrice) : '—')] },
      ]} />
      {companies.length > 0 && (
        <>
          <h4>Ranking</h4>
          <DataTable
            headers={['Rank', 'Company', 'Net Worth (£)', 'Net Profit (£)']}
            rows={[...companies]
              .sort((a, b) => (b.net_worth || 0) - (a.net_worth || 0))
              .map((c, i) => ({
                cells: [i + 1, c.company_name || `Co.${c.company_number}`, gbp(c.net_worth), gbp(c.net_profit)]
              }))}
          />
        </>
      )}
    </div>
  );
}
