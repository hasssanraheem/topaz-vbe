import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../config/firebase.js';
import { apiFetch } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { appUser, loading: authLoading } = useAuth();
  const signedOutMsg = location.state?.message;

  useEffect(() => {
    if (!authLoading && appUser) navigate('/dashboard', { replace: true });
  }, [appUser, authLoading, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await apiFetch('/api/me');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Incorrect email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait and try again.');
      } else if (err.message?.includes('not registered')) {
        setError('This account is not registered in the system.');
      } else {
        setError(err.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) return <div style={{ padding: 32 }}>Loading…</div>;

  return (
    <div style={{ padding: '3em 3%' }}>
      <div className="login-wrap">
        <h2>Topaz-VBE — Sign In</h2>

        {signedOutMsg && (
          <div className="server-wake-notice" style={{ background: '#ffeeba', borderColor: '#f0ad4e' }}>
            {signedOutMsg}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <label className="field-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="field-input wide text-left"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="field-row">
            <label className="field-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              className="field-input wide"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="btn"
              onClick={() => setShowPw(v => !v)}
              tabIndex={-1}
              style={{ marginLeft: 6, fontSize: '0.8em', padding: '2px 8px' }}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>

          {error && (
            <div className="msg-box msg-error" style={{ marginBottom: 8 }}>{error}</div>
          )}

          <div style={{ marginTop: 14 }}>
            <button type="submit" className="btn btn-submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
