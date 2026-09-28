import { useState, useEffect } from 'react';
import DecisionPanel from '../components/DecisionPanel.jsx';
import NumberField from '../components/NumberField.jsx';
import CheckField from '../components/CheckField.jsx';
import Button from '../components/Button.jsx';
import Message from '../components/Message.jsx';
import { validatePrices, validateAdvertising, validateProductDev, validateDaysCredit,
         validateSalespeopleAlloc, validateSalespersonSalary, validateSalesCommission,
         validateManagementBudget } from '../logic/validation.js';
import { saveDecisions, loadDecisions } from '../logic/storage.js';
import { AREAS, PRODUCTS } from '../data/mockData.js';

export default function MarketingPage({ dec, onChange, period, disabled, periodData }) {
  const [saveMsg, setSaveMsg] = useState('');
  const totalSalespeople = periodData?.resources?.personnel?.salespeople?.nextQtr || 6;

  const priceE = validatePrices(dec.prices);
  const advE = validateAdvertising(dec.advertising);
  const devE = validateProductDev(dec.productDev);
  const creditE = validateDaysCredit(dec.daysCredit);
  const allocE = validateSalespeopleAlloc(dec.salespeopleAlloc, totalSalespeople);
  const salE = validateSalespersonSalary(dec.salespersonSalary);
  const commE = validateSalesCommission(dec.salesCommission);
  const mgmtE = validateManagementBudget(dec.managementBudget);

  const allocSum = dec.salespeopleAlloc.reduce((s, v) => s + (parseInt(v) || 0), 0);

  function save() {
    if (saveDecisions(period, dec)) setSaveMsg('Decisions saved.');
    else setSaveMsg('Save failed — localStorage may be unavailable.');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  function setPrice(type, p, val) {
    const prices = { ...dec.prices, [type]: [...dec.prices[type]] };
    prices[type][p] = val;
    onChange({ ...dec, prices });
  }

  function setAdv(p, a, val) {
    const advertising = dec.advertising.map(r => [...r]);
    advertising[p][a] = val;
    onChange({ ...dec, advertising });
  }

  function setDev(p, val) {
    const productDev = [...dec.productDev];
    productDev[p] = val;
    onChange({ ...dec, productDev });
  }

  function setAlloc(a, val) {
    const salespeopleAlloc = [...dec.salespeopleAlloc];
    salespeopleAlloc[a] = val;
    onChange({ ...dec, salespeopleAlloc });
  }

  function setImprove(p, val) {
    const implementImprovement = [...dec.implementImprovement];
    implementImprovement[p] = val;
    onChange({ ...dec, implementImprovement });
  }

  return (
    <div>
      <h2>Marketing Decisions</h2>
      {disabled && <div className="locked-notice">This period has been submitted. Decisions are read-only.</div>}

      {/* Pricing */}
      <DecisionPanel title="Product Selling Prices">
        <table className="grid-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Home Areas (£)</th>
              <th>Export Price (£)</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((prod, p) => (
              <tr key={p}>
                <td className="label-cell">{prod}</td>
                <td>
                  <input type="number" min="0" step="1" disabled={disabled}
                    value={dec.prices.home[p]}
                    onChange={e => setPrice('home', p, e.target.value)} />
                  {priceE.home[p] && <div style={{ color: 'red', fontSize: '0.8em' }}>{priceE.home[p]}</div>}
                </td>
                <td>
                  <input type="number" min="0" step="1" disabled={disabled}
                    value={dec.prices.export[p]}
                    onChange={e => setPrice('export', p, e.target.value)} />
                  {priceE.export[p] && <div style={{ color: 'red', fontSize: '0.8em' }}>{priceE.export[p]}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: '0.8em', color: '#555' }}>Enter 0 to withdraw a product from all home markets.</p>
      </DecisionPanel>

      {/* Advertising */}
      <DecisionPanel title="Advertising Expenditure (£ per product per area)">
        <table className="grid-table">
          <thead>
            <tr>
              <th>Product</th>
              {AREAS.map(a => <th key={a}>{a}</th>)}
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((prod, p) => (
              <tr key={p}>
                <td className="label-cell">{prod}</td>
                {AREAS.map((_, a) => (
                  <td key={a}>
                    <input type="number" min="0" step="100" disabled={disabled}
                      value={dec.advertising[p][a]}
                      onChange={e => setAdv(p, a, e.target.value)} />
                    {advE[p]?.[a] && <div style={{ color: 'red', fontSize: '0.8em' }}>{advE[p][a]}</div>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </DecisionPanel>

      {/* Product Development */}
      <DecisionPanel title="Product Development Expenditure">
        <table className="grid-table">
          <thead><tr><th>Product</th><th>Spend (£)</th><th>Implement Major Improvement?</th></tr></thead>
          <tbody>
            {PRODUCTS.map((prod, p) => (
              <tr key={p}>
                <td className="label-cell">{prod}</td>
                <td>
                  <input type="number" min="0" step="1000" disabled={disabled}
                    value={dec.productDev[p]}
                    onChange={e => setDev(p, e.target.value)} />
                  {devE[p] && <div style={{ color: 'red', fontSize: '0.8em' }}>{devE[p]}</div>}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input type="checkbox" disabled={disabled}
                    checked={dec.implementImprovement[p]}
                    onChange={e => setImprove(p, e.target.checked)} />
                  {periodData?.productStats?.improvements?.[p] === 'Major' &&
                    <span style={{ marginLeft: 6, color: 'green', fontSize: '0.85em' }}>Major improvement available!</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DecisionPanel>

      {/* Credit and Intelligence */}
      <DecisionPanel title="Credit Terms and Business Intelligence">
        <NumberField label="Days Credit Allowed" value={dec.daysCredit} unit="days"
          onChange={v => onChange({ ...dec, daysCredit: v })} error={creditE} disabled={disabled} min={0} />
        <div style={{ marginTop: 8 }}>
          <CheckField label="Purchase competitor activities information (£5,000)"
            checked={dec.buyCompetitorInfo}
            onChange={v => onChange({ ...dec, buyCompetitorInfo: v })} disabled={disabled} />
          <CheckField label="Purchase market shares information (£5,000)"
            checked={dec.buyMarketShares}
            onChange={v => onChange({ ...dec, buyMarketShares: v })} disabled={disabled} />
        </div>
      </DecisionPanel>

      {/* Selling */}
      <DecisionPanel title="Selling — Salespeople Allocation">
        <p style={{ fontSize: '0.85em', marginBottom: 6 }}>
          Salespeople available: <strong>{totalSalespeople}</strong> | Allocated: <strong>{allocSum}</strong>
          {allocSum > totalSalespeople && <span style={{ color: 'red', marginLeft: 8 }}>Exceeds available!</span>}
        </p>
        <table className="grid-table">
          <thead><tr><th>Area</th><th>Salespeople Allocated</th></tr></thead>
          <tbody>
            {AREAS.map((area, a) => (
              <tr key={a}>
                <td className="label-cell">{area}</td>
                <td>
                  <input type="number" min="0" step="1" disabled={disabled}
                    value={dec.salespeopleAlloc[a]}
                    onChange={e => setAlloc(a, e.target.value)} />
                  {allocE[a] && <div style={{ color: 'red', fontSize: '0.8em' }}>{allocE[a]}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <NumberField label="Salesperson's Quarterly Salary" value={dec.salespersonSalary}
          unit="£" onChange={v => onChange({ ...dec, salespersonSalary: v })}
          error={salE} disabled={disabled} min={2000} />
        <NumberField label="Sales Commission %" value={dec.salesCommission}
          unit="%" onChange={v => onChange({ ...dec, salesCommission: v })}
          error={commE} disabled={disabled} min={0} />
        <NumberField label="Management Budget" value={dec.managementBudget}
          unit="£" onChange={v => onChange({ ...dec, managementBudget: v })}
          error={mgmtE} disabled={disabled} min={40000} />
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
