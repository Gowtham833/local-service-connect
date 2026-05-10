import React from 'react';

export const StatCard = ({ icon, value, label, trend, trendValue }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {trend && (
      <div className={`stat-change ${trend === 'up' ? 'stat-up' : 'stat-down'}`}>
        {trend === 'up' ? '↑' : '↓'} {trendValue}
      </div>
    )}
  </div>
);

export const Card = ({ title, children, actions }) => (
  <div className="card">
    <div className="card-title">
      {title}
      {actions && <div className="card-actions">{actions}</div>}
    </div>
    <div className="card-body">
      {children}
    </div>
  </div>
);
