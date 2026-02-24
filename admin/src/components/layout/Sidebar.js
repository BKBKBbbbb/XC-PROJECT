import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../common/Icon';
import { theme } from '../common/theme';

const { Sider } = Layout;

/**
 * 侧边栏组件
 * @param {Array} menuItems - 菜单项配置
 * @param {Array} bottomMenuItems - 底部菜单项配置
 * @param {string} theme - 主题 'light' | 'dark'
 */
const Sidebar = ({ menuItems, bottomMenuItems, theme: menuTheme = 'light' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = ({ key }) => {
    const menuItem = menuItems.find(item => item.key === key);
    if (menuItem?.onClick) {
      menuItem.onClick();
    } else if (menuItem?.path) {
      navigate(menuItem.path);
    } else {
      navigate(key);
    }
  };

  const handleBottomMenuClick = ({ key }) => {
    const menuItem = bottomMenuItems?.find(item => item.key === key);
    if (menuItem?.onClick) {
      menuItem.onClick();
    }
  };

  const siderStyle = menuTheme === 'dark' 
    ? { background: theme.siderBg, borderRight: '1px solid rgba(255,255,255,0.1)', position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100 }
    : { background: '#fff', borderRight: '1px solid #E5E6EB' };

  const logoColor = menuTheme === 'dark' ? '#fff' : theme.textPrimary;

  return (
    <Sider 
      width={220} 
      style={siderStyle}
    >
      <div style={{ 
        height: 64, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderBottom: menuTheme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E5E6EB'
      }}>
        <span style={{ 
          color: logoColor, 
          fontSize: 20, 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8 
        }}>
          <Icon type="HomeOutlined" />
          易宿后台
        </span>
      </div>
      <Menu
        theme={menuTheme}
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={handleMenuClick}
        style={{ background: 'transparent', borderRight: 0, marginTop: 8 }}
        items={menuItems}
      />
      {bottomMenuItems && bottomMenuItems.length > 0 && (
        <div style={{ position: 'absolute', bottom: 20, width: '100%' }}>
          <Menu
            theme={menuTheme}
            mode="inline"
            onClick={handleBottomMenuClick}
            items={bottomMenuItems}
            style={{ background: 'transparent', borderRight: 0 }}
          />
        </div>
      )}
    </Sider>
  );
};

export default Sidebar;
