import { useState } from 'react';
import DecisionPanel from '../components/DecisionPanel.jsx';
import NumberField from '../components/NumberField.jsx';
import ReadOnlyTable from '../components/ReadOnlyTable.jsx';
import Button from '../components/Button.jsx';
import Message from '../components/Message.jsx';
import { validateDividendRate, validateVansBuySell } from '../logic/validation.js';
import { saveDecisions } from '../logic/storage.js';

function gbp(v) { return v != null ? `£${Number(v).toLocaleString('en-GB')}` : '—'; }

export default function FinancePage({ dec, onChange, period, disabled, periodData, quarter }) {
  const [saveMsg, setSaveMsg] = useState('');

  const vehicles = periodData?.resources?.vehiclesAvailable || 4;
  const reserves = periodData?.accounts?.reserves || 0;
  const divE = validateDividendRate(dec.dividendRate, quarter, reserves);
  const vansE = validateVansBuySell(dec.vansBuySell, vehicles);
  const q1or3 = [1, 3].includes(quarter);

  const acct = periodData?.accounts || {};

  function save() {
    if (saveDecisions(period, dec)) setSaveMsg('Decisions saved.');
    else setSaveMsg('Save failed.');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  return (
    <div>
      <h2>Finance Decisions</h2>
      {disabled && <div className="locked-notice">This period has been submitted. Decisions are read-only.</div>}

      <div className="demo-notice">Demonstration data — not official Topaz-VBE data.</div>

      {/* Decisions */}
      <DecisionPanel title="Finance Decisions">
        <NumberField
          label={`Dividend Rate (pence per share)${!q1or3 ? ' — not available this quarter' : ''}`}
          value={dec.dividendRate}
          onChange={v => onChange({ ...dec, dividendRate: v })}
          error={divE}
          disabled={disabled || !q1or3}
          min={0}
        />
        {!q1or3 && (
          <p style={{ fontSize: '0.82em', color: '#777', marginLeft: 244, marginTop: -4 }}>
            Dividends may only be declared in Q1 and Q3.
          </p>
        )}
        <p style={{ fontSize: '0.82em', color: '#555', marginLeft: 244, marginBottom: 8 }}>
          Dividends can only be paid from undistributed reserves (currently {gbp(reserves)}).
        </p>

        <NumberField
          label="Vans to Buy or Sell"
          value={dec.vansBuySell}
          onChange={v => onChange({ ...dec, vansBuySell: v })}
          error={vansE}
          disabled={disabled}
        />
        <p style={{ fontSize: '0.82em', color: '#555', marginLeft: 244, marginBottom: 8 }}>
          Positive = buy; negative = sell. Vehicles available: <strong>{vehicles}</strong>.
          Cost: £15,000 each. Depreciation: 6.25%/quarter.
        </p>
      </DecisionPanel>

      {/* Revenue and Costs Summary */}
      <DecisionPanel title="Revenue and Costs — Last Period (read-only)">
        <ReadOnlyTable
          caption="Profit and Loss Summary"
          rows={[
            { label: 'Sales Revenue', value: acct.salesRevenue },
            { label: 'Cost of Sales', value: acct.costOfSales },
            { label: 'Gross Profit / (Loss)', value: acct.grossProfit, total: true },
            { label: 'Total Overheads', value: acct.totalOverheads },
            { label: 'Net Profit / (Loss)', value: acct.netProfit, total: true },
          ]}
        />
      </DecisionPanel>

      {/* Cash position */}
      <DecisionPanel title="Cash Position — Last Period (read-only)">
        <ReadOnlyTable
          caption="Cash Flow"
          rows={[
            { label: 'Trading Receipts', value: acct.tradingReceipts },
            { label: 'Trading Payments', value: -(acct.tradingPayments || 0) },
            { label: 'Net Cash Flow', value: acct.netCashFlow, total: true },
            { label: 'Bank Overdraft', value: -(acct.bankOverdraft || 0) },
            { label: 'Cash Invested', value: acct.cashInvested },
            { label: 'Overdraft Limit (next quarter)', value: acct.overdraftLimitNext },
          ]}
        />
      </DecisionPanel>

      {/* Balance sheet summary */}
      <DecisionPanel title="Balance Sheet Summary — Last Period (read-only)">
        <ReadOnlyTable
          caption="Assets"
          rows={[
            { label: 'Fixed Assets', value: acct.fixedAssets },
            { label: 'Product Stocks', value: acct.productStocks },
            { label: 'Material Stocks', value: acct.materialStocks },
            { label: 'Debtors', value: acct.debtors },
            { label: 'Cash Invested', value: acct.cashInvested },
            { label: 'Total Assets', value: acct.totalAssets, total: true },
          ]}
        />
        <ReadOnlyTable
          caption="Liabilities and Net Worth"
          rows={[
            { label: 'Tax Assessed and Due', value: acct.taxDue },
            { label: 'Creditors', value: acct.creditors },
            { label: 'Bank Overdraft', value: acct.bankOverdraft },
            { label: 'Unsecured Loans', value: acct.unsecuredLoans },
            { label: 'Current Liabilities', value: acct.currentLiabilities, total: true },
            { label: 'Net Assets', value: acct.netAssets },
            { label: 'Share Capital', value: acct.shareCapital },
            { label: 'Reserves', value: acct.reserves },
            { label: 'Net Worth', value: acct.netWorth, total: true },
          ]}
        />
      </DecisionPanel>

      {!disabled && (
        <div style={{ marginTop: 8 }}>
          <Button onClick={save}>Save Decisions</Button>
          {saveMsg && <span style={{ marginLeft: 12, color: saveMsg.includes('failed') ? 'red' : 'green', fontSize: '0.88em' }}>{saveMsg}</span>}
        </div>
      )}
    </div>
  );
}
