import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    return Promise.reject({ ...error, message });
  }
);

export const AuthAPI = {
  sendLoginOTP:         (phone, role)      => api.post('/api/auth/login/send-otp', { phone, role }),
  sendRegistrationOTP:  (phone, role)      => api.post('/api/auth/register/send-otp', { phone, role }),
  customerLogin:        (phone, otp)       => api.post('/api/auth/customer/login', { phone, otp }),
  customerRegister:     (payload)          => api.post('/api/auth/customer/register', payload),
  workerLogin:          (phone, otp)       => api.post('/api/auth/worker/login', { phone, otp }),
  workerRegister:       (payload)          => api.post('/api/auth/worker/register', payload),
  adminLogin:           (username, password) => api.post('/api/auth/admin/login', { username, password }),
  requestOTP:           (phone, role)      => api.post('/api/auth/forgot-password', { phone, role }),
  verifyOTP:            (phone, otp, role) => api.post('/api/auth/verify-otp', { phone, otp, role }),
  resetPasswordOTP:     (phone, newPassword, resetToken, role) => api.post('/api/auth/reset-password', { phone, newPassword, resetToken, role }),
};

export const CustomerAPI = {
  getMe:          () => api.get('/api/customer/me'),
  getBookings:    () => api.get('/api/customer/bookings'),
  getWorkers:     (params) => api.get('/api/customer/workers', { params }),
  postBooking:    (payload) => api.post('/api/customer/bookings', payload),
  rateBooking:    (id, rating, comment) => api.patch(`/api/customer/bookings/${id}/rate`, { rating, comment }),
};

export const WorkerAPI = {
  getMe:              () => api.get('/api/worker/me'),
  toggleAvailability: (isAvailable) => api.patch('/api/worker/availability', { isAvailable }),
  updateLocation:     (lat, lng) => api.patch('/api/worker/location', { lat, lng }),
  getOpenJobs:        () => api.get('/api/worker/open-jobs'),
  acceptJob:          (id) => api.patch(`/api/worker/jobs/${id}/accept`),
  startJob:           (id) => api.patch(`/api/worker/jobs/${id}/start`),
  completeJob:        (id, payload) => api.patch(`/api/worker/jobs/${id}/complete`, payload),
};

export default api;
