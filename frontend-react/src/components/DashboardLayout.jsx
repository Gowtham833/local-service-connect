import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ children, role: userRole }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const customerNav = [
    { label: 'Overview', icon: '🏠', path: '/customer/dashboard' },
    { label: 'Book a Service', icon: '➕', path: '/customer/book' },
    { label: 'My Bookings', icon: '📋', path: '/customer/bookings' },
    { label: 'Browse Workers', icon: '👷', path: '/customer/workers' },
    { label: 'My Profile', icon: '👤', path: '/customer/profile' },
  ];

  const workerNav = [
    { label: 'Overview', icon: '🏠', path: '/worker/dashboard' },
    { label: 'Open Jobs', icon: '📋', path: '/worker/jobs' },
    { label: 'My History', icon: '📊', path: '/worker/history' },
    { label: 'My Profile', icon: '👤', path: '/worker/profile' },
  ];

  const navItems = userRole === 'worker' ? workerNav : customerNav;

  return (
    <div className="dash-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="sidebar-logo">Servi<span>Connect</span></div>
        <div className="menu-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)}>☰</div>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">Servi<span>Connect</span></div>
        <div className="sidebar-user">
          <div className="user-avatar">👤</div>
          <div className="user-name">{user?.firstName || 'User'} {user?.lastName || ''}</div>
          <div className="user-role">{userRole === 'worker' ? 'Worker Account' : 'Customer Account'}</div>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="logout-btn" onClick={logout}>🚪 Logout</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="bottom-nav">
        <div className="bottom-nav-inner">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label.split(' ')[0]}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Sidebar overlay on mobile */}
      {isSidebarOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:999 }}
          onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default DashboardLayout;
