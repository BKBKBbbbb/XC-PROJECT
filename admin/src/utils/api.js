import axios from 'axios';

// 开发环境使用相对路径走 proxy，生产环境需配置实际 API 地址
const API_BASE = process.env.REACT_APP_API_URL || '/api';

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
  getAllHotels: (params) => api.get('/hotels/admin/all', { params }),
  review: (id, data) => api.put(`/hotels/${id}/review`, data),
  offline: (id) => api.put(`/hotels/${id}/offline`),
  restore: (id) => api.put(`/hotels/${id}/restore`),
};

// 评论 API
export const commentApi = {
  list: (params) => api.get('/comments', { params }),
  approve: (id) => api.put(`/comments/${id}/approve`),
  reject: (id, reviewNote) => api.put(`/comments/${id}/reject`, { reviewNote }),
  delete: (id) => api.put(`/comments/${id}/delete`),
  restore: (id) => api.put(`/comments/${id}/restore`),
};

export default api;
