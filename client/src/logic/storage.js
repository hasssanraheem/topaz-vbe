// storage.js — localStorage persistence, wrapped in try/catch

const KEY_SESSION = 'topaz_session';
const KEY_DECISIONS = 'topaz_decisions';
const KEY_SUBMITTED = 'topaz_submitted';

// ── Session (login info) ──────────────────────────────────────────────────────

export function saveSession(session) {
  try { localStorage.setItem(KEY_SESSION, JSON.stringify(session)); } catch (_) {}
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

export function clearSession() {
  try { localStorage.removeItem(KEY_SESSION); } catch (_) {}
}

// ── Decisions (per period) ────────────────────────────────────────────────────

export function saveDecisions(period, decisions) {
  try {
    const all = loadAllDecisions();
    all[period] = decisions;
    localStorage.setItem(KEY_DECISIONS, JSON.stringify(all));
    return true;
  } catch (_) { return false; }
}

export function loadDecisions(period) {
  try {
    const all = loadAllDecisions();
    return all[period] || null;
  } catch (_) { return null; }
}

export function loadAllDecisions() {
  try {
    const raw = localStorage.getItem(KEY_DECISIONS);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

export function resetDecisions(period, defaultDecisions) {
  try {
    const all = loadAllDecisions();
    all[period] = JSON.parse(JSON.stringify(defaultDecisions));
    localStorage.setItem(KEY_DECISIONS, JSON.stringify(all));
    return true;
  } catch (_) { return false; }
}

// ── Submitted periods ─────────────────────────────────────────────────────────

export function markSubmitted(period, meta) {
  try {
    const all = loadAllSubmitted();
    all[period] = { ...meta, timestamp: new Date().toISOString() };
    localStorage.setItem(KEY_SUBMITTED, JSON.stringify(all));
    return true;
  } catch (_) { return false; }
}

export function loadAllSubmitted() {
  try {
    const raw = localStorage.getItem(KEY_SUBMITTED);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

export function isSubmitted(period) {
  try {
    const all = loadAllSubmitted();
    return !!all[period];
  } catch (_) { return false; }
}

export function getSubmitMeta(period) {
  try {
    const all = loadAllSubmitted();
    return all[period] || null;
  } catch (_) { return null; }
}

export function unmarkSubmitted(period) {
  try {
    const all = loadAllSubmitted();
    delete all[period];
    localStorage.setItem(KEY_SUBMITTED, JSON.stringify(all));
    return true;
  } catch (_) { return false; }
}

// ── Full reset ────────────────────────────────────────────────────────────────

export function resetAll() {
  try {
    localStorage.removeItem(KEY_DECISIONS);
    localStorage.removeItem(KEY_SUBMITTED);
    return true;
  } catch (_) { return false; }
}
