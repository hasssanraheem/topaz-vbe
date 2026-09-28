import DataTable from '../components/DataTable.jsx';
import Button from '../components/Button.jsx';
import { PRODUCTS, AREAS } from '../data/mockData.js';
import { validateAll } from '../logic/validation.js';
import { recalcSummary } from '../logic/calculations.js';

function gbp(v) { return v != null ? `£${Number(v).toLocaleString('en-GB')}` : '—'; }

export default function ReviewPage({ dec, onNavigate, period, periodData, submitted, quarter }) {
  const context = {
    machines:        periodData?.resources?.machinesAvailable || 6,
    assemblyWorkers: periodData?.resources?.personnel?.assemblyWorkers?.nextQtr || 40,
    salespeople:     periodData?.resources?.personnel?.salespeople?.nextQtr || 6,
    reserves:        periodData?.accounts?.reserves || 0,
    prevAssemblyWage: periodData?.decisions?.assemblyWage || 8.50,
    vehicles:        periodData?.resources?.vehiclesAvailable || 4,
    quarter:         quarter || ((period - 1) % 4) + 1,
  };

  const { valid, errors, warnings } = validateAll(dec, context);
  const summary = recalcSummary(dec, periodData);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div>
      <h2>Review Decisions — Period {period}</h2>
      {submitted && <div className="locked-notice">Submitted. Read-only view.</div>}

      {!submitted && (
        <div className={`review-status ${hasErrors ? 'review-errors' : 'review-ok'}`}>
          {hasErrors
            ? `${Object.keys(errors).length} validation error(s) — fix before submitting.`
            : `All decisions valid. ${warnings.length > 0 ? `${warnings.length} warning(s) noted.` : 'Ready to submit.'}`}
        </div>
      )}

      {!submitted && hasErrors && (
        <div className="review-error-list">
          <strong>Errors:</strong>
          <ul>
            {Object.entries(errors).map(([key, msg]) => (
              <li key={key}><span style={{ color: 'red' }}>{key}</span>: {typeof msg === 'object' ? JSON.stringify(msg) : msg}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="review-warning-list">
          <strong>Warnings:</strong>
          <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}

      {/* Prices */}
      <section className="review-section">
        <h3>Prices</h3>
        <DataTable headers={['Product', 'Home (£)', 'Export (£)']} rows={
          PRODUCTS.map((prod, p) => ({
            cells: [prod, gbp(dec.prices?.home?.[p]), gbp(dec.prices?.export?.[p])]
          }))
        } />
      </section>

      {/* Promotion */}
      <section className="review-section">
        <h3>Promotion Expenditure (£)</h3>
        <DataTable headers={['Type', ...PRODUCTS]} rows={[
          { cells: ['Trade Press',    ...(dec.promotion?.tradePres     || [0,0,0]).map(gbp)] },
          { cells: ['Ad Support',     ...(dec.promotion?.adSupport     || [0,0,0]).map(gbp)] },
          { cells: ['Merchandising',  ...(dec.promotion?.merchandising || [0,0,0]).map(gbp)] },
        ]} />
      </section>

      {/* Delivery Schedule */}
      <section className="review-section">
        <h3>Delivery Schedule (units) — area order: {AREAS.join(', ')}</h3>
        <DataTable headers={['Product', ...AREAS, 'Total']} rows={
          PRODUCTS.map((prod, p) => {
            const row = dec.deliverySchedule?.[p] || [0,0,0,0];
            const total = row.reduce((s, v) => s + (parseInt(v) || 0), 0);
            return { cells: [prod, ...row, total] };
          })
        } />
      </section>

      {/* Estimated summary */}
      <section className="review-section">
        <h3>Estimated Outcome (simplified model)</h3>
        <div className="demo-notice">Uses simplified educational model — not the official Topaz-VBE engine.</div>
        <DataTable headers={['Item', 'Estimate']} rows={[
          { cells: ['Revenue',           gbp(summary.estimatedRevenue)] },
          { cells: ['Personnel Costs',   gbp(summary.personnelCosts)] },
          { cells: ['Production Costs',  gbp(summary.productionCosts)] },
          { cells: ['Overheads',         gbp(summary.overheads)] },
          { cells: ['Net Profit/(Loss)', gbp(summary.netProfit)] },
        ]} />
      </section>

      {/* Other key decisions */}
      <section className="review-section">
        <h3>Other Decisions</h3>
        <DataTable headers={['Decision', 'Value']} rows={[
          { cells: ['Shift Level',         dec.shiftLevel || '—'] },
          { cells: ['Assembly Wage',        dec.assemblyWage ? `£${Number(dec.assemblyWage).toFixed(2)}/hr` : '—'] },
          { cells: ['Days Credit',          dec.daysCredit != null ? `${dec.daysCredit} days` : '—'] },
          { cells: ['Salesperson Salary',   gbp(dec.salespersonSalary)] },
          { cells: ['Sales Commission',     dec.salesCommission != null ? `${dec.salesCommission}%` : '—'] },
          { cells: ['Management Budget',    gbp(dec.managementBudget)] },
          { cells: ['Dividend Rate',        dec.dividendRate != null ? `${dec.dividendRate}p/share` : '—'] },
          { cells: ['Vans to Buy',          dec.vansToBuy ?? '—'] },
          { cells: ['Vans to Sell',         dec.vansToSell ?? '—'] },
          { cells: ['Research Exp (total)', gbp((dec.researchExp || [0,0,0]).reduce((s,v) => s + (Number(v)||0), 0))] },
        ]} />
      </section>

      {!submitted && (
        <div style={{ marginTop: 12 }}>
          <Button onClick={() => onNavigate('submit')} disabled={hasErrors}>
            Proceed to Submit
          </Button>
          {hasErrors && (
            <span style={{ marginLeft: 12, color: 'red', fontSize: '0.88em' }}>
              Fix errors above before submitting.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
