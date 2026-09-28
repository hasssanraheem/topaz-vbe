export default function SideNav({ currentPage, currentSub, onNavigate, submitted }) {
  const nav = (page, sub) => () => onNavigate(page, sub);
  const active = (page, sub) => {
    const match = currentPage === page && (!sub || currentSub === sub);
    return match ? 'active' : '';
  };

  return (
    <nav id="side-nav">
      <div className="nav-title">Topaz-Vbe</div>
      <ul>
        <li>
          <button className={`nav-btn ${active('menu')}`} onClick={nav('menu')}>
            Main Menu
          </button>
        </li>

        <li><span className="nav-section-label">Decisions</span></li>
        <li>
          {/* Single decision form replaces Marketing/Production/Personnel/Finance tabs */}
          <button className={`nav-btn ${active('decisions')}`} onClick={nav('decisions')}>
            Decision Form
          </button>
        </li>

        <li><span className="nav-section-label">Reports</span></li>
        <li className="nav-sub">
          <button className={`nav-btn ${active('reports','decisions-made')}`} onClick={nav('reports','decisions-made')}>
            Decisions Made
          </button>
        </li>
        <li className="nav-sub">
          <button className={`nav-btn ${active('reports','resources')}`} onClick={nav('reports','resources')}>
            Resources Employed
          </button>
        </li>
        <li className="nav-sub">
          <button className={`nav-btn ${active('reports','product-stats')}`} onClick={nav('reports','product-stats')}>
            Product Statistics
          </button>
        </li>
        <li className="nav-sub">
          <button className={`nav-btn ${active('reports','overhead-costs')}`} onClick={nav('reports','overhead-costs')}>
            Overhead Costs
          </button>
        </li>
        <li className="nav-sub">
          <button className={`nav-btn ${active('reports','pnl')}`} onClick={nav('reports','pnl')}>
            Profit &amp; Loss
          </button>
        </li>
        <li className="nav-sub">
          <button className={`nav-btn ${active('reports','balance-sheet')}`} onClick={nav('reports','balance-sheet')}>
            Balance Sheet
          </button>
        </li>
        <li className="nav-sub">
          <button className={`nav-btn ${active('reports','cash-flow')}`} onClick={nav('reports','cash-flow')}>
            Cash Flow
          </button>
        </li>
        <li className="nav-sub">
          <button className={`nav-btn ${active('reports','group-info')}`} onClick={nav('reports','group-info')}>
            Group Information
          </button>
        </li>
        <li className="nav-sub">
          <button className={`nav-btn ${active('reports','performance')}`} onClick={nav('reports','performance')}>
            Company Performance
          </button>
        </li>

        <li><span className="nav-section-label">Actions</span></li>
        <li>
          <button className={`nav-btn ${active('review')}`} onClick={nav('review')}>
            Review Decisions
          </button>
        </li>
        <li>
          <button className={`nav-btn ${active('submit')}`} onClick={nav('submit')}>
            Submit{submitted ? ' ✓' : ''}
          </button>
        </li>

        <li><span className="nav-section-label">Info</span></li>
        <li>
          <button className={`nav-btn ${active('company-info')}`} onClick={nav('company-info')}>
            Company Info
          </button>
        </li>
        <li>
          <button className={`nav-btn ${active('help')}`} onClick={nav('help')}>
            Help / Manual
          </button>
        </li>
      </ul>
      <div className="nav-copyright">Educational replica — not affiliated with Edit 515 Ltd</div>
    </nav>
  );
}
