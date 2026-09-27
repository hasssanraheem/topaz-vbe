import { useState } from 'react';
import Header from './components/Header.jsx';
import SideNav from './components/SideNav.jsx';
import Footer from './components/Footer.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MainMenuPage from './pages/MainMenuPage.jsx';
import MarketingPage from './pages/MarketingPage.jsx';
import ProductionPage from './pages/ProductionPage.jsx';
import PersonnelPage from './pages/PersonnelPage.jsx';
import FinancePage from './pages/FinancePage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import SubmitPage from './pages/SubmitPage.jsx';
import CompanyInfoPage from './pages/CompanyInfoPage.jsx';
import HelpPage from './pages/HelpPage.jsx';
import { DEFAULT_DECISIONS, PERIODS } from './data/mockData.js';
import {
  saveSession, loadSession, clearSession,
  loadDecisions, saveDecisions,
  isSubmitted
} from './logic/storage.js';

const DEFAULT_PERIOD = 1;

function getPeriodData(period) {
  return PERIODS[period] || PERIODS[1];
}

function getQuarter(period) {
  return ((period - 1) % 4) + 1;
}

export default function App() {
  const [session, setSession] = useState(() => loadSession());
  const [currentPage, setCurrentPage] = useState({ page: session ? 'menu' : 'login', sub: null });
  const [currentPeriod] = useState(DEFAULT_PERIOD);
  const [dec, setDec] = useState(() => loadDecisions(DEFAULT_PERIOD) || { ...DEFAULT_DECISIONS });
  const [submitted, setSubmitted] = useState(() => isSubmitted(DEFAULT_PERIOD));

  const periodData = getPeriodData(currentPeriod);
  const quarter = getQuarter(currentPeriod);
  const locked = submitted;

  function handleLogin(sessionData) {
    setSession(sessionData);
    saveSession(sessionData);
    setCurrentPage({ page: 'menu', sub: null });
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    setCurrentPage({ page: 'login', sub: null });
  }

  function handleNavigate(page, sub) {
    setCurrentPage({ page, sub: sub || null });
  }

  function handleDecChange(newDec) {
    setDec(newDec);
    saveDecisions(currentPeriod, newDec);
  }

  function handleSubmitted() {
    setSubmitted(true);
  }

  if (!session) {
    return (
      <div id="app-shell">
        <div id="main-content" style={{ marginLeft: 0 }}>
          <Header teamName={null} period={null} onLogout={null} />
          <div id="page-body">
            <LoginPage onLogin={handleLogin} />
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  function renderPage() {
    const props = {
      dec,
      onChange: handleDecChange,
      period: currentPeriod,
      disabled: locked,
      periodData,
      quarter,
      onNavigate: handleNavigate,
      session,
      submitted,
    };

    switch (currentPage.page) {
      case 'menu':
        return <MainMenuPage {...props} currentPeriod={currentPeriod} />;
      case 'marketing':
        return <MarketingPage {...props} />;
      case 'production':
        return <ProductionPage {...props} />;
      case 'personnel':
        return <PersonnelPage {...props} />;
      case 'finance':
        return <FinancePage {...props} />;
      case 'reports':
        return <ReportsPage sub={currentPage.sub} onNavigate={handleNavigate} />;
      case 'review':
        return <ReviewPage {...props} />;
      case 'submit':
        return <SubmitPage {...props} onSubmitted={handleSubmitted} />;
      case 'company-info':
        return <CompanyInfoPage session={session} currentPeriod={currentPeriod} periodData={periodData} />;
      case 'help':
        return <HelpPage />;
      default:
        return <MainMenuPage {...props} currentPeriod={currentPeriod} />;
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
        <Header teamName={session.teamName} period={currentPeriod} onLogout={handleLogout} />
        <div id="page-body">
          {renderPage()}
        </div>
        <Footer />
      </div>
    </div>
  );
}
