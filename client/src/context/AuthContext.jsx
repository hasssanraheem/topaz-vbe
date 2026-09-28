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
          const data = await apiFetch('/api/me');
          setAppUser(data);
        } catch {
          // Token rejected by backend — sign out
          await signOut(auth);
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
