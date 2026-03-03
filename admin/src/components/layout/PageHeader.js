import React from 'react';
import { Layout, Breadcrumb, Avatar, Dropdown } from 'antd';
import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon';
import './PageHeader.css';

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
        <span
          onClick={() => navigate('/dashboard')}
          className="page-header-home-link"
        >
          <Icon type="HomeOutlined" /> 首页
        </span>
      )
    },
    ...(breadcrumbItems || [])
  ];

  return (
    <Header className="page-header">
      <Breadcrumb
        items={defaultBreadcrumbItems}
        className="page-header-breadcrumb"
      />
      
      {userMenuItems ? (
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div className="page-header-user">
            <Avatar className="page-header-avatar" icon={<Icon type="UserOutlined" />} />
            <span className="page-header-username">{username}</span>
            <Icon type="DownOutlined" className="page-header-dropdown-icon" />
          </div>
        </Dropdown>
      ) : (
        <div className="page-header-welcome">
          欢迎，{username || '用户'}
        </div>
      )}
    </Header>
  );
};

export default PageHeader;
