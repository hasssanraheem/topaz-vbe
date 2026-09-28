import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiFetch } from '../lib/api.js';
import Button from '../components/Button.jsx';
import Message from '../components/Message.jsx';

const TEAMS = Array.from({ length: 8 }, (_, i) => i + 1);

export default function AdminPage() {
  const { appUser, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setBusy(true);
    try {
      const res = await apiFetch(`/api/admin/teams/${selectedTeam}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      setMsg({ type: 'info', text: res.message });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div id="app-shell">
      <div id="main-content" style={{ marginLeft: 0 }}>
        <div id="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0 }}>Topaz-Vbe — Admin Dashboard</h1>
            <button
              type="button"
              onClick={handleLogout}
              style={{ background: '#c20', color: '#fff', border: 'none', padding: '4px 14px', cursor: 'pointer', fontFamily: 'Arial, sans-serif', fontSize: '0.85em', borderRadius: 2 }}
            >
              Sign Out
            </button>
          </div>
          <div className="header-meta">
            Signed in as <strong>{appUser?.email}</strong> &nbsp;|&nbsp; Role: <strong>Admin</strong>
          </div>
        </div>

        <div id="page-body">
          <h2>Reset Team Password</h2>
          <p style={{ fontSize: '0.9em', color: '#555' }}>
            Select a team, enter their new password, and confirm. The team will be signed out of all existing sessions immediately.
          </p>

          <form onSubmit={handleReset} style={{ maxWidth: 420 }}>
            <div className="field-row">
              <label className="field-label" htmlFor="team-select">Team</label>
              <select
                id="team-select"
                className="field-input"
                value={selectedTeam}
                onChange={e => setSelectedTeam(Number(e.target.value))}
              >
                {TEAMS.map(n => (
                  <option key={n} value={n}>Team {n}</option>
                ))}
              </select>
            </div>

            <div className="field-row">
              <label className="field-label" htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                className="field-input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="field-row">
              <label className="field-label" htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                className="field-input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {msg.text && (
              <div style={{ marginBottom: 10 }}>
                <Message type={msg.type}>{msg.text}</Message>
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <Button type="submit" disabled={busy}>
                {busy ? 'Resetting…' : `Reset Team ${selectedTeam} Password`}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
