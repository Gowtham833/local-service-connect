import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import api from '../services/api';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const res = await api.get('/customer/bookings');
      setBookings(res.data?.bookings || []);
    } catch (err) {
      // Silently fail on first load
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: bookings.length,
    completed: bookings.filter(b => b.status === 'completed').length,
    active: bookings.filter(b => ['pending','accepted','in_progress'].includes(b.status)).length,
    spent: bookings.reduce((s, b) => s + (b.price || 0), 0),
  };

  return (
    <DashboardLayout role="customer">
      <ToastComponent />

      {/* OVERVIEW */}
      <div className="page-header">
        <div>
          <div className="page-title">Welcome back, {user?.firstName || 'there'} 👋</div>
          <div className="page-subtitle">Here's your service summary</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/customer/book')}>+ Book Service</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-value">{stats.total}</div><div className="stat-label">Total Bookings</div></div>
        <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-value">{stats.completed}</div><div className="stat-label">Completed</div></div>
        <div className="stat-card"><div className="stat-icon">⏳</div><div className="stat-value">{stats.active}</div><div className="stat-label">Active / Pending</div></div>
        <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-value">₹{stats.spent}</div><div className="stat-label">Total Spent</div></div>
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="card-title">
          Recent Bookings
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/customer/bookings')}>View All</button>
        </div>
        {loading ? (
          <div className="loader"><div className="spinner"></div></div>
        ) : bookings.length > 0 ? (
          <table>
            <thead><tr><th>Service</th><th>Worker</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {bookings.slice(0, 5).map((b) => (
                <tr key={b._id || b.id}>
                  <td style={{ fontWeight: 600 }}>{b.service}</td>
                  <td>{b.workerName || '—'}</td>
                  <td>
                    <span className={`status-badge status-${b.status}`}>
                      {b.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">
            <div className="empty-icon">📅</div>
            <div className="empty-text">No bookings yet. Need something fixed?</div>
            <button className="btn btn-primary" style={{ marginTop:'16px' }} onClick={() => navigate('/customer/book')}>Book Your First Service</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
