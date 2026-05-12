/**
 * ServiConnect API Client
 * API_BASE_URL loaded from runtime config (config.js) — never hardcoded.
 */
const getApiBase = () => (window.__SERVICONNECT_CONFIG__?.API_BASE_URL || 'http://localhost:5000');

const TOKEN_KEY = 'sc_token';
const ROLE_KEY  = 'sc_role';
const USER_KEY  = 'sc_user';

// ── Auth Helpers ──────────────────────────────────────────────
const Auth = {
  save(token, role, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLE_KEY, role);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getToken()  { return localStorage.getItem(TOKEN_KEY); },
  getRole()   { return localStorage.getItem(ROLE_KEY); },
  getUser()   { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); },
  isLoggedIn(){ return !!localStorage.getItem(TOKEN_KEY); },
  logout() {
    [TOKEN_KEY, ROLE_KEY, USER_KEY].forEach(k => localStorage.removeItem(k));
    window.location.href = '/';
  },
  redirectToDashboard() {
    const role = this.getRole();
    if (role === 'customer') window.location.href = '/pages/customer-dashboard.html';
    else if (role === 'worker') window.location.href = '/pages/worker-dashboard.html';
    else if (role === 'admin') window.location.href = '/pages/admin-dashboard.html';
  },
  requireAuth(role) {
    if (!this.isLoggedIn() || (role && this.getRole() !== role)) {
      this.logout();
      return false;
    }
    return true;
  }
};

// ── API Request Helper ────────────────────────────────────────
async function apiRequest(path, options = {}) {
  const url     = `${getApiBase()}${path}`;
  const token   = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('API Error:', err);
    return { ok: false, data: { message: 'Network error or server unreachable' } };
  }
}

// ── Shorthand API Methods ─────────────────────────────────────
const API = {
  get:   (path)         => apiRequest(path, { method: 'GET' }),
  post:  (path, body)   => apiRequest(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch: (path, body)   => apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ── Auth API ──────────────────────────────────────────────────
const AuthAPI = {
  sendLoginOTP:         (phone, role)      => API.post('/api/auth/login/send-otp', { phone, role }),
  sendRegistrationOTP:  (phone, role)      => API.post('/api/auth/register/send-otp', { phone, role }),
  customerLogin:        (phone, password)  => API.post('/api/auth/customer/login', { phone, password }),
  customerRegister: (payload)         => API.post('/api/auth/customer/register', payload),
  customerResetPassword: (phone, newPassword) => API.post('/api/auth/customer/reset-password', { phone, newPassword }),
  workerLogin:      (phone, password) => API.post('/api/auth/worker/login', { phone, password }),
  workerRegister:   (payload)         => API.post('/api/auth/worker/register', payload),
  workerResetPassword: (phone, newPassword) => API.post('/api/auth/worker/reset-password', { phone, newPassword }),
  adminLogin:       (username, password) => API.post('/api/auth/admin/login', { username, password }),
  // OTP-based password reset
  requestOTP:       (phone, role)     => API.post('/api/auth/forgot-password', { phone, role }),
  verifyOTP:        (phone, otp, role) => API.post('/api/auth/verify-otp', { phone, otp, role }),
  resetPasswordOTP: (phone, newPassword, resetToken, role) => API.post('/api/auth/reset-password', { phone, newPassword, resetToken, role }),
};

// ── Customer API ──────────────────────────────────────────────
const CustomerAPI = {
  getMe:         () => API.get('/api/customer/me'),
  getBookings:   () => API.get('/api/customer/bookings'),
  getWorkers:    (params) => API.get(`/api/customer/workers?${new URLSearchParams(params)}`),
  postBooking:   (payload) => API.post('/api/customer/bookings', payload),
  rateBooking:   (id, rating, comment) => API.patch(`/api/customer/bookings/${id}/rate`, { rating, comment }),
  getTracking:   (id) => API.get(`/api/customer/bookings/${id}/tracking`),
  updateLocation: (lat, lng) => API.patch('/api/customer/location', { lat, lng }),
  updateProfile:  (payload) => API.patch('/api/customer/profile', payload),
};

// ── Worker API ────────────────────────────────────────────────
const WorkerAPI = {
  getMe:              () => API.get('/api/worker/me'),
  toggleAvailability: (isAvailable) => API.patch('/api/worker/availability', { isAvailable }),
  updateLocation:     (lat, lng) => API.patch('/api/worker/location', { lat, lng }),
  getOpenJobs:        () => API.get('/api/worker/open-jobs'),
  acceptJob:          (id) => API.patch(`/api/worker/jobs/${id}/accept`),
  startJob:           (id) => API.patch(`/api/worker/jobs/${id}/start`),
  completeJob:        (id, payload) => API.patch(`/api/worker/jobs/${id}/complete`, payload),
  getVerificationStatus: () => API.get('/api/worker/verification-status'),
  updateProfile:      (payload) => API.patch('/api/worker/profile', payload),
};

// ── Location API ──────────────────────────────────────────────
const LocationAPI = {
  updateLiveLocation: (payload) => API.post('/api/location/update', payload),
  getLiveLocations:   (bookingId) => API.get(`/api/location/booking/${bookingId}`),
};

// ── Admin API ─────────────────────────────────────────────────
const AdminAPI = {
  getStats:      () => API.get('/api/admin/stats'),
  getWorkers:    (params) => API.get(`/api/admin/workers?${new URLSearchParams(params || {})}`),
  getWorker:     (id) => API.get(`/api/admin/workers/${id}`),
  verifyWorker:  (id, action, notes) => API.patch(`/api/admin/workers/${id}/verify`, { action, notes }),
  getBookings:   (params) => API.get(`/api/admin/bookings?${new URLSearchParams(params || {})}`),
  getBooking:    (id) => API.get(`/api/admin/bookings/${id}`),
};

// ── Toast Notifications ───────────────────────────────────────
function showToast(message, type = 'info') {
  const existing = document.querySelector('.sc-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `sc-toast sc-toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    padding:12px 20px; border-radius:8px; color:#fff; font-weight:600;
    background:${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
    box-shadow:0 4px 12px rgba(0,0,0,0.3); animation:slideIn 0.3s ease;
    max-width:400px; font-size:0.9rem;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── Common Utilities ──────────────────────────────────────────
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const statusBadge = (status) => {
  const s = status ? status.toLowerCase() : 'open';
  const cls = `status-badge status-${s}`;
  const label = s.replace('_', ' ').toUpperCase();
  return `<span class="${cls}">${label}</span>`;
};

// ── File to Base64 converter ──────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Camera capture helper ─────────────────────────────────────
async function openCamera(videoEl, canvasEl) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
    videoEl.srcObject = stream;
    videoEl.play();
    return stream;
  } catch (err) {
    console.error('Camera access denied:', err);
    showToast('Camera access denied. Please allow camera permission.', 'error');
    return null;
  }
}

function captureFromCamera(videoEl, canvasEl) {
  canvasEl.width = videoEl.videoWidth;
  canvasEl.height = videoEl.videoHeight;
  canvasEl.getContext('2d').drawImage(videoEl, 0, 0);
  return canvasEl.toDataURL('image/jpeg', 0.85);
}

function stopCamera(stream) {
  if (stream) stream.getTracks().forEach(t => t.stop());
}

// Expose globally
window.Auth = Auth;
window.API  = API;
window.AuthAPI = AuthAPI;
window.CustomerAPI = CustomerAPI;
window.WorkerAPI = WorkerAPI;
window.AdminAPI = AdminAPI;
window.LocationAPI = LocationAPI;
window.showToast = showToast;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.statusBadge = statusBadge;
window.fileToBase64 = fileToBase64;
window.openCamera = openCamera;
window.captureFromCamera = captureFromCamera;
window.stopCamera = stopCamera;

// ── Socket.io Setup ───────────────────────────────────────────
let socket;
function initSocket() {
  if (typeof io === 'undefined') return console.warn('Socket.io client not loaded');
  socket = io(getApiBase());
  
  socket.on('connect', () => console.log('[Socket] Connected:', socket.id));
  socket.on('disconnect', () => console.log('[Socket] Disconnected'));
  
  return socket;
}

window.initSocket = initSocket;
window.getSocket  = () => socket;
