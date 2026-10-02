import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DecisionFormPage from './DecisionFormPage.jsx';
import { DEFAULT_DECISIONS, PERIODS } from '../data/mockData.js';
import { apiFetch } from '../lib/api.js';

const NUM_COMPANIES = 8;
const COMPANY_TABS  = Array.from({ length: NUM_COMPANIES }, (_, i) => i + 1);
const DEFAULT_PERIOD = 1;
function getPeriodData(p) { return PERIODS[p] || PERIODS[1]; }
function getQuarter(p)    { return ((p - 1) % 4) + 1; }

function gbp(v) {
  if (v == null) return '—';
  return `£${Number(v).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ── Management Report: shows all companies' latest published reports ──────────
function ManagementReports({ reports }) {
  if (!reports || reports.length === 0) {
    return (
      <div style={{ marginTop: 24, padding: '12px 16px', background: '#f8f8f8', border: '1px solid #ddd' }}>
        <strong>Management Reports</strong>
        <p style={{ color: '#888', margin: '8px 0 0', fontSize: '0.88em' }}>
          No published reports yet. Use the Advance tab to run the simulation.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: '1em', borderBottom: '2px solid #1a3a6b', paddingBottom: 4, marginBottom: 12 }}>
        Management Reports — All Companies
      </h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {reports.map(r => (
          <CompanyReport key={r.companyNumber} report={r} />
        ))}
      </div>
    </div>
  );
}

function CompanyReport({ report }) {
  const [open, setOpen] = useState(false);
  const d = report.data || {};
  const pnl = d.pnl || {};
  const bs  = d.balance_sheet || {};
  const meta = d.meta || {};

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 3 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', padding: '8px 12px',
          background: '#1a3a6b', color: '#fff', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.9em',
        }}
      >
        <span>
          Company {report.companyNumber}
          {meta.year ? ` — ${meta.year} Q${meta.quarter}` : ''}
        </span>
        <span style={{ fontSize: '0.8em' }}>
          Net Worth: {gbp(bs.net_worth)} &nbsp;|&nbsp; Net Profit: {gbp(pnl.net_profit)} &nbsp; {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 20px', fontSize: '0.85em' }}>
          <ReportBlock title="Profit & Loss">
            <Row label="Sales Revenue"     val={gbp(pnl.sales_revenue)} />
            <Row label="Cost of Sales"     val={gbp(pnl.cost_of_sales)} />
            <Row label="Gross Profit"      val={gbp(pnl.gross_profit)} bold />
            <Row label="Total Overheads"   val={gbp(pnl.total_overheads)} />
            <Row label="Profit Before Tax" val={gbp(pnl.profit_before_tax)} bold />
            <Row label="Tax"               val={gbp(pnl.tax_assessed)} />
            <Row label="Net Profit"        val={gbp(pnl.net_profit)} bold />
            <Row label="Dividends Paid"    val={gbp(pnl.dividend_paid)} />
            <Row label="Retained Profit"   val={gbp(pnl.retained_profit)} bold />
          </ReportBlock>
          <ReportBlock title="Balance Sheet">
            <Row label="Fixed Assets"       val={gbp(bs.fixed_assets)} />
            <Row label="Product Stocks"     val={gbp(bs.product_stocks)} />
            <Row label="Material Stocks"    val={gbp(bs.material_stocks)} />
            <Row label="Debtors"            val={gbp(bs.debtors)} />
            <Row label="Cash Invested"      val={gbp(bs.cash_invested)} />
            <Row label="Total Assets"       val={gbp(bs.total_assets)} bold />
            <Row label="Current Liabilities"val={gbp(bs.current_liabilities)} />
            <Row label="Net Assets"         val={gbp(bs.net_assets)} bold />
            <Row label="Net Worth"          val={gbp(bs.net_worth)} bold />
          </ReportBlock>
          <ReportBlock title="Key Metrics">
            <Row label="Share Price"     val={bs.net_worth ? `£${(bs.net_worth / 1_000_000).toFixed(2)}` : '—'} />
            <Row label="Overdraft Limit" val={gbp(bs.overdraft_limit)} />
            <Row label="Bank Overdraft"  val={gbp(bs.bank_overdraft)} />
            <Row label="Tax Due"         val={gbp(bs.tax_due)} />
            <Row label="Creditors"       val={gbp(bs.creditors)} />
            <Row label="Share Capital"   val={gbp(bs.share_capital)} />
            <Row label="Reserves"        val={gbp(bs.reserves)} />
          </ReportBlock>
        </div>
      )}
    </div>
  );
}

function ReportBlock({ title, children }) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: '0.82em', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#555', marginBottom: 6 }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Row({ label, val, bold }) {
  return (
    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
      <td style={{ padding: '2px 0', color: '#444' }}>{label}</td>
      <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: bold ? 700 : 400 }}>{val}</td>
    </tr>
  );
}

// ── Advance Tab ───────────────────────────────────────────────────────────────
function AdvanceTab({ onAdvanced }) {
  const [status, setStatus]   = useState('idle'); // idle | running | done | error
  const [message, setMessage] = useState('');

  async function handleAdvance() {
    if (!window.confirm('Advance to the next quarter? This will lock all decisions and run the simulation.')) return;
    setStatus('running');
    setMessage('');
    try {
      const result = await apiFetch('/api/advance', { method: 'POST', body: JSON.stringify({}) });
      setStatus('done');
      setMessage(result.message || 'Quarter advanced successfully.');
      onAdvanced();
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Advance failed.');
    }
  }

  return (
    <div style={{ padding: '2em 1em', maxWidth: 480 }}>
      <h3 style={{ marginTop: 0 }}>Advance Simulation</h3>
      <p style={{ color: '#555', fontSize: '0.9em', marginBottom: 20 }}>
        Click <strong>Advance Quarter</strong> to lock all company decisions and run the simulation engine.
        Results will appear immediately in each company's Management Report section.
      </p>
      <button
        onClick={handleAdvance}
        disabled={status === 'running'}
        style={{
          padding: '10px 28px', background: status === 'running' ? '#888' : '#1a3a6b',
          color: '#fff', border: 'none', cursor: status === 'running' ? 'not-allowed' : 'pointer',
          fontSize: '1em', borderRadius: 3,
        }}
      >
        {status === 'running' ? 'Running…' : 'Advance Quarter'}
      </button>

      {message && (
        <div style={{
          marginTop: 16, padding: '10px 14px',
          background: status === 'error' ? '#fff0f0' : '#f0fff4',
          border: `1px solid ${status === 'error' ? '#f99' : '#8bc'}`,
          fontSize: '0.88em',
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { appUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]       = useState(1); // 1-8 = company, 0 = advance
  const [decisions, setDecisions]       = useState({}); // { [companyNumber]: dec }
  const [saveStatus, setSaveStatus]     = useState({}); // { [companyNumber]: 'saved'|'error'|'' }
  const [reports, setReports]           = useState([]);  // all companies' reports
  const [reportsLoading, setRepsLoading]= useState(true);

  const periodData = getPeriodData(DEFAULT_PERIOD);
  const quarter    = getQuarter(DEFAULT_PERIOD);
  const session    = { simulationCode: '—', groupNumber: '—', startYear: 2024, startQuarter: 1 };

  // Load all decisions on mount
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

  // Load all reports
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
    } catch (err) {
      setSaveStatus(prev => ({ ...prev, [companyNumber]: 'error' }));
    }
    setTimeout(() => setSaveStatus(prev => ({ ...prev, [companyNumber]: '' })), 3000);
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { state: { message: 'You have been signed out.' } });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4' }}>
      {/* Header */}
      <div style={{
        background: '#1a3a6b', color: '#fff', padding: '10px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '1.05em' }}>Topaz-VBE Business Simulation</span>
          {appUser?.email && (
            <span style={{ marginLeft: 16, fontSize: '0.82em', opacity: 0.8 }}>{appUser.email}</span>
          )}
        </div>
        <button
          onClick={handleLogout}
          style={{ background: '#c00', color: '#fff', border: 'none', padding: '5px 16px', cursor: 'pointer', borderRadius: 2, fontSize: '0.88em' }}
        >
          Sign Out
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ background: '#fff', borderBottom: '2px solid #1a3a6b', display: 'flex', overflowX: 'auto' }}>
        {COMPANY_TABS.map(n => (
          <button
            key={n}
            onClick={() => setActiveTab(n)}
            style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: activeTab === n ? '#1a3a6b' : 'transparent',
              color: activeTab === n ? '#fff' : '#333',
              fontWeight: activeTab === n ? 700 : 400,
              fontSize: '0.88em',
              borderBottom: activeTab === n ? '3px solid #1a3a6b' : '3px solid transparent',
            }}
          >
            Company {n}
          </button>
        ))}
        <button
          onClick={() => setActiveTab(0)}
          style={{
            padding: '10px 18px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            background: activeTab === 0 ? '#8B0000' : 'transparent',
            color: activeTab === 0 ? '#fff' : '#8B0000',
            fontWeight: 700,
            fontSize: '0.88em',
            borderBottom: activeTab === 0 ? '3px solid #8B0000' : '3px solid transparent',
            marginLeft: 'auto',
          }}
        >
          ⚙ Advance
        </button>
      </div>

      {/* Tab content */}
      <div style={{ padding: '16px 20px' }}>
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

// ── Company tab content ───────────────────────────────────────────────────────
function CompanyTabContent({ companyNumber, dec, onChange, onSave, saveStatus, reports, reportsLoading, periodData, quarter, session }) {
  return (
    <div>
      <h2 style={{ marginTop: 0, fontSize: '1.1em', color: '#1a3a6b' }}>Company {companyNumber} — Decisions</h2>

      {/* Decision form */}
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

      {/* Save button */}
      <div style={{ margin: '14px 0 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onSave}
          style={{
            padding: '8px 28px', background: '#1a3a6b', color: '#fff',
            border: 'none', cursor: 'pointer', fontSize: '0.95em', borderRadius: 3,
          }}
        >
          Save Decisions
        </button>
        {saveStatus === 'saved' && <span style={{ color: '#1a7a3a', fontSize: '0.88em' }}>✓ Saved</span>}
        {saveStatus === 'error' && <span style={{ color: '#c00', fontSize: '0.88em' }}>✗ Save failed</span>}
      </div>

      {/* Management reports */}
      {reportsLoading ? (
        <div style={{ color: '#888', fontSize: '0.88em' }}>Loading reports…</div>
      ) : (
        <ManagementReports reports={reports} />
      )}
    </div>
  );
}
