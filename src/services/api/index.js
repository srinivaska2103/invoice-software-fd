import axiosClient from './axiosClient';

export const authApi = {
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  register: (userData) => axiosClient.post('/auth/register', userData),
  verifyOtp: (data) => axiosClient.post('/auth/verify-otp', data),
  resendOtp: (data) => axiosClient.post('/auth/resend-otp', data),
  forgotPassword: (data) => axiosClient.post('/auth/forgot-password', data),
  resetPassword: (data) => axiosClient.post('/auth/reset-password', data),
  getProfile: () => axiosClient.get('/auth/me'),
  getPublicBranding: () => axiosClient.get('/auth/branding'),
  changeEmail: (data) => axiosClient.put('/auth/change-email', data),
  changePassword: (data) => axiosClient.put('/auth/change-password', data),
  deleteAccount: (data) => axiosClient.delete('/auth/delete-account', { data }),
};

export const userApi = {
  getAll: () => axiosClient.get('/users'),
  getById: (id) => axiosClient.get(`/users/${id}`),
  update: (id, data) => axiosClient.put(`/users/${id}`, data),
  delete: (id) => axiosClient.delete(`/users/${id}`),
};

export const customerApi = {
  getAll: (params) => axiosClient.get('/customers', { params }),
  getById: (id) => axiosClient.get(`/customers/${id}`),
  create: (data) => axiosClient.post('/customers', data),
  update: (id, data) => axiosClient.put(`/customers/${id}`, data),
  delete: (id) => axiosClient.delete(`/customers/${id}`),
};

export const productApi = {
  getAll: (params) => axiosClient.get('/products', { params }),
  getById: (id) => axiosClient.get(`/products/${id}`),
  create: (data) => axiosClient.post('/products', data),
  update: (id, data) => axiosClient.put(`/products/${id}`, data),
  delete: (id) => axiosClient.delete(`/products/${id}`),
};

export const productSizeApi = {
  getAll: () => axiosClient.get('/product-sizes'),
  create: (data) => axiosClient.post('/product-sizes', data),
};

export const invoiceApi = {
  getAll: (params) => axiosClient.get('/invoices', { params }),
  getById: (id) => axiosClient.get(`/invoices/${id}`),
  create: (data) => axiosClient.post('/invoices', data),
  update: (id, data) => axiosClient.put(`/invoices/${id}`, data),
  updateStatus: (id, status) => axiosClient.patch(`/invoices/${id}/status`, { status }),
  delete: (id) => axiosClient.delete(`/invoices/${id}`),
};

export const paymentApi = {
  getAll: (params) => axiosClient.get('/payments', { params }),
  create: (data) => axiosClient.post('/payments', data),
  update: (id, data) => axiosClient.put(`/payments/${id}`, data),
  delete: (id) => axiosClient.delete(`/payments/${id}`),
};

export const stockApi = {
  adjust: (data) => axiosClient.post('/stock/adjust', data),
  getLogs: (params) => axiosClient.get('/stock/logs', { params }),
  getYearlySummary: (params) => axiosClient.get('/stock/yearly-summary', { params }),
};

export const reportApi = {
  getSalesReport: (params) => axiosClient.get('/reports/sales', { params }),
  getGstReport: (params) => axiosClient.get('/reports/gst', { params }),
  getCustomerOutstanding: (params) => axiosClient.get('/reports/customers', { params }),
  getStockReport: (params) => axiosClient.get('/reports/stock', { params }),
  getAgentReport: (params) => axiosClient.get('/reports/agents', { params }),
};

export const dashboardApi = {
  getStats: () => axiosClient.get('/dashboard'),
};

export const agentApi = {
  getAll: (params) => axiosClient.get('/agents', { params }),
  getById: (id) => axiosClient.get(`/agents/${id}`),
  create: (data) => axiosClient.post('/agents', data),
  update: (id, data) => axiosClient.put(`/agents/${id}`, data),
  delete: (id) => axiosClient.delete(`/agents/${id}`),
};

export const transportApi = {
  getAll: (params) => axiosClient.get('/transports', { params }),
  getById: (id) => axiosClient.get(`/transports/${id}`),
  create: (data) => axiosClient.post('/transports', data),
  update: (id, data) => axiosClient.put(`/transports/${id}`, data),
  delete: (id) => axiosClient.delete(`/transports/${id}`),
};
