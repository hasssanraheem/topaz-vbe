import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../config/firebase.js';
import { apiFetch } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { appUser, loading: authLoading } = useAuth();
  const signedOutMsg = location.state?.message;

  // Redirect already-logged-in users
  useEffect(() => {
    if (!authLoading && appUser) navigate('/dashboard', { replace: true });
  }, [appUser, authLoading, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await apiFetch('/api/me'); // confirm token accepted by backend
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
      setLoading(false);
    }
  }

  if (authLoading) return <div style={{ padding: 32 }}>Loading…</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f4' }}>
      <div style={{ background: '#fff', border: '1px solid #ccc', padding: '2.5em 2em', width: 340, borderRadius: 4 }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.2em', fontSize: '1.25em' }}>Topaz-VBE — Sign In</h2>

        {signedOutMsg && (
          <div style={{ background: '#fff3cd', border: '1px solid #f0ad4e', padding: '8px 12px', marginBottom: 14, fontSize: '0.87em' }}>
            {signedOutMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.87em', fontWeight: 600, marginBottom: 4 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box', fontSize: '0.95em' }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: '0.87em', fontWeight: 600, marginBottom: 4 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ width: '100%', padding: '6px 36px 6px 8px', boxSizing: 'border-box', fontSize: '0.95em' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8em', color: '#555' }}
                tabIndex={-1}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ color: '#c00', fontSize: '0.85em', marginBottom: 12 }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '8px 0', background: '#1a3a6b', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.95em', borderRadius: 2 }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
