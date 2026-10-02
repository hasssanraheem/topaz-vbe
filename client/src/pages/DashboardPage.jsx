import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DecisionFormPage from './DecisionFormPage.jsx';
import FullManagementReport from '../components/FullManagementReport.jsx';
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
const PAGE_SIZE = 8;

function ManagementReports({ reports }) {
  const [filterYear,     setFilterYear]     = useState('');
  const [filterQtr,      setFilterQtr]      = useState('');
  const [page,           setPage]           = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);

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

  // Collect unique years and quarters actually present in the data
  const years = [...new Set(reports.map(r => r.data?.meta?.year).filter(Boolean))].sort((a, b) => a - b);
  const qtrsForYear = filterYear
    ? [...new Set(reports.filter(r => String(r.data?.meta?.year) === filterYear).map(r => r.data?.meta?.quarter).filter(Boolean))].sort((a, b) => a - b)
    : [...new Set(reports.map(r => r.data?.meta?.quarter).filter(Boolean))].sort((a, b) => a - b);

  const filtered = reports.filter(r => {
    const y = r.data?.meta?.year;
    const q = r.data?.meta?.quarter;
    if (filterYear && String(y) !== filterYear) return false;
    if (filterQtr  && String(q) !== filterQtr)  return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageSlice  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeFilter(yearVal, qtrVal) {
    setFilterYear(yearVal);
    setFilterQtr(qtrVal);
    setPage(1);
  }

  const selStyle = {
    border: '1px solid #7C9BCF', background: '#f7f7e7', padding: '2px 6px',
    fontFamily: 'inherit', fontSize: '0.88em', color: '#015764', cursor: 'pointer',
  };
  const pgBtnStyle = active => ({
    border: '1px solid #7C9BCF', padding: '2px 9px', fontFamily: 'inherit',
    fontSize: '0.85em', cursor: active ? 'default' : 'pointer',
    background: active ? '#015764' : '#f7f7e7',
    color: active ? '#fff' : '#015764',
    fontWeight: active ? 'bold' : 'normal',
  });

  return (
    <div style={{ marginTop: 20 }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>Management Reports — All Companies</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.88em' }}>
          Year:
          <select value={filterYear} onChange={e => changeFilter(e.target.value, filterQtr)} style={selStyle}>
            <option value="">All</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.88em' }}>
          Quarter:
          <select value={filterQtr} onChange={e => changeFilter(filterYear, e.target.value)} style={selStyle}>
            <option value="">All</option>
            {qtrsForYear.map(q => <option key={q} value={q}>Q{q}</option>)}
          </select>
        </label>
        {(filterYear || filterQtr) && (
          <button className="btn" onClick={() => changeFilter('', '')}
            style={{ fontSize: '0.82em', padding: '2px 8px' }}>
            Clear
          </button>
        )}
        <span style={{ fontSize: '0.82em', color: '#555' }}>
          {filtered.length} report{filtered.length !== 1 ? 's' : ''}
          {filtered.length > PAGE_SIZE && ` — page ${safePage} of ${totalPages}`}
        </span>
      </div>

      {/* Full-screen overlay */}
      {selectedReport && (() => {
        const cn = selectedReport.companyNumber;
        const y  = selectedReport.data?.meta?.year;
        const q  = selectedReport.data?.meta?.quarter;
        const prevY = q === 1 ? y - 1 : y;
        const prevQ = q === 1 ? 4 : q - 1;
        const prevRep = reports.find(r =>
          r.companyNumber === cn &&
          r.data?.meta?.year === prevY &&
          r.data?.meta?.quarter === prevQ
        ) || null;
        return (
          <ReportOverlay
            report={selectedReport}
            prevReport={prevRep}
            onClose={() => setSelectedReport(null)}
          />
        );
      })()}

      {/* Report list */}
      {filtered.length === 0 ? (
        <div className="msg-box msg-info">No reports match the selected filter.</div>
      ) : (
        pageSlice.map(r => (
          <CompanyReport
            key={`${r.companyNumber}-${r.round}`}
            report={r}
            onOpen={setSelectedReport}
          />
        ))
      )}

      {/* Pagination bar */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            style={{ fontSize: '0.85em', padding: '2px 10px' }}>
            &#8592; Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={pgBtnStyle(p === safePage)}>
              {p}
            </button>
          ))}
          <button className="btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            style={{ fontSize: '0.85em', padding: '2px 10px' }}>
            Next &#8594;
          </button>
        </div>
      )}
    </div>
  );
}

// ── Full-screen report overlay ────────────────────────────────────────────────
function ReportOverlay({ report, prevReport, onClose }) {
  const d    = report.data || {};
  const meta = d.meta      || {};

  // Close on Escape key
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        background: '#015764', color: '#fff',
        padding: '8px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0,
      }}>
        <span style={{ fontWeight: 'bold' }}>
          Management Report — Company {report.companyNumber}
          {meta.year ? ` · Year ${meta.year} Q${meta.quarter}` : ''}
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => window.print()}
            style={{ fontSize: '0.85em', padding: '3px 12px', background: '#f7f7e7', color: '#015764' }}>
            Print
          </button>
          <button className="btn btn-danger" onClick={onClose}
            style={{ fontSize: '0.85em', padding: '3px 14px', fontWeight: 'bold' }}>
            ✕ Close
          </button>
        </div>
      </div>
      {/* Scrollable report body */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
        <FullManagementReport report={d} prevReport={prevReport?.data || null} />
      </div>
    </div>
  );
}

function CompanyReport({ report, onOpen }) {
  const d    = report.data || {};
  const pnl  = d.pnl           || {};
  const bs   = d.balance_sheet  || {};
  const meta = d.meta           || {};

  return (
    <div className="decision-panel" style={{ marginBottom: 10 }}>
      <div
        className="decision-panel-heading"
        style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onClick={() => onOpen(report)}
        onKeyDown={e => e.key === 'Enter' && onOpen(report)}
        role="button"
        tabIndex={0}
      >
        <span>
          Company {report.companyNumber}
          {meta.year ? ` — Year ${meta.year} Q${meta.quarter}` : ''}
          &nbsp;&nbsp;
          <span style={{ fontWeight: 400, fontSize: '0.9em' }}>
            Net Worth: {gbp(bs.net_worth)} &nbsp;|&nbsp; Net Profit: {gbp(pnl.net_profit)}
          </span>
        </span>
        <span style={{ fontSize: '0.85em', fontWeight: 400 }}>View Report &#8599;</span>
      </div>
    </div>
  );
}

// ── Advance Tab ───────────────────────────────────────────────────────────────
function AdvanceTab({ onAdvanced }) {
  // Session / industry info
  const [sessionInfo, setSessionInfo]     = useState(null);
  // Companies / teams
  const [companies, setCompanies]         = useState([]);
  const [teamFilter, setTeamFilter]       = useState('');
  // Quarters
  const [quartersData, setQuartersData]   = useState({ quarters: [], openQuarter: null });
  // Economic shocks
  const [shocks, setShocks]               = useState({
    gdp_growth_pct: 2.5, inflation_pct: 0, recession: false,
    central_bank_rate: 8, unemployment_pct: 5,
    material_price_change_pct: 0, strike_weeks: 0, strike_weeks_next: 0,
  });
  const [shocksSaved, setShocksSaved]     = useState('');
  // Audit log
  const [auditLog, setAuditLog]           = useState([]);
  // Roll quarter
  const [rolling, setRolling]             = useState(false);
  const [rollMsg, setRollMsg]             = useState('');
  const [rollError, setRollError]         = useState(false);
  // Decision status + require-all toggle
  const [decisionStatus, setDecisionStatus] = useState([]);
  const [requireAll, setRequireAll]         = useState(false);

  function loadAll() {
    apiFetch('/api/advance-admin/session-info').then(setSessionInfo).catch(() => {});
    apiFetch('/api/advance-admin/companies').then(setCompanies).catch(() => {});
    apiFetch('/api/advance-admin/all-quarters').then(setQuartersData).catch(() => {});
    apiFetch('/api/advance-admin/economic-shocks')
      .then(d => { if (d.macro) setShocks(d.macro); })
      .catch(() => {});
    apiFetch('/api/advance-admin/audit-log').then(setAuditLog).catch(() => {});
    apiFetch('/api/advance-admin/decision-status').then(setDecisionStatus).catch(() => {});
  }

  useEffect(() => { loadAll(); }, []);

  // ── Industries panel ──────────────────────────────────────────────────────
  function IndustriesPanel() {
    return (
      <div className="decision-panel" style={{ marginBottom: 18 }}>
        <div className="decision-panel-heading">Industries</div>
        <div className="decision-panel-body" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Industry',        sessionInfo?.industry       || 'Demo Industry'],
                ['Simulation Code', sessionInfo?.simulationCode || 'TOPAZ-DEMO'],
                ['Companies',       sessionInfo?.companies      ?? 8],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td style={{ padding: '6px 12px', border: '1px solid #7C9BCF', background: '#e0efff', color: '#015764', width: '50%' }}>{label}</td>
                  <td style={{ padding: '6px 12px', border: '1px solid #7C9BCF', background: '#f7f7e7', textAlign: 'right' }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Teams panel ───────────────────────────────────────────────────────────
  async function toggleCompany(num) {
    try {
      const updated = await apiFetch(`/api/advance-admin/companies/${num}/toggle`, { method: 'POST', body: '{}' });
      setCompanies(prev => prev.map(c => c.teamNumber === num ? { ...c, active: updated.active } : c));
      apiFetch('/api/advance-admin/audit-log').then(setAuditLog).catch(() => {});
    } catch (err) {
      alert('Toggle failed: ' + err.message);
    }
  }

  const filteredCompanies = companies.filter(c =>
    !teamFilter || c.name.toLowerCase().includes(teamFilter.toLowerCase()) || String(c.teamNumber).includes(teamFilter)
  );

  function TeamsPanel() {
    return (
      <div className="decision-panel" style={{ marginBottom: 18 }}>
        <div className="decision-panel-heading">Teams</div>
        <div className="decision-panel-body">
          <input
            type="text"
            className="field-input"
            placeholder="Filter teams…"
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            style={{ marginBottom: 10, width: 220 }}
          />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88em' }}>
            <thead>
              <tr>
                {['No.', 'Company', 'Group', 'Identity', 'Active', ''].map(h => (
                  <th key={h} style={{ background: '#bfe2f9', color: '#036', padding: '5px 10px', border: '1px solid #7C9BCF', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((c, i) => (
                <tr key={c.teamNumber} style={{ background: i % 2 === 0 ? '#f0f8ff' : '#e0efff' }}>
                  <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF' }}>{c.teamNumber}</td>
                  <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF' }}>{c.name}</td>
                  <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF' }}>{c.group}</td>
                  <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF', fontFamily: 'monospace' }}>{c.identity}</td>
                  <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF' }}>{c.active ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF' }}>
                    <button className="btn" onClick={() => toggleCompany(c.teamNumber)} style={{ fontSize: '0.85em', padding: '2px 10px' }}>
                      {c.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Quarters & Roll panel ─────────────────────────────────────────────────
  const notSubmitted = decisionStatus.filter(d => d.status !== 'submitted');
  const allSubmitted = notSubmitted.length === 0 && decisionStatus.length > 0;
  const rollBlocked  = requireAll && !allSubmitted;

  async function handleRoll() {
    const oq = quartersData.openQuarter;
    const label = oq ? `Year ${oq.year}, Quarter ${oq.quarter}` : 'the next quarter';

    // Option A: warn which companies have not submitted
    if (!allSubmitted && decisionStatus.length > 0) {
      const names = notSubmitted.map(d => `Company ${d.companyNumber} — ${d.name} (${d.status})`).join('\n');
      const proceed = window.confirm(
        `Warning: the following companies have not submitted decisions:\n\n${names}\n\nThey will be auto-passed (last quarter's decisions repeated).\n\nRoll ${label} anyway?`
      );
      if (!proceed) return;
    } else {
      if (!window.confirm(`Roll ${label}?\n\nAll companies have submitted. This will publish results and open the next round.`)) return;
    }

    setRolling(true);
    setRollMsg('');
    setRollError(false);
    try {
      const result = await apiFetch('/api/advance', { method: 'POST', body: JSON.stringify({}) });
      setRollMsg(result.message || 'Quarter rolled successfully.');
      onAdvanced();
      loadAll();
    } catch (err) {
      setRollError(true);
      setRollMsg(err.message || 'Roll failed.');
    } finally {
      setRolling(false);
    }
  }

  function statusBadge(status) {
    const styles = {
      submitted:  { background: '#4a7a3e', color: '#fff', padding: '1px 8px', borderRadius: 3, fontSize: '0.82em' },
      saved:      { background: '#e8a000', color: '#fff', padding: '1px 8px', borderRadius: 3, fontSize: '0.82em' },
      not_saved:  { background: '#c0392b', color: '#fff', padding: '1px 8px', borderRadius: 3, fontSize: '0.82em' },
    };
    const labels = { submitted: 'Submitted', saved: 'Saved', not_saved: 'Not Saved' };
    return <span style={styles[status] || {}}>{labels[status] || status}</span>;
  }

  function fmt(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toISOString().slice(0, 10);
  }

  function QuartersPanel() {
    const { quarters, openQuarter } = quartersData;
    return (
      <div className="decision-panel" style={{ marginBottom: 18 }}>
        <div className="decision-panel-heading">Quarters &amp; Roll</div>
        <div className="decision-panel-body">
          {quarters.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88em', marginBottom: 14 }}>
              <thead>
                <tr>
                  {['Year', 'Quarter', 'Status', 'Deadline', 'Published'].map(h => (
                    <th key={h} style={{ background: '#bfe2f9', color: '#036', padding: '5px 10px', border: '1px solid #7C9BCF', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quarters.map((q, i) => (
                  <tr key={`${q.year}-${q.quarter}`} style={{ background: i % 2 === 0 ? '#f0f8ff' : '#e0efff' }}>
                    <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF' }}>{q.year}</td>
                    <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF' }}>{q.quarter}</td>
                    <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF', fontWeight: q.status === 'OPEN' ? 'bold' : 'normal', color: q.status === 'OPEN' ? '#a03000' : 'inherit' }}>{q.status}</td>
                    <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF' }}>{fmt(q.deadline)}</td>
                    <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF' }}>{fmt(q.publishedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#555', fontSize: '0.9em', marginBottom: 12 }}>No quarters yet. Roll the first quarter to begin.</p>
          )}

          {/* Company decision status table */}
          {decisionStatus.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <strong style={{ color: '#015764', display: 'block', marginBottom: 6 }}>
                Company Submission Status
                <button
                  className="btn"
                  onClick={() => apiFetch('/api/advance-admin/decision-status').then(setDecisionStatus).catch(() => {})}
                  style={{ marginLeft: 10, fontSize: '0.8em', padding: '1px 8px' }}
                >
                  Refresh
                </button>
              </strong>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
                <thead>
                  <tr>
                    {['No.', 'Company', 'Status'].map(h => (
                      <th key={h} style={{ background: '#bfe2f9', color: '#036', padding: '4px 10px', border: '1px solid #7C9BCF', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {decisionStatus.map((d, i) => (
                    <tr key={d.companyNumber} style={{ background: i % 2 === 0 ? '#f0f8ff' : '#e0efff' }}>
                      <td style={{ padding: '4px 10px', border: '1px solid #7C9BCF' }}>{d.companyNumber}</td>
                      <td style={{ padding: '4px 10px', border: '1px solid #7C9BCF' }}>{d.name}</td>
                      <td style={{ padding: '4px 10px', border: '1px solid #7C9BCF' }}>{statusBadge(d.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Require-all toggle (Option B) */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={requireAll}
                onChange={e => setRequireAll(e.target.checked)}
              />
              <span>Require all companies to submit before rolling</span>
            </label>
            {requireAll && !allSubmitted && (
              <div className="msg-box msg-error" style={{ marginTop: 6, display: 'inline-block', padding: '3px 12px' }}>
                {notSubmitted.length} {notSubmitted.length === 1 ? 'company has' : 'companies have'} not submitted — Roll Quarter is blocked.
              </div>
            )}
          </div>

          {openQuarter && (
            <p style={{ marginBottom: 10 }}>
              Open quarter: <strong>Year {openQuarter.year}, Quarter {openQuarter.quarter}.</strong>{' '}
              {requireAll
                ? 'Roll is blocked until all companies submit.'
                : 'Companies without saved decisions will be auto-passed (previous decisions repeated).'}
            </p>
          )}

          <button className="btn btn-submit" onClick={handleRoll} disabled={rolling || rollBlocked}>
            {rolling ? 'Running simulation…' : rollBlocked ? 'Roll Quarter (blocked)' : 'Roll Quarter'}
          </button>

          {rollMsg && (
            <div className={`msg-box ${rollError ? 'msg-error' : 'msg-success'}`} style={{ marginTop: 10 }}>
              {rollMsg}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Economic Shocks panel ─────────────────────────────────────────────────
  function setShock(key, val) {
    setShocks(prev => ({ ...prev, [key]: val }));
  }

  async function saveShocks() {
    setShocksSaved('');
    try {
      await apiFetch('/api/advance-admin/economic-shocks', {
        method: 'PUT',
        body:   JSON.stringify(shocks),
      });
      setShocksSaved('saved');
    } catch (err) {
      setShocksSaved('error:' + err.message);
    }
    setTimeout(() => setShocksSaved(''), 3000);
  }

  const oq = quartersData.openQuarter;

  function EconomicShocksPanel() {
    return (
      <div className="decision-panel" style={{ marginBottom: 18 }}>
        <div className="decision-panel-heading">
          Economic Shocks{oq ? ` — Year ${oq.year}, Quarter ${oq.quarter} (applies at roll)` : ''}
        </div>
        <div className="decision-panel-body">
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <ShockRow label="GDP growth (% per annum)" hint="">
                <NumSpinner value={shocks.gdp_growth_pct} step={0.5} onChange={v => setShock('gdp_growth_pct', v)} />
              </ShockRow>
              <ShockRow label="Inflation (% per annum)" hint="">
                <NumSpinner value={shocks.inflation_pct} step={0.5} onChange={v => setShock('inflation_pct', v)} />
              </ShockRow>
              <tr>
                <td colSpan={2} style={{ padding: '5px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!shocks.recession}
                      onChange={e => setShock('recession', e.target.checked)}
                    />
                    <span>Recession this quarter</span>
                  </label>
                  <div style={{ fontSize: '0.8em', color: '#555', marginLeft: 22 }}>A recession cuts demand by 15%.</div>
                </td>
              </tr>
              <ShockRow label="Central bank base rate (%)" hint="">
                <NumSpinner value={shocks.central_bank_rate} step={0.5} onChange={v => setShock('central_bank_rate', v)} />
              </ShockRow>
              <ShockRow label="Unemployment (%)" hint="">
                <NumSpinner value={shocks.unemployment_pct} step={0.5} onChange={v => setShock('unemployment_pct', v)} />
              </ShockRow>
              <ShockRow label="Material price change next quarter (%)" hint="">
                <NumSpinner value={shocks.material_price_change_pct} step={1} onChange={v => setShock('material_price_change_pct', v)} />
              </ShockRow>
              <ShockRow label="Strike weeks this quarter (0–3)" hint="Each strike week removes 48 assembly hours per worker.">
                <NumSpinner value={shocks.strike_weeks} step={1} min={0} max={3} integer onChange={v => setShock('strike_weeks', v)} />
              </ShockRow>
              <ShockRow label="Strike weeks announced for NEXT quarter (0–3)" hint="Shown as a notice in this quarter's Resources report and applied when the next quarter is rolled.">
                <NumSpinner value={shocks.strike_weeks_next} step={1} min={0} max={3} integer onChange={v => setShock('strike_weeks_next', v)} />
              </ShockRow>
            </tbody>
          </table>

          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-submit" onClick={saveShocks}>Save Economic Settings</button>
            {shocksSaved === 'saved' && (
              <span className="msg-box msg-success" style={{ display: 'inline', padding: '2px 10px' }}>&#10003; Saved</span>
            )}
            {shocksSaved.startsWith('error') && (
              <span className="msg-box msg-error" style={{ display: 'inline', padding: '2px 10px' }}>&#10007; {shocksSaved.slice(6)}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Audit Log panel ───────────────────────────────────────────────────────
  function AuditLogPanel() {
    return (
      <div className="decision-panel" style={{ marginBottom: 18 }}>
        <div className="decision-panel-heading">Audit Log</div>
        <div className="decision-panel-body" style={{ padding: 0 }}>
          {auditLog.length === 0 ? (
            <p style={{ padding: '10px 14px', color: '#555' }}>No log entries yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
              <thead>
                <tr>
                  {['Time', 'Actor', 'Action', 'Details'].map(h => (
                    <th key={h} style={{ background: '#bfe2f9', color: '#036', padding: '5px 10px', border: '1px solid #7C9BCF', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLog.map((e, i) => (
                  <tr key={e.id || i} style={{ background: i % 2 === 0 ? '#f0f8ff' : '#e0efff' }}>
                    <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF', whiteSpace: 'nowrap' }}>
                      {new Date(e.timestamp).toLocaleString('en-GB')}
                    </td>
                    <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF' }}>{e.actor}</td>
                    <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF' }}>{e.action}</td>
                    <td style={{ padding: '5px 10px', border: '1px solid #7C9BCF' }}>{e.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ── New Season / Reset panel ──────────────────────────────────────────────
  const [resetting, setResetting]   = useState(false);
  const [resetMsg,  setResetMsg]    = useState('');
  const [resetErr,  setResetErr]    = useState(false);

  async function handleReset() {
    const confirmed = window.confirm(
      'RESET SIMULATION?\n\n' +
      'This will:\n' +
      '  • Archive the current session and all its quarters\n' +
      '  • Start a brand-new session at 2024 Quarter 1\n' +
      '  • Clear all decision forms (companies start fresh)\n\n' +
      'Old reports are preserved in the database but will no longer appear in the UI.\n\n' +
      'Type OK to confirm — this cannot be undone.'
    );
    if (!confirmed) return;

    setResetting(true);
    setResetMsg('');
    setResetErr(false);
    try {
      await apiFetch('/api/advance-admin/reset-session', { method: 'POST', body: '{}' });
      setResetMsg('Season reset. Simulation restarted at 2024 Q1.');
      loadAll();
      onAdvanced();
    } catch (err) {
      setResetErr(true);
      setResetMsg(err.message || 'Reset failed.');
    } finally {
      setResetting(false);
    }
  }

  function ResetPanel() {
    return (
      <div className="decision-panel" style={{ marginBottom: 18, borderColor: '#c0392b' }}>
        <div className="decision-panel-heading" style={{ background: '#7a1a1a', color: '#fff' }}>
          New Season / Reset Simulation
        </div>
        <div className="decision-panel-body">
          <p style={{ marginBottom: 10, color: '#555', fontSize: '0.9em' }}>
            Use this to archive the current session and restart from <strong>2024 Quarter 1</strong> with a clean slate.
            All 8 companies keep their accounts and team names, but decisions and reports are reset.
            Old data is archived and not deleted.
          </p>
          <button
            className="btn btn-danger"
            onClick={handleReset}
            disabled={resetting}
            style={{ background: '#c0392b', color: '#fff', borderColor: '#922b21', fontWeight: 'bold' }}
          >
            {resetting ? 'Resetting…' : 'Reset & Start New Season'}
          </button>
          {resetMsg && (
            <div className={`msg-box ${resetErr ? 'msg-error' : 'msg-success'}`} style={{ marginTop: 10 }}>
              {resetMsg}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Topaz-VBE — Administration</h2>
      <IndustriesPanel />
      <TeamsPanel />
      <QuartersPanel />
      <EconomicShocksPanel />
      <AuditLogPanel />
      <ResetPanel />
    </div>
  );
}

// ── Helpers for Economic Shocks ───────────────────────────────────────────────
function ShockRow({ label, hint, children }) {
  return (
    <>
      <tr>
        <td style={{ padding: '5px 0 2px', paddingRight: 16, verticalAlign: 'middle', minWidth: 300 }}>{label}</td>
        <td style={{ padding: '5px 0 2px', verticalAlign: 'middle' }}>{children}</td>
      </tr>
      {hint && (
        <tr>
          <td colSpan={2} style={{ fontSize: '0.8em', color: '#555', paddingBottom: 6, paddingLeft: 2 }}>{hint}</td>
        </tr>
      )}
    </>
  );
}

function NumSpinner({ value, step = 1, min, max, integer, onChange }) {
  function adjust(delta) {
    let v = Number(value) + delta;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    onChange(integer ? Math.round(v) : Math.round(v * 100) / 100);
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={e => {
          let v = parseFloat(e.target.value);
          if (isNaN(v)) v = 0;
          if (min !== undefined) v = Math.max(min, v);
          if (max !== undefined) v = Math.min(max, v);
          onChange(integer ? Math.round(v) : v);
        }}
        style={{
          width: 80, textAlign: 'right', padding: '2px 4px',
          border: '1px solid #7C9BCF', background: '#fff', fontFamily: 'inherit',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <button type="button" className="btn" onClick={() => adjust(step)}
          style={{ fontSize: '0.7em', padding: '0 4px', lineHeight: '1.2', minWidth: 18 }}>▲</button>
        <button type="button" className="btn" onClick={() => adjust(-step)}
          style={{ fontSize: '0.7em', padding: '0 4px', lineHeight: '1.2', minWidth: 18 }}>▼</button>
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
  const [submitStatus, setSubmitStatus]   = useState({});
  const [reports, setReports]             = useState([]);
  const [reportsLoading, setRepsLoading]  = useState(true);
  const [liveSession, setLiveSession]     = useState(null);
  const [liveQuarter, setLiveQuarter]     = useState(null);

  const periodData = getPeriodData(DEFAULT_PERIOD);

  // Load session info and active quarter for decision form header
  const loadSessionAndQuarter = useCallback(() => {
    apiFetch('/api/advance-admin/session-info')
      .then(d => setLiveSession(d))
      .catch(() => {});
    apiFetch('/api/advance-admin/all-quarters')
      .then(d => { if (d.openQuarter) setLiveQuarter(d.openQuarter); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadSessionAndQuarter(); }, [loadSessionAndQuarter]);

  // Load all 8 companies' decisions + server-side submit status
  const loadDecisions = useCallback(() => {
    apiFetch('/api/decisions/all')
      .then(data => {
        const decMap = {};
        const subMap = {};
        for (const d of (data || [])) {
          decMap[d.companyNumber] = d.decisions || { ...DEFAULT_DECISIONS };
          if (d.submitted) subMap[d.companyNumber] = 'submitted';
        }
        setDecisions(decMap);
        setSubmitStatus(subMap);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { loadDecisions(); }, [loadDecisions]);

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
      // Clear submitted state when decisions are re-saved
      setSubmitStatus(prev => ({ ...prev, [companyNumber]: '' }));
    } catch {
      setSaveStatus(prev => ({ ...prev, [companyNumber]: 'error' }));
    }
    setTimeout(() => setSaveStatus(prev => ({ ...prev, [companyNumber]: '' })), 3000);
  }

  async function handleSubmit(companyNumber) {
    try {
      await apiFetch('/api/decisions/submit', {
        method: 'POST',
        body: JSON.stringify({ companyNumber }),
      });
      setSubmitStatus(prev => ({ ...prev, [companyNumber]: 'submitted' }));
    } catch (err) {
      setSubmitStatus(prev => ({ ...prev, [companyNumber]: 'error:' + err.message }));
      setTimeout(() => setSubmitStatus(prev => ({ ...prev, [companyNumber]: '' })), 4000);
    }
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
          <AdvanceTab onAdvanced={() => {
            loadReports();
            loadDecisions();
            loadSessionAndQuarter();
          }} />
        ) : (
          <CompanyTabContent
            companyNumber={activeTab}
            dec={getDecForCompany(activeTab)}
            onChange={newDec => handleDecChange(activeTab, newDec)}
            onSave={() => handleSave(activeTab)}
            onSubmit={() => handleSubmit(activeTab)}
            saveStatus={saveStatus[activeTab] || ''}
            submitStatus={submitStatus[activeTab] || ''}
            reports={reports}
            reportsLoading={reportsLoading}
            periodData={periodData}
            liveSession={liveSession}
            liveQuarter={liveQuarter}
          />
        )}
      </div>
    </div>
  );
}

// ── Per-company tab content ───────────────────────────────────────────────────
function CompanyTabContent({ companyNumber, dec, onChange, onSave, onSubmit, saveStatus, submitStatus, reports, reportsLoading, periodData, liveSession, liveQuarter }) {
  const isSubmitted = submitStatus === 'submitted';

  // Build rich session/quarter objects from live API data
  const session = {
    simulationCode: liveSession?.simulationCode || '—',
    groupNumber:    liveSession?.groupNumber    ?? 1,
    startYear:      liveQuarter?.year           || 2024,
    startQuarter:   liveQuarter?.quarter        || 1,
  };
  const quarter = liveQuarter?.quarter || getQuarter(DEFAULT_PERIOD);

  return (
    <div>
      <h2>Company {companyNumber} — Decision Form</h2>

      <DecisionFormPage
        dec={dec}
        onChange={onChange}
        teamNumber={companyNumber}
        period={DEFAULT_PERIOD}
        disabled={isSubmitted}
        periodData={periodData}
        quarter={quarter}
        session={session}
        saveStatus={saveStatus}
        submitStatus={submitStatus}
        onNavigate={() => {}}
      />

      {/* Save + Submit button row */}
      <div style={{ margin: '10px 0 18px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-submit" onClick={onSave} disabled={isSubmitted}>
          Save Decisions
        </button>

        <button
          className="btn btn-submit"
          onClick={onSubmit}
          disabled={isSubmitted}
          style={{ background: isSubmitted ? '#ccc' : '#4a7a3e', color: '#fff', borderColor: '#3a5a30' }}
        >
          {isSubmitted ? '✓ Submitted' : 'Submit Decisions'}
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
        {submitStatus.startsWith('error') && (
          <span className="msg-box msg-error" style={{ display: 'inline', padding: '2px 10px' }}>
            &#10007; {submitStatus.slice(6) || 'Submit failed'}
          </span>
        )}
      </div>

      {isSubmitted && (
        <div className="msg-box msg-info" style={{ marginBottom: 12 }}>
          Decisions locked for this quarter. The form is read-only until the quarter rolls.
        </div>
      )}

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
