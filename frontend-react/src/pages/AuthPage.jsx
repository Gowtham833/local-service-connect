import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import SelfieCapture from '../components/SelfieCapture';
import AadhaarUpload from '../components/AadhaarUpload';

const ALL_SKILLS = [
  { id: 'plumbing', icon: '🔧', label: 'Plumbing' },
  { id: 'electrical', icon: '⚡', label: 'Electrical' },
  { id: 'cleaning', icon: '🧹', label: 'Cleaning' },
  { id: 'painting', icon: '🎨', label: 'Painting' },
  { id: 'medical', icon: '🩺', label: 'Medical Help' },
  { id: 'water', icon: '💧', label: 'Water Tanker' },
  { id: 'carpentry', icon: '🪟', label: 'Carpentry' },
  { id: 'ac', icon: '❄️', label: 'AC Service' }
];

const AuthPage = () => {
  const { role: urlRole } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const [tab, setTab] = useState('login');
  const [loginStep, setLoginStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login state
  const [phone, setPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState(['', '', '', '', '', '']);

  // Signup state
  const [regData, setRegData] = useState({
    firstName: '', lastName: '', email: '', phone: '', city: '', password: '',
    experience: '', aadhaarNumber: '',
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [regOtp, setRegOtp] = useState(['', '', '', '', '', '']);
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);
  const [selfie, setSelfie] = useState(null);

  const isWorker = urlRole === 'worker';

  // ── OTP input handling ──
  const handleOtpInput = (val, idx, otpArr, setOtpArr) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otpArr];
    newOtp[idx] = val;
    setOtpArr(newOtp);
    if (val && idx < 5) {
      const next = document.getElementById(`otp-${otpArr === loginOtp ? 'login' : 'reg'}-${idx+1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx, otpArr, setOtpArr) => {
    if (e.key === 'Backspace' && !otpArr[idx] && idx > 0) {
      const prev = document.getElementById(`otp-${otpArr === loginOtp ? 'login' : 'reg'}-${idx-1}`);
      prev?.focus();
    }
  };

  const toggleSkill = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  // ── Login OTP ──
  const handleSendLoginOTP = async () => {
    if (!phone) { setError('Please enter your phone number.'); return; }
    setError(''); setLoading(true);
    try {
      await AuthAPI.sendLoginOTP(phone, urlRole);
      showToast('✅ OTP sent! Check your phone.', 'success');
      setLoginStep(2);
    } catch (err) { setError(err.message || 'Failed to send OTP.'); }
    finally { setLoading(false); }
  };

  const handleLogin = async () => {
    const otp = loginOtp.join('');
    if (otp.length !== 6) { setError('Please enter all 6 digits.'); return; }
    setError(''); setLoading(true);
    try {
      const data = await (isWorker ? AuthAPI.workerLogin(phone, otp) : AuthAPI.customerLogin(phone, otp));
      login(data.user, data.token, data.role || urlRole);
      showToast('✅ Welcome back!', 'success');
      setTimeout(() => navigate(`/${urlRole}/dashboard`), 800);
    } catch (err) { setError(err.message || 'Login failed. Invalid OTP.'); }
    finally { setLoading(false); }
  };

  // ── Registration OTP ──
  const handleSendRegOTP = async () => {
    if (!regData.phone) { setError('Please enter your phone number.'); return; }
    setError(''); setLoading(true);
    try {
      await AuthAPI.sendRegistrationOTP(regData.phone, urlRole);
      showToast('✅ Verification code sent!', 'success');
    } catch (err) { setError(err.message || 'Failed to send verification code.'); }
    finally { setLoading(false); }
  };

  const handleSignup = async () => {
    const otp = regOtp.join('');
    if (!regData.firstName || !regData.phone || !regData.password) { setError('Fill all required fields.'); return; }
    if (otp.length !== 6) { setError('Enter OTP to verify your phone.'); return; }
    
    if (isWorker) {
      if (selectedSkills.length === 0) { setError('Select at least one skill.'); return; }
      if (!selfie) { setError('Live selfie is required for worker verification.'); return; }
      // Make aadhaar mandatory if testing requires it, or keep it optional initially. 
      // Based on original HTML, Aadhaar inputs exist, let's include them.
    }

    setError(''); setLoading(true);
    try {
      const payload = { 
        ...regData, 
        otp,
        ...(isWorker && {
          skills: selectedSkills,
          selfieImageBase64: selfie,
          aadhaarFrontBase64: aadhaarFront,
          aadhaarBackBase64: aadhaarBack
        })
      };
      
      const data = await (isWorker ? AuthAPI.workerRegister(payload) : AuthAPI.customerRegister(payload));
      login(data.user, data.token, data.role || urlRole);
      showToast('🎉 Registered successfully!', 'success');
      setTimeout(() => navigate(`/${urlRole}/dashboard`), 900);
    } catch (err) { setError(err.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <ToastComponent />

      {/* LEFT PANEL */}
      <div className="left-panel" style={{
        background: isWorker
          ? 'linear-gradient(160deg, #001a1a, #002d2d 40%, #0D1B2A)'
          : 'linear-gradient(160deg, #1a0800, #2d0f00 40%, #0D1B2A)',
      }}>
        <Link to="/" className="back-link">← Back to home</Link>
        <div className="panel-content">
          <div className="panel-badge" style={isWorker ? { background:'rgba(0,201,167,0.15)', borderColor:'rgba(0,201,167,0.3)', color:'var(--teal-light)' } : {}}>
            {isWorker ? '🔧 Worker Portal' : '🏠 Customer Portal'}
          </div>
          <h2 className="panel-title">
            {isWorker ? <>More Jobs.<br /><span className="accent" style={{ color: 'var(--teal)' }}>More Income.</span><br />Less Waiting.</> : <>Find Service<br />in <span className="accent">Minutes,</span><br />Not Hours.</>}
          </h2>
          <p className="panel-sub">
            {isWorker ? 'Go online, appear on the customer map, and receive job requests directly — no middleman.' : 'Post a request, watch your worker live on map, and get back to your life.'}
          </p>
          <div className="features">
            {isWorker ? (
              <>
                <div className="feature">
                  <div className="feature-icon" style={{ background:'rgba(0,201,167,0.12)' }}>📡</div>
                  <div className="feature-text">
                    <h4>Appear on the Live Map</h4>
                    <p>Toggle available and your profile shows up for nearby customers.</p>
                  </div>
                </div>
                <div className="feature">
                  <div className="feature-icon" style={{ background:'rgba(0,201,167,0.12)' }}>📲</div>
                  <div className="feature-text">
                    <h4>Instant Job Alerts</h4>
                    <p>Get notified the moment a customer posts a request.</p>
                  </div>
                </div>
                <div className="feature">
                  <div className="feature-icon" style={{ background:'rgba(0,201,167,0.12)' }}>🛡️</div>
                  <div className="feature-text">
                    <h4>Verified Badge</h4>
                    <p>Complete Aadhaar + selfie verification for customer trust.</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="feature">
                  <div className="feature-icon">📍</div>
                  <div className="feature-text">
                    <h4>Live Map Tracking</h4>
                    <p>See verified workers nearby and track them in real time.</p>
                  </div>
                </div>
                <div className="feature">
                  <div className="feature-icon">🤖</div>
                  <div className="feature-text">
                    <h4>AI Smart Matching</h4>
                    <p>Top 3 workers picked by proximity, rating, and availability.</p>
                  </div>
                </div>
                <div className="feature">
                  <div className="feature-icon">⭐</div>
                  <div className="feature-text">
                    <h4>Verified Reviews</h4>
                    <p>AI-powered fake review detection keeps ratings honest.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="panel-footer">
          <div className="logo">Servi<span style={{ color: isWorker ? 'var(--teal)' : 'var(--orange)' }}>Connect</span></div>
          <div className="tagline">Right Worker. Right Time. Right at Your Door.</div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <div className="form-box">
          <h2 className="form-heading">{isWorker ? 'Worker Portal' : 'Customer Login'}</h2>
          <p className="form-sub">
            {tab === 'login'
              ? <>Login or <a onClick={() => setTab('signup')}>register</a> to start {isWorker ? 'receiving job requests' : 'booking services'}.</>
              : <>Already have an account? <a onClick={() => setTab('login')}>Login here</a></>}
          </p>

          <div className="tabs">
            <div className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }} style={tab === 'login' && isWorker ? { background:'var(--teal)', color:'#0D1B2A' } : {}}>Login</div>
            <div className={`tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setError(''); }} style={tab === 'signup' && isWorker ? { background:'var(--teal)', color:'#0D1B2A' } : {}}>Register</div>
          </div>

          {/* ── LOGIN ── */}
          {tab === 'login' && (
            <div id="login-form">
              {error && <div className="error-msg show">{error}</div>}

              {loginStep === 1 ? (
                <div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <button className="submit-btn" onClick={handleSendLoginOTP} disabled={loading} style={isWorker ? { background:'var(--teal)', color:'#0D1B2A' } : {}}>
                    {loading ? 'Sending OTP…' : 'Send Login OTP →'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="form-group">
                    <label>Enter 6-Digit OTP</label>
                    <div className="otp-container" style={{ marginBottom: '20px' }}>
                      {loginOtp.map((d, i) => (
                        <input key={i} id={`otp-login-${i}`} type="text" className={`otp-input ${d ? 'filled' : ''}`}
                          maxLength="1" value={d}
                          onChange={e => handleOtpInput(e.target.value, i, loginOtp, setLoginOtp)}
                          onKeyDown={e => handleOtpKeyDown(e, i, loginOtp, setLoginOtp)} />
                      ))}
                    </div>
                  </div>
                  <button className="submit-btn" onClick={handleLogin} disabled={loading} style={isWorker ? { background:'var(--teal)', color:'#0D1B2A' } : {}}>
                    {loading ? 'Verifying…' : 'Verify & Login →'}
                  </button>
                  <p style={{ textAlign:'center', marginTop:'16px', fontSize:'0.85rem' }}>
                    <a onClick={() => setLoginStep(1)} style={{ color: isWorker ? 'var(--teal)' : 'var(--orange)', cursor:'pointer' }}>← Change Phone Number</a>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── SIGNUP ── */}
          {tab === 'signup' && (
            <div id="signup-form" style={{ display: 'block' }}>
              {error && <div className="error-msg show">{error}</div>}
              
              <div className="input-row">
                <div className="form-group"><label>First Name *</label><input type="text" placeholder="Ravi" value={regData.firstName} onChange={e => setRegData({...regData, firstName: e.target.value})} /></div>
                <div className="form-group"><label>Last Name</label><input type="text" placeholder="Kumar" value={regData.lastName} onChange={e => setRegData({...regData, lastName: e.target.value})} /></div>
              </div>
              
              {!isWorker && (
                <div className="form-group"><label>Email</label><input type="email" placeholder="ravi@example.com" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} /></div>
              )}

              <div className="form-group">
                <label>Phone Number *</label>
                <div style={{ display:'flex', gap:'10px' }}>
                  <input type="tel" placeholder="9876543210" style={{ flex:1 }} value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} />
                  <button type="button" className="btn btn-teal btn-sm" onClick={handleSendRegOTP} disabled={loading} style={{ borderRadius:'12px', whiteSpace:'nowrap', background: isWorker ? 'var(--orange)' : 'var(--teal)', color: isWorker ? '#fff' : 'var(--navy)' }}>Send OTP</button>
                </div>
              </div>

              <div className="form-group">
                <label>Verification Code (OTP) *</label>
                <div className="otp-container" style={{ justifyContent:'flex-start', gap:'8px', margin:'10px 0' }}>
                  {regOtp.map((d, i) => (
                    <input key={i} id={`otp-reg-${i}`} type="text" className={`otp-input ${d ? 'filled' : ''}`}
                      maxLength="1" value={d} style={{ width:'42px', height:'48px', fontSize:'1.1rem' }}
                      onChange={e => handleOtpInput(e.target.value, i, regOtp, setRegOtp)}
                      onKeyDown={e => handleOtpKeyDown(e, i, regOtp, setRegOtp)} />
                  ))}
                </div>
              </div>

              <div className="form-group"><label>City / Area</label><input type="text" placeholder="Hyderabad, Chennai…" value={regData.city} onChange={e => setRegData({...regData, city: e.target.value})} /></div>

              {/* Worker Specific Fields */}
              {isWorker && (
                <>
                  <div className="form-group">
                    <label>Your Skills *</label>
                    <div className="skill-tags">
                      {ALL_SKILLS.map(skill => (
                        <div 
                          key={skill.id} 
                          className={`skill-tag ${selectedSkills.includes(skill.id) ? 'selected' : ''}`}
                          onClick={() => toggleSkill(skill.id)}
                        >
                          {skill.icon} {skill.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Experience</label>
                    <select value={regData.experience} onChange={e => setRegData({...regData, experience: e.target.value})}>
                      <option value="">Select…</option>
                      <option value="Less than 1 year">Less than 1 year</option>
                      <option value="1-3 years">1-3 years</option>
                      <option value="3-5 years">3-5 years</option>
                      <option value="5-10 years">5-10 years</option>
                      <option value="10+ years">10+ years</option>
                    </select>
                  </div>
                </>
              )}

              <div className="form-group"><label>Password *</label><input type="password" placeholder="Create a strong password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} /></div>

              {/* Identity Verification (Worker only) */}
              {isWorker && (
                <>
                  <div className="section-divider">
                    <div className="section-divider-label">🛡️ Identity Verification</div>
                    <p style={{ fontSize:'0.8rem', color:'var(--text-dim)', marginBottom:'16px' }}>Complete verification to become a trusted worker. Upload your Aadhaar and take a live selfie.</p>
                  </div>

                  <div className="form-group">
                    <label>Aadhaar Number</label>
                    <input type="text" placeholder="1234 5678 9012" maxLength="14" value={regData.aadhaarNumber} onChange={e => setRegData({...regData, aadhaarNumber: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <label>Aadhaar Card Photos</label>
                    <div className="aadhaar-upload-grid">
                      <AadhaarUpload side="front" onUpload={setAadhaarFront} />
                      <AadhaarUpload side="back" onUpload={setAadhaarBack} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Live Selfie *</label>
                    <SelfieCapture onCapture={setSelfie} />
                  </div>
                  
                  <p style={{ fontSize:'0.75rem', color:'var(--text-dim)', textAlign:'center', marginTop:'10px', marginBottom: '20px' }}>
                    🔒 Your Aadhaar data is encrypted and only accessible by admins for verification.
                  </p>
                </>
              )}

              <button className="submit-btn" onClick={handleSignup} disabled={loading} style={isWorker ? { background:'var(--teal)', color:'#0D1B2A' } : {}}>
                {loading ? 'Registering…' : (isWorker ? 'Register & Start Earning →' : 'Create Account →')}
              </button>
            </div>
          )}

          <div className="switch-link">
            {isWorker ? 'Looking for services?' : 'Are you a worker?'} <Link to={isWorker ? '/login/customer' : '/login/worker'}>{isWorker ? 'Customer Login →' : 'Worker Login →'}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
