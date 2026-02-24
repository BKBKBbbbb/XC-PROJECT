import React from 'react';
import { Icon } from '../components';

/**
 * 获取菜单配置
 * @param {boolean} isAdmin - 是否为管理员
 * @param {function} navigate - 导航函数
 */
export const getMenuItems = (isAdmin, navigate) => {
  return [
    {
      key: '/dashboard',
      icon: React.createElement(Icon, { type: 'DashboardOutlined' }),
      label: '运营概览',
      onClick: () => navigate('/dashboard')
    },
    {
      key: '/hotel',
      icon: React.createElement(Icon, { type: 'BankOutlined' }),
      label: isAdmin ? '酒店管理' : '信息录入',
      onClick: () => navigate('/hotel')
    },
    ...(isAdmin ? [{
      key: '/review',
      icon: React.createElement(Icon, { type: 'AuditOutlined' }),
      label: '审核管理',
      onClick: () => navigate('/review')
    }] : []),
  ];
};
