export default function Header({ teamName, period, onLogout }) {
  return (
    <div id="page-header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Topaz-Vbe Business Simulation</h1>
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              background: '#c20',
              color: '#fff',
              border: 'none',
              padding: '4px 14px',
              cursor: 'pointer',
              fontFamily: 'Arial, sans-serif',
              fontSize: '0.85em',
              borderRadius: 2,
            }}
          >
            Log Out
          </button>
        )}
      </div>
      {teamName && (
        <div className="header-meta">
          Team: <strong>{teamName}</strong> &nbsp;|&nbsp; Period: <strong>{period}</strong>
        </div>
      )}
    </div>
  );
}
