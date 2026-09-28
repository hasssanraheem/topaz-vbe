import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import TeamPage from './pages/TeamPage.jsx';

// Redirects to /login if not authenticated; checks role/team on protected routes
function ProtectedRoute({ children, requireRole, requireTeamNumber }) {
  const { appUser, loading } = useAuth();

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;
  if (!appUser) return <Navigate to="/login" replace />;

  if (requireRole && appUser.role !== requireRole) {
    // Admin can view any team page; team cannot view admin or another team
    if (requireRole === 'admin') return <Navigate to={`/team/${appUser.teamNumber}`} replace />;
    return <Navigate to="/login" replace />;
  }

  if (requireTeamNumber !== undefined) {
    const allowed = appUser.role === 'admin' || appUser.teamNumber === requireTeamNumber;
    if (!allowed) return <Navigate to={`/team/${appUser.teamNumber}`} replace />;
  }

  return children;
}

function AppRoutes() {
  const { appUser, loading } = useAuth();

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/admin" element={
        <ProtectedRoute requireRole="admin">
          <AdminPage />
        </ProtectedRoute>
      } />

      <Route path="/team/:teamNumber" element={
        <ProtectedTeamRoute />
      } />

      {/* Root redirect */}
      <Route path="/" element={
        appUser
          ? appUser.role === 'admin'
            ? <Navigate to="/admin" replace />
            : <Navigate to={`/team/${appUser.teamNumber}`} replace />
          : <Navigate to="/login" replace />
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Separate component so useParams works inside the protection check
function ProtectedTeamRoute() {
  const { appUser, loading } = useAuth();
  const teamNumber = Number(window.location.pathname.split('/team/')[1]);

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;
  if (!appUser) return <Navigate to="/login" replace />;

  const allowed = appUser.role === 'admin' || appUser.teamNumber === teamNumber;
  if (!allowed) return <Navigate to={`/team/${appUser.teamNumber}`} replace />;

  return <TeamPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
