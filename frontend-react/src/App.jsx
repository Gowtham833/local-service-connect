import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import CustomerDashboard from './pages/CustomerDashboard';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, role, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="loader"><div className="spinner"></div></div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login/:role" element={user ? <Navigate to={`/${role}/dashboard`} /> : <AuthPage />} />

      {/* Customer Routes */}
      <Route path="/customer/dashboard" element={user && role === 'customer' ? <CustomerDashboard /> : <Navigate to="/login/customer" />} />
      <Route path="/customer/book" element={user && role === 'customer' ? <CustomerDashboard /> : <Navigate to="/login/customer" />} />
      <Route path="/customer/bookings" element={user && role === 'customer' ? <CustomerDashboard /> : <Navigate to="/login/customer" />} />
      <Route path="/customer/workers" element={user && role === 'customer' ? <CustomerDashboard /> : <Navigate to="/login/customer" />} />
      <Route path="/customer/profile" element={user && role === 'customer' ? <CustomerDashboard /> : <Navigate to="/login/customer" />} />

      {/* Worker Routes (placeholder) */}
      <Route path="/worker/dashboard" element={user && role === 'worker' ? <div className="dash-layout"><main className="main-content"><h1>Worker Dashboard — Coming Soon</h1></main></div> : <Navigate to="/login/worker" />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
