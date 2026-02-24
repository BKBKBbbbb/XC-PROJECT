import React from 'react';
import { Layout, Breadcrumb, Avatar, Dropdown } from 'antd';
import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon';
import { theme } from '../common/theme';

const { Header } = Layout;

/**
 * 页面头部组件
 * @param {Array} breadcrumbItems - 面包屑配置
 * @param {Array} userMenuItems - 用户菜单项
 * @param {string} username - 用户名
 */
const PageHeader = ({ breadcrumbItems, userMenuItems, username }) => {
  const navigate = useNavigate();

  const defaultBreadcrumbItems = [
    { 
      title: (
        <>
          <Icon type="HomeOutlined" /> 首页
        </>
      ), 
      onClick: () => navigate('/dashboard') 
    },
    ...(breadcrumbItems || [])
  ];

  return (
    <Header style={{ 
      background: '#fff', 
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #E5E6EB',
      position: 'sticky',
      top: 0,
      zIndex: 99
    }}>
      <Breadcrumb
        items={defaultBreadcrumbItems}
        style={{ display: 'flex', alignItems: 'center' }}
      />
      
      {userMenuItems ? (
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            padding: '4px 12px', 
            borderRadius: 20, 
            transition: 'background 0.3s' 
          }}>
            <Avatar style={{ backgroundColor: theme.primary }} icon={<Icon type="UserOutlined" />} />
            <span style={{ color: theme.textPrimary, fontWeight: 500 }}>{username}</span>
            <Icon type="DownOutlined" style={{ color: theme.textTertiary, fontSize: 12 }} />
          </div>
        </Dropdown>
      ) : (
        <div style={{ color: '#666' }}>
          欢迎，{username || '用户'}
        </div>
      )}
    </Header>
  );
};

export default PageHeader;
