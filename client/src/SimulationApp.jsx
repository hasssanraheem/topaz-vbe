import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import SideNav from './components/SideNav.jsx';
import Footer from './components/Footer.jsx';
import DecisionFormPage from './pages/DecisionFormPage.jsx';
import MainMenuPage from './pages/MainMenuPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import SubmitPage from './pages/SubmitPage.jsx';
import CompanyInfoPage from './pages/CompanyInfoPage.jsx';
import HelpPage from './pages/HelpPage.jsx';
import { DEFAULT_DECISIONS, PERIODS } from './data/mockData.js';
import { loadDecisions, saveDecisions, isSubmitted } from './logic/storage.js';
import { apiFetch } from './lib/api.js';
import { useAuth } from './context/AuthContext.jsx';

const DEFAULT_PERIOD = 1;

function getPeriodData(period) { return PERIODS[period] || PERIODS[1]; }
function getQuarter(period) { return ((period - 1) % 4) + 1; }

// Simulation UI — rendered inside TeamPage.
// teamNumber is passed so localStorage keys are namespaced per team.
export default function SimulationApp({ teamNumber, appUser, onLogout }) {
  const [currentPage, setCurrentPage] = useState({ page: 'decisions', sub: null });
  const [currentPeriod] = useState(DEFAULT_PERIOD);
  const [dec, setDec] = useState(() =>
    loadDecisions(teamNumber, DEFAULT_PERIOD) || { ...DEFAULT_DECISIONS }
  );
  const [submitted, setSubmitted] = useState(() => isSubmitted(teamNumber, DEFAULT_PERIOD));
  const [quarterStatus, setQuarterStatus] = useState(null); // 'open' | 'locked' | 'processing' | 'published' | null
  const navigate = useNavigate();
  const { logout } = useAuth();

  const periodData = getPeriodData(currentPeriod);
  const quarter    = getQuarter(currentPeriod);
  // Session header data — will come from API once session management is wired up
  const session = {
    simulationCode: '—',
    groupNumber:    '—',
    startYear:      2024,
    startQuarter:   1,
  };

  // ── Load decisions from server on mount ───────────────────────────────────
  useEffect(() => {
    apiFetch('/api/decisions')
      .then(data => {
        if (data?.data) {
          setDec(data.data);
          saveDecisions(teamNumber, DEFAULT_PERIOD, data.data); // keep localStorage in sync
        }
        if (data?.submitted) setSubmitted(true);
        if (data?.quarterStatus) setQuarterStatus(data.quarterStatus);
      })
      .catch(() => {}); // fall back to localStorage value already in state
  }, [teamNumber]);

  // ── Heartbeat: detect if admin revoked this session ───────────────────────
  // Polls /api/me every 60 s and on tab focus.
  // If the server returns 401 (token revoked), sign out immediately.
  const checkSession = useCallback(async () => {
    try {
      await apiFetch('/api/me');
    } catch (err) {
      if (err.message?.includes('Invalid') || err.message?.includes('revoked') || err.message?.includes('401')) {
        await logout();
        navigate('/login', { state: { message: 'You have been signed out by the administrator.' }, replace: true });
      }
    }
  }, [logout, navigate]);

  useEffect(() => {
    const interval = setInterval(checkSession, 60_000);

    function onVisible() {
      if (document.visibilityState === 'visible') checkSession();
    }
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [checkSession]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleNavigate(page, sub) { setCurrentPage({ page, sub: sub || null }); }

  function handleDecChange(newDec) {
    setDec(newDec);
    saveDecisions(teamNumber, currentPeriod, newDec); // localStorage fallback
    // Sync to server in background (fire-and-forget; errors are non-fatal)
    apiFetch('/api/decisions', { method: 'PUT', body: JSON.stringify({ data: newDec }) })
      .catch(() => {}); // silently ignore if no open quarter or offline
  }

  function handleSubmitted() { setSubmitted(true); }

  // ── Page renderer ──────────────────────────────────────────────────────────
  const commonProps = {
    dec,
    onChange: handleDecChange,
    teamNumber,
    period: currentPeriod,
    disabled: submitted,
    periodData,
    quarter,
    session,
    onNavigate: handleNavigate,
    submitted,
  };

  function renderPage() {
    switch (currentPage.page) {
      case 'decisions':
        return <DecisionFormPage {...commonProps} />;
      case 'menu':
        return <MainMenuPage {...commonProps} currentPeriod={currentPeriod} />;
      case 'reports':
        return <ReportsPage sub={currentPage.sub} onNavigate={handleNavigate} teamNumber={teamNumber} />;
      case 'review':
        return <ReviewPage {...commonProps} />;
      case 'submit':
        return <SubmitPage {...commonProps} onSubmitted={handleSubmitted} />;
      case 'company-info':
        return <CompanyInfoPage session={session} currentPeriod={currentPeriod} periodData={periodData} />;
      case 'help':
        return <HelpPage />;
      default:
        return <DecisionFormPage {...commonProps} />;
    }
  }

  return (
    <div id="app-shell">
      <SideNav
        currentPage={currentPage.page}
        currentSub={currentPage.sub}
        onNavigate={handleNavigate}
        submitted={submitted}
      />
      <div id="main-content">
        <Header teamName={appUser?.email} period={currentPeriod} onLogout={onLogout} />
        <div id="page-body">{renderPage()}</div>
        <Footer />
      </div>
    </div>
  );
}
