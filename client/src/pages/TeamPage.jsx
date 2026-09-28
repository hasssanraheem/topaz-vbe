import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import SimulationApp from '../SimulationApp.jsx';

// Wrapper that enforces team access then renders the simulation
export default function TeamPage() {
  const { teamNumber } = useParams();
  const { appUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <SimulationApp
      teamNumber={Number(teamNumber)}
      appUser={appUser}
      onLogout={handleLogout}
    />
  );
}
