export default function SideNav({ currentPage, onNavigate, session, currentPeriod, submitted }) {
  const nav = (page, sub) => () => onNavigate(page, sub);
  const cls = (page, sub) => {
    const match = currentPage.page === page && (!sub || currentPage.sub === sub);
    return match ? 'active' : '';
  };

  return (
    <nav id="side-nav">
      <div className="nav-title">Topaz-Vbe</div>
      <ul>
        <li><button className={`nav-btn ${cls('main-menu')}`} onClick={nav('main-menu')}>Main Menu</button></li>
        <li><span className="nav-section-label">Decisions</span></li>
        <li className="nav-sub"><button className={`nav-btn ${cls('marketing')}`} onClick={nav('marketing')}>Marketing</button></li>
        <li className="nav-sub"><button className={`nav-btn ${cls('production')}`} onClick={nav('production')}>Production</button></li>
        <li className="nav-sub"><button className={`nav-btn ${cls('personnel')}`} onClick={nav('personnel')}>Personnel</button></li>
        <li className="nav-sub"><button className={`nav-btn ${cls('finance')}`} onClick={nav('finance')}>Finance</button></li>
        <li><span className="nav-section-label">Reports</span></li>
        <li className="nav-sub"><button className={`nav-btn ${cls('reports', 'decisions-made')}`} onClick={nav('reports', 'decisions-made')}>Decisions Made</button></li>
        <li className="nav-sub"><button className={`nav-btn ${cls('reports', 'resources')}`} onClick={nav('reports', 'resources')}>Resources Employed</button></li>
        <li className="nav-sub"><button className={`nav-btn ${cls('reports', 'product-stats')}`} onClick={nav('reports', 'product-stats')}>Product Statistics</button></li>
        <li className="nav-sub"><button className={`nav-btn ${cls('reports', 'overhead-costs')}`} onClick={nav('reports', 'overhead-costs')}>Overhead Costs</button></li>
        <li className="nav-sub"><button className={`nav-btn ${cls('reports', 'pnl')}`} onClick={nav('reports', 'pnl')}>Profit &amp; Loss</button></li>
        <li className="nav-sub"><button className={`nav-btn ${cls('reports', 'balance-sheet')}`} onClick={nav('reports', 'balance-sheet')}>Balance Sheet</button></li>
        <li className="nav-sub"><button className={`nav-btn ${cls('reports', 'cash-flow')}`} onClick={nav('reports', 'cash-flow')}>Cash Flow</button></li>
        <li className="nav-sub"><button className={`nav-btn ${cls('reports', 'group-info')}`} onClick={nav('reports', 'group-info')}>Group Information</button></li>
        <li className="nav-sub"><button className={`nav-btn ${cls('reports', 'performance')}`} onClick={nav('reports', 'performance')}>Company Performance</button></li>
        <li><span className="nav-section-label">Actions</span></li>
        <li><button className={`nav-btn ${cls('review')}`} onClick={nav('review')}>Review Decisions</button></li>
        <li><button className={`nav-btn ${cls('submit')}`} onClick={nav('submit')}>
          Submit{submitted ? ' ✓' : ''}
        </button></li>
        <li><span className="nav-section-label">Info</span></li>
        <li><button className={`nav-btn ${cls('company-info')}`} onClick={nav('company-info')}>Company Info</button></li>
        <li><button className={`nav-btn ${cls('help')}`} onClick={nav('help')}>Help / Manual</button></li>
      </ul>
      <div className="nav-copyright">Educational replica — not affiliated with Edit 515 Ltd</div>
    </nav>
  );
}
