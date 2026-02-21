import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// 请求拦截器 - 添加 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 统一处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 用户 API
export const userApi = {
  login: (data) => api.post('/users/login', data),
  register: (data) => api.post('/users/register', data),
  getMe: () => api.get('/users/me'),
};

// 酒店 API
export const hotelApi = {
  list: (params) => api.get('/hotels', { params }),
  get: (id) => api.get(`/hotels/${id}`),
  create: (data) => api.post('/hotels', data),
  update: (id, data) => api.put(`/hotels/${id}`, data),
  delete: (id) => api.delete(`/hotels/${id}`),
  getMyHotels: () => api.get('/hotels/merchant/my'),
  review: (id, data) => api.put(`/hotels/${id}/review`, data),
};

export default api;
