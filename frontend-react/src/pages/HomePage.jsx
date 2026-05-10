import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const revealRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    revealRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addRevealRef = (el) => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el); };

  return (
    <>
      {/* NAV */}
      <nav className="home-nav">
        <div className="logo">Servi<span>Connect</span></div>
        <div className="nav-links">
          <Link to="/login/customer" className="nav-btn nav-btn-outline">Customer Login</Link>
          <Link to="/login/worker" className="nav-btn nav-btn-filled">Worker Login</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="badge"><div className="badge-dot"></div> 2,400+ Verified Workers Online</div>
        <h1>Right Worker.<br /><span className="highlight">Right Time.</span><br />Right at Your Door.</h1>
        <p className="hero-sub">On-demand local services — plumbers, electricians, cleaners &amp; more. Find verified workers on the map and get help in minutes.</p>

        <div className="portals">
          <Link to="/login/customer" className="portal-card portal-customer">
            <div className="portal-icon">🏠</div>
            <div className="portal-label">I need help</div>
            <div className="portal-title">Customer Portal</div>
            <div className="portal-desc">Post a request, track your worker live on map, and get help in 2–5 minutes.</div>
            <div className="portal-cta">Book a Service →</div>
          </Link>
          <Link to="/login/worker" className="portal-card portal-worker">
            <div className="portal-icon">🔧</div>
            <div className="portal-label">I offer services</div>
            <div className="portal-title">Worker Portal</div>
            <div className="portal-desc">Go online, get job requests from nearby customers, and grow your income digitally.</div>
            <div className="portal-cta">Start Earning →</div>
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section reveal" ref={addRevealRef}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="section-label">Process</div>
          <div className="section-title">How ServiConnect Works</div>
          <div className="steps">
            <div className="step"><div className="step-num">01</div><div className="step-title">Post a Request</div><div className="step-desc">Select your service and post a request. AI auto-detects the category from your description.</div></div>
            <div className="step"><div className="step-num">02</div><div className="step-title">Worker Notified</div><div className="step-desc">Nearby available workers receive instant notifications on their phone.</div></div>
            <div className="step"><div className="step-num">03</div><div className="step-title">Worker Accepts</div><div className="step-desc">A worker accepts the job and starts navigating to your location.</div></div>
            <div className="step"><div className="step-num">04</div><div className="step-title">Track Live</div><div className="step-desc">Watch your worker move on the map in real time. Know exactly when they'll arrive.</div></div>
            <div className="step"><div className="step-num">05</div><div className="step-title">Job Done</div><div className="step-desc">Worker marks the job complete. You rate the service. Worker is available again for others.</div></div>
            <div className="step"><div className="step-num">06</div><div className="step-title">Pay &amp; Review</div><div className="step-desc">Secure in-app payment. Honest reviews powered by AI fake-review detection.</div></div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section reveal" ref={addRevealRef} style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="section-label">Services</div>
          <div className="section-title">Everything You Need, On Demand</div>
          <div className="services">
            <div className="service-pill"><div className="service-emoji">🔧</div><div className="service-name">Plumbing</div><div className="service-tag">Pipes · Leaks · Fixtures</div></div>
            <div className="service-pill"><div className="service-emoji">⚡</div><div className="service-name">Electrical</div><div className="service-tag">Wiring · Switches · Boards</div></div>
            <div className="service-pill"><div className="service-emoji">🧹</div><div className="service-name">Cleaning</div><div className="service-tag">Home · Office · Deep Clean</div></div>
            <div className="service-pill"><div className="service-emoji">🎨</div><div className="service-name">Painting</div><div className="service-tag">Interior · Exterior · Touch-ups</div></div>
            <div className="service-pill"><div className="service-emoji">🩺</div><div className="service-name">Medical Help</div><div className="service-tag">Nurse · First Aid · Elderly Care</div></div>
            <div className="service-pill"><div className="service-emoji">💧</div><div className="service-name">Water Tanker</div><div className="service-tag">Emergency · Bulk · Events</div></div>
            <div className="service-pill"><div className="service-emoji">🪟</div><div className="service-name">Carpentry</div><div className="service-tag">Doors · Furniture · Repairs</div></div>
            <div className="service-pill"><div className="service-emoji">❄️</div><div className="service-name">AC Service</div><div className="service-tag">Install · Repair · Clean</div></div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="section reveal" ref={addRevealRef}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="stats-row">
            <div className="stat-home"><div className="stat-num">2–5 min</div><div className="stat-label-home">Average match time</div></div>
            <div className="stat-home"><div className="stat-num">8+</div><div className="stat-label-home">Service categories</div></div>
            <div className="stat-home"><div className="stat-num">10+</div><div className="stat-label-home">Cities covered</div></div>
            <div className="stat-home"><div className="stat-num">Telugu</div><div className="stat-label-home">AI language support</div></div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginBottom: '28px' }}>Ready to get started? Choose your portal below.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link to="/login/customer" className="nav-btn nav-btn-filled" style={{ fontSize: '1rem', padding: '14px 36px' }}>I Need a Service</Link>
              <Link to="/login/worker" className="nav-btn nav-btn-outline" style={{ fontSize: '1rem', padding: '14px 36px', color: 'var(--teal)', borderColor: 'var(--teal)' }}>I'm a Worker</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <span className="logo">Servi<span style={{ color: 'var(--orange)' }}>Connect</span></span>
        {' '}Smart Local On-Demand Services Platform &nbsp;·&nbsp; © 2025 ServiConnect &nbsp;·&nbsp; All rights reserved
      </footer>
    </>
  );
};

export default HomePage;
