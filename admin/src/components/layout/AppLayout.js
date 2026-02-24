import React from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import PageHeader from './PageHeader';
import { theme } from '../common/theme';

const { Content } = Layout;

/**
 * 应用主布局组件
 * @param {ReactNode} children - 子组件
 * @param {Array} menuItems - 侧边栏菜单项
 * @param {Array} bottomMenuItems - 底部菜单项
 * @param {Array} breadcrumbItems - 面包屑配置
 * @param {Array} userMenuItems - 用户菜单项
 * @param {string} username - 用户名
 * @param {string} sidebarTheme - 侧边栏主题 'light' | 'dark'
 * @param {object} contentStyle - 内容区域样式
 */
const AppLayout = ({ 
  children, 
  menuItems, 
  bottomMenuItems,
  breadcrumbItems, 
  userMenuItems,
  username,
  sidebarTheme = 'light',
  contentStyle = {}
}) => {
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const displayUsername = username || userInfo.username || '用户';

  const layoutStyle = sidebarTheme === 'dark' 
    ? { marginLeft: 220, background: theme.bgMain, minHeight: '100vh' }
    : {};

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar menuItems={menuItems} bottomMenuItems={bottomMenuItems} theme={sidebarTheme} />
      
      <Layout style={layoutStyle}>
        <PageHeader 
          breadcrumbItems={breadcrumbItems}
          userMenuItems={userMenuItems}
          username={displayUsername}
        />
        
        <Content style={{ 
          padding: '24px', 
          minHeight: 280,
          background: theme.bgMain,
          ...contentStyle
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
