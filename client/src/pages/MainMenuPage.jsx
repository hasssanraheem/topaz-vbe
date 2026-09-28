import Button from '../components/Button.jsx';

export default function MainMenuPage({ onNavigate, session, currentPeriod, submitted }) {
  const nav = (page, sub) => () => onNavigate(page, sub);

  return (
    <div>
      <h2>Main Menu</h2>
      <p>Welcome, <strong>{session?.teamName}</strong>. You are currently working on <strong>Period {currentPeriod}</strong>.</p>
      {submitted && (
        <div className="locked-notice">
          Period {currentPeriod} has been submitted. Decisions are locked. You may still view all Reports.
        </div>
      )}

      <div className="menu-grid">
        <div className="menu-card">
          <h3>Management Decisions</h3>
          <ul>
            <li><button className="nav-btn" onClick={nav('marketing')}>Marketing</button></li>
            <li><button className="nav-btn" onClick={nav('production')}>Production</button></li>
            <li><button className="nav-btn" onClick={nav('personnel')}>Personnel</button></li>
            <li><button className="nav-btn" onClick={nav('finance')}>Finance</button></li>
          </ul>
        </div>

        <div className="menu-card">
          <h3>Reports</h3>
          <ul>
            <li><button className="nav-btn" onClick={nav('reports', 'decisions-made')}>Decisions Made</button></li>
            <li><button className="nav-btn" onClick={nav('reports', 'resources')}>Resources Employed</button></li>
            <li><button className="nav-btn" onClick={nav('reports', 'product-stats')}>Product Statistics</button></li>
            <li><button className="nav-btn" onClick={nav('reports', 'overhead-costs')}>Overhead Costs Analysis</button></li>
            <li><button className="nav-btn" onClick={nav('reports', 'pnl')}>Profit &amp; Loss</button></li>
            <li><button className="nav-btn" onClick={nav('reports', 'balance-sheet')}>Balance Sheet</button></li>
            <li><button className="nav-btn" onClick={nav('reports', 'cash-flow')}>Cash Flow</button></li>
            <li><button className="nav-btn" onClick={nav('reports', 'group-info')}>Group Information</button></li>
            <li><button className="nav-btn" onClick={nav('reports', 'performance')}>Company Performance</button></li>
          </ul>
        </div>

        <div className="menu-card">
          <h3>Submit &amp; Review</h3>
          <ul>
            <li><button className="nav-btn" onClick={nav('review')}>Review Decisions</button></li>
            <li><button className="nav-btn" onClick={nav('submit')}>Submit Decisions</button></li>
          </ul>
        </div>

        <div className="menu-card">
          <h3>Information</h3>
          <ul>
            <li><button className="nav-btn" onClick={nav('company-info')}>Company Info</button></li>
            <li><button className="nav-btn" onClick={nav('help')}>Help / Manual Summary</button></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
