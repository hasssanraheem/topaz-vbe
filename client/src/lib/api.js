import { auth } from '../config/firebase.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Gets the current user's Firebase ID token and sends it with every request.
export async function apiFetch(path, options = {}) {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json();
}
