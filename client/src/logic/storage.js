// storage.js — localStorage persistence, namespaced per team and period
// Key format: "topaz:team{n}:period{p}:decisions" / "topaz:team{n}:period{p}:submitted"
// This ensures teams using the same browser never overwrite each other's data.

function decKey(teamNumber, period) {
  return `topaz:team${teamNumber}:period${period}:decisions`;
}
function subKey(teamNumber, period) {
  return `topaz:team${teamNumber}:period${period}:submitted`;
}

// ── Decisions ─────────────────────────────────────────────────────────────────

export function saveDecisions(teamNumber, period, decisions) {
  try {
    localStorage.setItem(decKey(teamNumber, period), JSON.stringify(decisions));
    return true;
  } catch (_) { return false; }
}

export function loadDecisions(teamNumber, period) {
  try {
    const raw = localStorage.getItem(decKey(teamNumber, period));
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

export function resetDecisions(teamNumber, period, defaultDecisions) {
  return saveDecisions(teamNumber, period, JSON.parse(JSON.stringify(defaultDecisions)));
}

// ── Submitted state ───────────────────────────────────────────────────────────

export function markSubmitted(teamNumber, period, meta) {
  try {
    localStorage.setItem(subKey(teamNumber, period), JSON.stringify({
      ...meta,
      timestamp: new Date().toISOString(),
    }));
    return true;
  } catch (_) { return false; }
}

export function isSubmitted(teamNumber, period) {
  try {
    return !!localStorage.getItem(subKey(teamNumber, period));
  } catch (_) { return false; }
}

export function getSubmitMeta(teamNumber, period) {
  try {
    const raw = localStorage.getItem(subKey(teamNumber, period));
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

export function unmarkSubmitted(teamNumber, period) {
  try {
    localStorage.removeItem(subKey(teamNumber, period));
    return true;
  } catch (_) { return false; }
}

// ── Load all decisions for a team (all periods) ───────────────────────────────
// Returns { [period]: decisions } for use in ReportsPage.
export function loadAllDecisions(teamNumber) {
  try {
    const prefix = `topaz:team${teamNumber}:`;
    const result = {};
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(prefix) && key.endsWith(':decisions')) {
        const parts = key.split(':'); // ['topaz','teamN','periodP','decisions']
        const pStr = parts[2]?.replace('period', '');
        const p = parseInt(pStr, 10);
        if (!Number.isNaN(p)) {
          const raw = localStorage.getItem(key);
          if (raw) result[p] = JSON.parse(raw);
        }
      }
    }
    return result;
  } catch (_) { return {}; }
}

// ── Full reset for one team ───────────────────────────────────────────────────

export function resetAll(teamNumber) {
  try {
    // Remove all keys for this team across all periods
    const prefix = `topaz:team${teamNumber}:`;
    Object.keys(localStorage)
      .filter(k => k.startsWith(prefix))
      .forEach(k => localStorage.removeItem(k));
    return true;
  } catch (_) { return false; }
}
