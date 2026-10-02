import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase.js';
import { apiFetch } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = loading
  const [appUser, setAppUser] = useState(null);  // { email, role, teamNumber }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          await fbUser.getIdToken(true); // force-refresh to get latest claims before /api/me
          const data = await apiFetch('/api/me');
          setAppUser(data);
        } catch (err) {
          console.warn('[Auth] /api/me failed after sign-in:', err.message);
          // Only sign out if the backend explicitly rejected the token (401/403).
          // Don't sign out for network errors so a fresh login attempt still works.
          if (err.message?.includes('not registered') || err.message?.includes('Invalid or expired')) {
            await signOut(auth);
          }
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }
    });
    return unsub;
  }, []);

  async function logout() {
    await signOut(auth);
    setAppUser(null);
  }

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, logout, loading: firebaseUser === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
