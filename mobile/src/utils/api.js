import Taro from '@tarojs/taro';

const API_BASE = 'http://localhost:3001/api';

const request = (url, options = {}) => {
  const token = Taro.getStorageSync('token');
  
  const defaultOptions = {
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };
  
  return new Promise((resolve, reject) => {
    Taro.request({
      url: API_BASE + url,
      ...defaultOptions,
      ...options,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          Taro.removeStorageSync('token');
          Taro.showToast({ title: '请先登录', icon: 'none' });
          reject(new Error('请先登录'));
        } else {
          reject(new Error(res.data?.message || '请求失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

export const get = (url, params) => {
  return request(url, { method: 'GET', data: params });
};

export const post = (url, data) => {
  return request(url, { method: 'POST', data });
};

export const put = (url, data) => {
  return request(url, { method: 'PUT', data });
};

export const del = (url) => {
  return request(url, { method: 'DELETE' });
};
