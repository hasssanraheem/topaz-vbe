export default function HelpPage() {
  return (
    <div>
      <h2>Help &amp; Manual Summary</h2>
      <div className="demo-notice">
        This is an educational summary. Refer to the official Topaz-VBE manual for authoritative rules.
      </div>

      <section className="info-section">
        <h3>How to Use This Simulation</h3>
        <ol style={{ fontSize: '0.9em', lineHeight: 1.8 }}>
          <li>Log in with your team name, company number, and group number.</li>
          <li>Enter your management decisions for the current period using the four decision pages:
            <strong> Marketing, Production, Personnel, Finance</strong>.</li>
          <li>Use <strong>Review Decisions</strong> to check for validation errors and see estimated outcomes.</li>
          <li>When satisfied, go to <strong>Submit Decisions</strong> to lock your decisions and submit to the administrator.</li>
          <li>After processing, use the <strong>Reports</strong> section to review results.</li>
          <li>Repeat for each subsequent period.</li>
        </ol>
      </section>

      <section className="info-section">
        <h3>Marketing Decisions</h3>
        <ul style={{ fontSize: '0.9em', lineHeight: 1.7 }}>
          <li><strong>Prices:</strong> Set home price and export price per product. Enter 0 to withdraw from home markets.</li>
          <li><strong>Advertising:</strong> Specify spend per product per area. Higher advertising increases demand (diminishing returns apply).</li>
          <li><strong>Product Development:</strong> Investment builds toward a Major or Minor improvement. Implement a major improvement when available.</li>
          <li><strong>Days Credit:</strong> Extending credit improves demand but increases working capital requirements.</li>
          <li><strong>Business Intelligence:</strong> Optional £5,000 purchases for competitor activities and market share data.</li>
          <li><strong>Selling:</strong> Allocate salespeople across the four areas. Total allocated cannot exceed available.</li>
          <li><strong>Management Budget:</strong> Minimum £40,000/quarter.</li>
        </ul>
      </section>

      <section className="info-section">
        <h3>Production Decisions</h3>
        <ul style={{ fontSize: '0.9em', lineHeight: 1.7 }}>
          <li><strong>Delivery Schedule:</strong> Units planned per product per area. Negative = stock transfer. Must not exceed production capacity.</li>
          <li><strong>Shift Level:</strong> 1 = single (576 hrs/machine), 2 = double (1,068 hrs), 3 = triple (1,602 hrs).
            Each shift level requires more machinists (4/8/12 per machine).</li>
          <li><strong>Assembly Times:</strong> Can exceed the minimum — reduces assembly worker fatigue but increases cost.</li>
          <li><strong>Contract Maintenance:</strong> Hours contracted per machine per quarter at £60/hr. Reduces uncontracted repair risk.</li>
          <li><strong>Machines:</strong> Order or sell machines. Ordered machines take 3 quarters to arrive. Cost: £200,000 each.</li>
          <li><strong>Materials:</strong> Order raw materials from one of four suppliers (different discount/delivery trade-offs).</li>
        </ul>
      </section>

      <section className="info-section">
        <h3>Personnel Decisions</h3>
        <ul style={{ fontSize: '0.9em', lineHeight: 1.7 }}>
          <li><strong>Salespeople:</strong> Recruit (£1,500), dismiss (£5,000), or train from unemployed pool (£6,000 each).</li>
          <li><strong>Assembly Workers:</strong> Recruit (£1,200), dismiss (£3,000), or train (£4,500). Cannot reduce wage below last quarter's rate or £8.50/hr.</li>
          <li><strong>Machinists:</strong> Managed automatically — 4 per machine per shift level.</li>
          <li>All categories experience natural attrition (leavers) each quarter.</li>
        </ul>
      </section>

      <section className="info-section">
        <h3>Finance Decisions</h3>
        <ul style={{ fontSize: '0.9em', lineHeight: 1.7 }}>
          <li><strong>Dividends:</strong> Only in Q1 and Q3 (first and third quarters of the financial year). Must be funded from reserves.</li>
          <li><strong>Vehicles:</strong> Buy or sell delivery vans (£15,000 each; depreciate at 6.25%/quarter).</li>
          <li>Finance page also shows read-only summaries of last period's profit/loss, cash flow, and balance sheet.</li>
        </ul>
      </section>

      <section className="info-section">
        <h3>Key Constraints to Watch</h3>
        <ul style={{ fontSize: '0.9em', lineHeight: 1.7 }}>
          <li>Production capacity: machining hours and assembly hours are both constraints. Bottleneck limits output.</li>
          <li>Dividends require sufficient undistributed reserves.</li>
          <li>Assembly worker wage cannot be decreased below last quarter's rate.</li>
          <li>Salespeople allocation cannot exceed available salespeople.</li>
          <li>Cannot sell more machines than available.</li>
          <li>Supplier 3 requires a minimum order of 50,000 material units and 12 weekly deliveries.</li>
        </ul>
      </section>

      <section className="info-section">
        <h3>Reports Available</h3>
        <ol style={{ fontSize: '0.9em', lineHeight: 1.7 }}>
          <li><strong>Decisions Made</strong> — review submitted decisions</li>
          <li><strong>Resources Employed</strong> — machines, vehicles, personnel, stock levels</li>
          <li><strong>Product Statistics</strong> — sales volumes, revenue, product quality</li>
          <li><strong>Overhead Costs Analysis</strong> — breakdown of all overhead costs</li>
          <li><strong>Profit &amp; Loss</strong> — income statement</li>
          <li><strong>Balance Sheet</strong> — financial position at period end</li>
          <li><strong>Cash Flow</strong> — cash movements during the period</li>
          <li><strong>Group Information</strong> — competitor standings</li>
          <li><strong>Company Performance</strong> — KPIs and market share</li>
        </ol>
      </section>

      <p style={{ fontSize: '0.8em', color: '#777', marginTop: 20 }}>
        This is an educational prototype replicating the Topaz-VBE simulation by Edit 515 Ltd.
        Demand calculations and results are simplified for educational purposes and do not use the official proprietary engine.
        For authoritative rules, refer to the official Topaz-VBE manual.
      </p>
    </div>
  );
}
