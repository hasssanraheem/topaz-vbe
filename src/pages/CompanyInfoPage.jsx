import DataTable from '../components/DataTable.jsx';
import { PERIODS } from '../data/mockData.js';

function gbp(v) { return v != null ? `£${Number(v).toLocaleString('en-GB')}` : '—'; }

export default function CompanyInfoPage({ session, currentPeriod, periodData }) {
  const pData = PERIODS[1];
  const accounts = pData?.accounts || {};

  return (
    <div>
      <h2>Company Information</h2>
      <div className="demo-notice">Demonstration data — not official Topaz-VBE data.</div>

      <section className="info-section">
        <h3>Your Company</h3>
        <DataTable headers={['Item', 'Value']} rows={[
          { cells: ['Team Name', session?.teamName || '—'] },
          { cells: ['Company Number', session?.companyNumber || '—'] },
          { cells: ['Group Number', session?.groupNumber || '—'] },
          { cells: ['Current Period', currentPeriod] },
        ]} />
      </section>

      <section className="info-section">
        <h3>About Topaz Industries (Simulation Background)</h3>
        <p>
          Topaz Industries manufactures three consumer products (Product 1, Product 2, and Product 3) and sells them in four market areas:
          South, West, North, and Export. The company was established 10 years ago and is publicly listed.
        </p>
        <p>
          The company operates <strong>6 CNC machining centres</strong> and uses a two-stage production process:
          machining (automated) followed by assembly (labour-intensive). Products differ significantly in complexity,
          material content, and machining and assembly times.
        </p>
        <p>
          You manage all key decisions: marketing, production, personnel, and finance.
          The simulation runs in quarterly periods. Results are processed by the simulation engine after each submission.
        </p>
      </section>

      <section className="info-section">
        <h3>Initial Financial Position (Period 1 — Demonstration)</h3>
        <DataTable headers={['Item', 'Value']} rows={[
          { cells: ['Share Capital', gbp(accounts.shareCapital)] },
          { cells: ['Reserves', gbp(accounts.reserves)] },
          { cells: ['Net Worth', gbp(accounts.netWorth)] },
          { cells: ['Machines', `${pData.resources?.machinesAvailable || 6} units`] },
          { cells: ['Vehicles', `${pData.resources?.vehiclesAvailable || 4} units`] },
        ]} />
      </section>

      <section className="info-section">
        <h3>Products</h3>
        <DataTable headers={['', 'Product 1', 'Product 2', 'Product 3']} rows={[
          { cells: ['Machining Time (min/unit)', 60, 75, 120] },
          { cells: ['Min. Assembly Time (min/unit)', 100, 150, 300] },
          { cells: ['Material Content (units/product)', 1, 2, 3] },
        ]} />
      </section>

      <section className="info-section">
        <h3>Market Areas</h3>
        <DataTable headers={['Area', 'Notes']} rows={[
          { cells: ['South', 'Largest home market. Highest competition.'] },
          { cells: ['West', 'Mid-sized home market.'] },
          { cells: ['North', 'Smaller home market. Lower transport cost.'] },
          { cells: ['Export', 'Export pricing only. Separate price per product.'] },
        ]} />
      </section>

      <section className="info-section">
        <h3>Key Rules</h3>
        <ul style={{ fontSize: '0.9em', lineHeight: 1.7 }}>
          <li>Dividends may only be declared in Q1 and Q3 (first and third quarters of the financial year).</li>
          <li>Assembly workers' wages cannot be reduced below the previous quarter's rate or below £8.50/hour.</li>
          <li>Machines ordered take three quarters to become available (deposit in Q+1, balance in Q+2, available in Q+3).</li>
          <li>Factory material storage is limited to 2,000 units; excess stored externally at £1.50/unit.</li>
          <li>Machine maintenance: contracted hours at £60/hr per machine; uncontracted repairs at £120/hr.</li>
          <li>Production must go through machining before assembly. Both capacity constraints apply.</li>
        </ul>
      </section>

      <p style={{ fontSize: '0.8em', color: '#777', marginTop: 16 }}>
        This application is an educational prototype.
        It is not affiliated with Edit 515 Ltd or the official Topaz-VBE system.
      </p>
    </div>
  );
}
