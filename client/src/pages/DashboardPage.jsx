import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DecisionFormPage from './DecisionFormPage.jsx';
import { DEFAULT_DECISIONS, PERIODS } from '../data/mockData.js';
import { apiFetch } from '../lib/api.js';

const NUM_COMPANIES  = 8;
const COMPANY_TABS   = Array.from({ length: NUM_COMPANIES }, (_, i) => i + 1);
const DEFAULT_PERIOD = 1;
function getPeriodData(p) { return PERIODS[p] || PERIODS[1]; }
function getQuarter(p)    { return ((p - 1) % 4) + 1; }

function gbp(v) {
  if (v == null) return '—';
  return `£${Number(v).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ── Management Reports — all companies ───────────────────────────────────────
function ManagementReports({ reports }) {
  if (!reports || reports.length === 0) {
    return (
      <div style={{ marginTop: 20 }}>
        <h3>Management Reports — All Companies</h3>
        <div className="msg-box msg-info">
          No published reports yet. Use the <strong>Advance</strong> tab to run the simulation.
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Management Reports — All Companies</h3>
      {reports.map(r => (
        <CompanyReport key={r.companyNumber} report={r} />
      ))}
    </div>
  );
}

function CompanyReport({ report }) {
  const [open, setOpen] = useState(false);
  const d    = report.data || {};
  const pnl  = d.pnl           || {};
  const bs   = d.balance_sheet  || {};
  const meta = d.meta           || {};

  return (
    <div className="decision-panel" style={{ marginBottom: 10 }}>
      <div
        className="decision-panel-heading"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        Company {report.companyNumber}
        {meta.year ? ` — Year ${meta.year} Q${meta.quarter}` : ''}
        &nbsp;&nbsp;
        <span style={{ fontWeight: 400, fontSize: '0.9em' }}>
          Net Worth: {gbp(bs.net_worth)} &nbsp;|&nbsp; Net Profit: {gbp(pnl.net_profit)}
        </span>
        <span style={{ float: 'right' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="decision-panel-body">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
            <thead>
              <tr>
                <th className="data-table-col" style={{ background: '#bfe2f9', color: '#036', padding: '4px 8px', border: '1px solid #7C9BCF', textAlign: 'left' }}>Profit &amp; Loss</th>
                <th style={{ background: '#bfe2f9', color: '#036', padding: '4px 8px', border: '1px solid #7C9BCF', textAlign: 'right' }}>£</th>
                <th style={{ background: '#bfe2f9', color: '#036', padding: '4px 8px', border: '1px solid #7C9BCF', textAlign: 'left' }}>Balance Sheet</th>
                <th style={{ background: '#bfe2f9', color: '#036', padding: '4px 8px', border: '1px solid #7C9BCF', textAlign: 'right' }}>£</th>
              </tr>
            </thead>
            <tbody>
              <ReportRow a="Sales Revenue"     av={gbp(pnl.sales_revenue)}     b="Fixed Assets"        bv={gbp(bs.fixed_assets)} />
              <ReportRow a="Cost of Sales"     av={gbp(pnl.cost_of_sales)}     b="Product Stocks"      bv={gbp(bs.product_stocks)} />
              <ReportRow a="Gross Profit"      av={gbp(pnl.gross_profit)}      b="Material Stocks"     bv={gbp(bs.material_stocks)} bold />
              <ReportRow a="Total Overheads"   av={gbp(pnl.total_overheads)}   b="Debtors"             bv={gbp(bs.debtors)} />
              <ReportRow a="Profit Before Tax" av={gbp(pnl.profit_before_tax)} b="Cash Invested"       bv={gbp(bs.cash_invested)} bold />
              <ReportRow a="Tax"               av={gbp(pnl.tax_assessed)}      b="Total Assets"        bv={gbp(bs.total_assets)} />
              <ReportRow a="Net Profit"        av={gbp(pnl.net_profit)}        b="Current Liabilities" bv={gbp(bs.current_liabilities)} bold />
              <ReportRow a="Dividends Paid"    av={gbp(pnl.dividend_paid)}     b="Net Assets"          bv={gbp(bs.net_assets)} />
              <ReportRow a="Retained Profit"   av={gbp(pnl.retained_profit)}   b="Net Worth"           bv={gbp(bs.net_worth)} bold />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReportRow({ a, av, b, bv, bold }) {
  const s = bold ? { fontWeight: 'bold', background: '#c0e0f8' } : {};
  return (
    <tr style={s}>
      <td style={{ padding: '3px 8px', border: '1px solid #7C9BCF', background: bold ? '#c0e0f8' : '#e0efff', color: '#036' }}>{a}</td>
      <td style={{ padding: '3px 8px', border: '1px solid #7C9BCF', textAlign: 'right', background: bold ? '#c0e0f8' : '#f0f8ff', fontVariantNumeric: 'tabular-nums' }}>{av}</td>
      <td style={{ padding: '3px 8px', border: '1px solid #7C9BCF', background: bold ? '#c0e0f8' : '#e0efff', color: '#036' }}>{b}</td>
      <td style={{ padding: '3px 8px', border: '1px solid #7C9BCF', textAlign: 'right', background: bold ? '#c0e0f8' : '#f0f8ff', fontVariantNumeric: 'tabular-nums' }}>{bv}</td>
    </tr>
  );
}

// ── Advance Tab ───────────────────────────────────────────────────────────────
function AdvanceTab({ onAdvanced }) {
  const [busy, setBusy]       = useState(false);
  const [msg, setMsg]         = useState('');
  const [isError, setIsError] = useState(false);

  async function handleAdvance() {
    if (!window.confirm('Advance to the next quarter?\n\nThis will lock all current decisions and run the simulation for all companies.')) return;
    setBusy(true);
    setMsg('');
    setIsError(false);
    try {
      const result = await apiFetch('/api/advance', { method: 'POST', body: JSON.stringify({}) });
      setMsg(result.message || 'Quarter advanced successfully.');
      onAdvanced();
    } catch (err) {
      setIsError(true);
      setMsg(err.message || 'Advance failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2>Advance Simulation</h2>
      <div className="decision-panel" style={{ maxWidth: 520 }}>
        <div className="decision-panel-heading">Run Next Quarter</div>
        <div className="decision-panel-body">
          <p>
            Click <strong>Advance Quarter</strong> to lock all company decisions and run the
            simulation engine. Results will appear in each company's Management Report section.
          </p>
          <button
            className="btn btn-submit"
            onClick={handleAdvance}
            disabled={busy}
            style={{ marginTop: 8 }}
          >
            {busy ? 'Running simulation…' : 'Advance Quarter'}
          </button>

          {msg && (
            <div className={`msg-box ${isError ? 'msg-error' : 'msg-success'}`} style={{ marginTop: 12 }}>
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { appUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]         = useState(1);
  const [decisions, setDecisions]         = useState({});
  const [saveStatus, setSaveStatus]       = useState({});
  const [reports, setReports]             = useState([]);
  const [reportsLoading, setRepsLoading]  = useState(true);

  const periodData = getPeriodData(DEFAULT_PERIOD);
  const quarter    = getQuarter(DEFAULT_PERIOD);
  const session    = { simulationCode: '—', groupNumber: '—', startYear: 2024, startQuarter: 1 };

  // Load all 8 companies' decisions on mount
  useEffect(() => {
    apiFetch('/api/decisions/all')
      .then(data => {
        const map = {};
        for (const d of (data || [])) {
          map[d.companyNumber] = d.decisions || { ...DEFAULT_DECISIONS };
        }
        setDecisions(map);
      })
      .catch(() => {});
  }, []);

  // Load all published reports
  const loadReports = useCallback(() => {
    setRepsLoading(true);
    apiFetch('/api/reports/all')
      .then(data => setReports(data || []))
      .catch(() => setReports([]))
      .finally(() => setRepsLoading(false));
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  function getDecForCompany(n) {
    return decisions[n] || { ...DEFAULT_DECISIONS };
  }

  function handleDecChange(companyNumber, newDec) {
    setDecisions(prev => ({ ...prev, [companyNumber]: newDec }));
  }

  async function handleSave(companyNumber) {
    const dec = decisions[companyNumber] || DEFAULT_DECISIONS;
    try {
      await apiFetch('/api/decisions', {
        method: 'PUT',
        body: JSON.stringify({ companyNumber, data: dec }),
      });
      setSaveStatus(prev => ({ ...prev, [companyNumber]: 'saved' }));
    } catch {
      setSaveStatus(prev => ({ ...prev, [companyNumber]: 'error' }));
    }
    setTimeout(() => setSaveStatus(prev => ({ ...prev, [companyNumber]: '' })), 3000);
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { state: { message: 'You have been signed out.' } });
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header — original style */}
      <div id="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>Topaz-VBE Business Simulation</h1>
          <button className="btn btn-danger" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
        {appUser?.email && (
          <div className="header-meta">
            Signed in as: <strong>{appUser.email}</strong>
          </div>
        )}
      </div>

      {/* Company tab bar — uses existing sub-nav-tabs / sub-tab classes */}
      <div style={{ padding: '8px 20px 0', background: '#eee7c7', borderBottom: '2px solid #c9b87a' }}>
        <div className="sub-nav-tabs" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
          {COMPANY_TABS.map(n => (
            <button
              key={n}
              className={`sub-tab${activeTab === n ? ' active' : ''}`}
              onClick={() => setActiveTab(n)}
            >
              Company {n}
            </button>
          ))}
          <button
            className={`sub-tab${activeTab === 0 ? ' active' : ''}`}
            onClick={() => setActiveTab(0)}
            style={{
              marginLeft: 'auto',
              background: activeTab === 0 ? '#c0e0c0' : '#dde8dd',
              borderColor: activeTab === 0 ? '#4a8' : '#aaa',
              color: '#264',
            }}
          >
            &#9654; Advance
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div id="page-body">
        {activeTab === 0 ? (
          <AdvanceTab onAdvanced={loadReports} />
        ) : (
          <CompanyTabContent
            companyNumber={activeTab}
            dec={getDecForCompany(activeTab)}
            onChange={newDec => handleDecChange(activeTab, newDec)}
            onSave={() => handleSave(activeTab)}
            saveStatus={saveStatus[activeTab] || ''}
            reports={reports}
            reportsLoading={reportsLoading}
            periodData={periodData}
            quarter={quarter}
            session={session}
          />
        )}
      </div>
    </div>
  );
}

// ── Per-company tab content ───────────────────────────────────────────────────
function CompanyTabContent({ companyNumber, dec, onChange, onSave, saveStatus, reports, reportsLoading, periodData, quarter, session }) {
  return (
    <div>
      <h2>Company {companyNumber} — Decision Form</h2>

      <DecisionFormPage
        dec={dec}
        onChange={onChange}
        teamNumber={companyNumber}
        period={DEFAULT_PERIOD}
        disabled={false}
        periodData={periodData}
        quarter={quarter}
        session={session}
        onNavigate={() => {}}
      />

      {/* Save button row */}
      <div style={{ margin: '10px 0 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-submit" onClick={onSave}>
          Save Decisions
        </button>
        {saveStatus === 'saved' && (
          <span className="msg-box msg-success" style={{ display: 'inline', padding: '2px 10px' }}>
            &#10003; Saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="msg-box msg-error" style={{ display: 'inline', padding: '2px 10px' }}>
            &#10007; Save failed
          </span>
        )}
      </div>

      <hr />

      {/* Management reports */}
      {reportsLoading ? (
        <p style={{ color: '#555', fontSize: '0.88em' }}>Loading reports…</p>
      ) : (
        <ManagementReports reports={reports} />
      )}
    </div>
  );
}
