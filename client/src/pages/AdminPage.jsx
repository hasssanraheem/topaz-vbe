import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiFetch } from '../lib/api.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return 'Never';
  const ms = Date.now() - new Date(lastSeenAt).getTime();
  if (ms < 2 * 60 * 1000) return 'Active';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(lastSeenAt).toLocaleDateString('en-GB');
}

// Simple modal wrapper
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ background: '#fff', borderRadius: 6, padding: 24, minWidth: 340, maxWidth: 480, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <strong>{title}</strong>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Reset Password Modal ───────────────────────────────────────────────────────

function ResetPasswordModal({ teamNumber, onClose }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, msg }

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirm) { setResult({ ok: false, msg: 'Passwords do not match.' }); return; }
    if (newPassword.length < 6) { setResult({ ok: false, msg: 'Password must be at least 6 characters.' }); return; }
    setBusy(true);
    setResult(null);
    try {
      const data = await apiFetch(`/api/admin/teams/${teamNumber}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword, confirmPassword: confirm }),
      });
      setResult({ ok: true, msg: data.message || 'Password reset successfully.' });
    } catch (err) {
      setResult({ ok: false, msg: err.message || 'Reset failed.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Reset Password — Team ${teamNumber}`} onClose={onClose}>
      {result && (
        <div style={{ marginBottom: 12, color: result.ok ? 'green' : 'red', fontSize: '0.9em' }}>
          {result.msg}
        </div>
      )}
      {!result?.ok && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.88em' }}>New Password</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type={show ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ flex: 1, padding: '6px 8px' }}
                required
              />
              <button type="button" onClick={() => setShow(v => !v)}
                style={{ background: 'none', border: '1px solid #ccc', padding: '5px 8px', cursor: 'pointer', fontSize: '0.82em' }}>
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.88em' }}>Confirm Password</label>
            <input
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box' }}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={busy}
              style={{ padding: '7px 16px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              {busy ? 'Resetting…' : 'Reset Password'}
            </button>
            <button type="button" onClick={onClose}
              style={{ padding: '7px 14px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {result?.ok && (
        <button onClick={onClose}
          style={{ padding: '7px 16px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Close
        </button>
      )}
    </Modal>
  );
}

// ── Teams Tab ─────────────────────────────────────────────────────────────────

function TeamsTab() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resetModal, setResetModal] = useState(null); // teamNumber | null
  const [busy, setBusy] = useState({}); // { teamN: 'signing-out' }
  const [signOutAllState, setSignOutAllState] = useState(null); // null | 'confirming' | { report }
  const [msgBanner, setMsgBanner] = useState(null); // { ok, text }

  const loadTeams = useCallback(async () => {
    try {
      const data = await apiFetch('/api/admin/teams');
      setTeams(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load teams.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  function banner(ok, text) {
    setMsgBanner({ ok, text });
    setTimeout(() => setMsgBanner(null), 5000);
  }

  async function handleSignOut(teamNumber) {
    if (!window.confirm(`Sign out Team ${teamNumber}? Their next request will be rejected.`)) return;
    setBusy(b => ({ ...b, [teamNumber]: true }));
    try {
      const data = await apiFetch(`/api/admin/teams/${teamNumber}/sign-out`, { method: 'POST' });
      banner(true, data.message || `Team ${teamNumber} signed out.`);
    } catch (err) {
      banner(false, err.message || `Failed to sign out Team ${teamNumber}.`);
    } finally {
      setBusy(b => ({ ...b, [teamNumber]: false }));
      loadTeams();
    }
  }

  async function handleSignOutAll() {
    setSignOutAllState('confirming');
  }

  async function confirmSignOutAll() {
    setSignOutAllState('running');
    try {
      const data = await apiFetch('/api/admin/teams/sign-out-all', { method: 'POST' });
      setSignOutAllState({ report: data.report });
    } catch (err) {
      banner(false, err.message || 'Sign-out all failed.');
      setSignOutAllState(null);
    }
    loadTeams();
  }

  function closeResetModal() {
    setResetModal(null);
    loadTeams(); // refresh lastSeen after reset
  }

  if (loading) return <p>Loading teams…</p>;
  if (error)   return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      {msgBanner && (
        <div style={{
          padding: '8px 14px', marginBottom: 12, borderRadius: 4,
          background: msgBanner.ok ? '#d4edda' : '#f8d7da',
          color: msgBanner.ok ? '#155724' : '#721c24',
          border: `1px solid ${msgBanner.ok ? '#c3e6cb' : '#f5c6cb'}`,
          fontSize: '0.9em',
        }}>
          {msgBanner.text}
        </div>
      )}

      <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={handleSignOutAll}
          style={{ padding: '7px 14px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Sign Out All Teams
        </button>
        <button
          onClick={loadTeams}
          style={{ padding: '7px 12px', background: '#eee', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: '0.85em' }}>
          Refresh
        </button>
      </div>

      {/* Sign-out-all confirmation / result */}
      {signOutAllState === 'confirming' && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', padding: '10px 14px', borderRadius: 4, marginBottom: 12 }}>
          <strong>Sign out all 8 teams?</strong> Their next server request will be rejected immediately.
          <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
            <button onClick={confirmSignOutAll}
              style={{ padding: '6px 14px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Confirm
            </button>
            <button onClick={() => setSignOutAllState(null)}
              style={{ padding: '6px 12px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {signOutAllState === 'running' && <p>Signing out all teams…</p>}
      {signOutAllState?.report && (
        <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', padding: 10, borderRadius: 4, marginBottom: 12 }}>
          <strong>Sign-out results:</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: '0.88em' }}>
            {signOutAllState.report.map((r, i) => (
              <li key={i} style={{ color: r.status === 'signed out' ? '#155724' : '#721c24' }}>
                Team {r.teamNumber} ({r.email}): {r.status}{r.error ? ` — ${r.error}` : ''}
              </li>
            ))}
          </ul>
          <button onClick={() => setSignOutAllState(null)}
            style={{ marginTop: 8, padding: '4px 12px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.85em' }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Teams table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            {['Team', 'Email', 'Status', 'Actions'].map(h => (
              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', border: '1px solid #ddd' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map(t => {
            const seenLabel = formatLastSeen(t.lastSeenAt);
            const isActive  = seenLabel === 'Active';
            return (
              <tr key={t.teamNumber} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px 10px', border: '1px solid #ddd', fontWeight: 600 }}>
                  Team {t.teamNumber}
                </td>
                <td style={{ padding: '8px 10px', border: '1px solid #ddd', fontSize: '0.88em', color: '#555' }}>
                  {t.email}
                </td>
                <td style={{ padding: '8px 10px', border: '1px solid #ddd' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: '0.82em',
                    background: isActive ? '#d4edda' : '#f8f9fa',
                    color: isActive ? '#155724' : '#6c757d',
                    border: `1px solid ${isActive ? '#c3e6cb' : '#dee2e6'}`,
                  }}>
                    {seenLabel}
                  </span>
                </td>
                <td style={{ padding: '8px 10px', border: '1px solid #ddd' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setResetModal(t.teamNumber)}
                      style={{ padding: '4px 10px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.82em' }}>
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleSignOut(t.teamNumber)}
                      disabled={busy[t.teamNumber]}
                      style={{ padding: '4px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.82em', opacity: busy[t.teamNumber] ? 0.6 : 1 }}>
                      {busy[t.teamNumber] ? '…' : 'Sign Out'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {resetModal !== null && (
        <ResetPasswordModal teamNumber={resetModal} onClose={closeResetModal} />
      )}
    </div>
  );
}

// ── Advance Tab (shell only) ───────────────────────────────────────────────────

function AdvanceTab() {
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Advance Round</h3>
      <p style={{ color: '#555', fontSize: '0.9em' }}>
        Current session: <strong>—</strong> &nbsp;|&nbsp; Current round: <strong>—</strong>
      </p>
      <button
        disabled
        style={{ padding: '8px 20px', background: '#ccc', color: '#888', border: 'none', borderRadius: 4, cursor: 'not-allowed' }}>
        Advance to Next Round
      </button>
      <p style={{ marginTop: 10, color: '#888', fontSize: '0.85em' }}>
        Available once the simulation engine is connected.
      </p>
    </div>
  );
}

// ── Admin Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState('teams'); // 'teams' | 'advance'
  const navigate = useNavigate();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const tabStyle = active => ({
    padding: '8px 20px',
    cursor: 'pointer',
    border: 'none',
    borderBottom: active ? '3px solid #0056b3' : '3px solid transparent',
    background: 'none',
    fontWeight: active ? 700 : 400,
    color: active ? '#0056b3' : '#333',
    fontSize: '0.95em',
  });

  return (
    <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 16px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.3em' }}>Topaz-VBE Admin</h1>
          <span style={{ fontSize: '0.82em', color: '#888' }}>Simulation Administrator Dashboard</span>
        </div>
        <button
          onClick={handleLogout}
          style={{ padding: '7px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #ddd', marginBottom: 20 }}>
        <button style={tabStyle(tab === 'teams')}   onClick={() => setTab('teams')}>Teams</button>
        <button style={tabStyle(tab === 'advance')} onClick={() => setTab('advance')}>Advance</button>
      </div>

      {/* Tab content */}
      {tab === 'teams'   && <TeamsTab />}
      {tab === 'advance' && <AdvanceTab />}
    </div>
  );
}
