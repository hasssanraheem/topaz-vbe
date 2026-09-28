import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../config/firebase.js';
import { apiFetch } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

// Maps dropdown labels to email addresses — single source of truth
const ACCOUNT_MAP = [
  { label: 'Admin',  email: 'admin@sim.local' },
  { label: 'Team 1', email: 'team1@sim.local' },
  { label: 'Team 2', email: 'team2@sim.local' },
  { label: 'Team 3', email: 'team3@sim.local' },
  { label: 'Team 4', email: 'team4@sim.local' },
  { label: 'Team 5', email: 'team5@sim.local' },
  { label: 'Team 6', email: 'team6@sim.local' },
  { label: 'Team 7', email: 'team7@sim.local' },
  { label: 'Team 8', email: 'team8@sim.local' },
];

export default function LoginPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('idle'); // idle | waking | ready
  const navigate = useNavigate();
  const location = useLocation();
  const { appUser, loading } = useAuth();
  // Message passed via navigate state (e.g. admin signed this session out)
  const signedOutMsg = location.state?.message;

  // Redirect already-logged-in users
  useEffect(() => {
    if (!loading && appUser) {
      if (appUser.role === 'admin') navigate('/admin', { replace: true });
      else navigate(`/team/${appUser.teamNumber}`, { replace: true });
    }
  }, [appUser, loading, navigate]);

  // Wake the Render server when the login page loads
  useEffect(() => {
    setServerStatus('waking');
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/health`)
      .then(() => setServerStatus('ready'))
      .catch(() => setServerStatus('ready')); // proceed even if health check fails
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const { email } = ACCOUNT_MAP[selectedIndex];

    try {
      // Sign in with Firebase client SDK
      await signInWithEmailAndPassword(auth, email, password);

      // Show connecting message while backend verifies
      setServerStatus('waking');

      // Verify token with our backend and get role
      const userData = await apiFetch('/api/me');
      setServerStatus('ready');

      if (userData.role === 'admin') navigate('/admin');
      else navigate(`/team/${userData.teamNumber}`);
    } catch (err) {
      setServerStatus('ready');
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a moment and try again.');
      } else if (err.message?.includes('not registered')) {
        setError('This account is not registered in the system.');
      } else {
        setError(err.message || 'Sign-in failed. Please try again.');
      }
    }
  }

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div style={{ padding: '3em 3%' }}>
      <div className="login-wrap">
        <h2>Topaz-Vbe — Sign In</h2>

        {signedOutMsg && (
          <div className="server-wake-notice" style={{ background: '#ffeeba', borderColor: '#f0ad4e' }}>
            {signedOutMsg}
          </div>
        )}

        {serverStatus === 'waking' && (
          <div className="server-wake-notice">
            Connecting to server… this may take up to 30 seconds on first load.
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <label className="field-label" htmlFor="account-select">Account</label>
            <select
              id="account-select"
              className="field-input"
              value={selectedIndex}
              onChange={e => setSelectedIndex(Number(e.target.value))}
            >
              {ACCOUNT_MAP.map((a, i) => (
                <option key={a.email} value={i}>{a.label}</option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <label className="field-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="password"
                className="field-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingRight: 40, width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 8, background: 'none',
                  border: 'none', cursor: 'pointer', color: '#555', fontSize: 13, padding: 2,
                }}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <div className="field-error" style={{ marginBottom: 8 }}>{error}</div>}

          <div style={{ marginTop: 14 }}>
            <button type="submit" className="btn" disabled={serverStatus === 'waking'}>
              {serverStatus === 'waking' ? 'Connecting…' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
