import React, { useState } from 'react';
import { 
  Layout, Menu, Card, Row, Col, Statistic, Breadcrumb, Avatar, Dropdown 
} from 'antd';
import * as Icons from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

// 创建图标组件的辅助函数
const Icon = ({ type }) => {
  const IconComponent = Icons[type];
  return IconComponent ? <IconComponent /> : null;
};

// 主题色配置
const theme = {
  primary: '#00B42A',
  primaryLight: '#E8FFEA',
  warning: '#FF7D00',
  warningBg: '#FFF7E6',
  success: '#00B42A',
  successBg: '#E8FFEA',
  error: '#F53F3F',
  bgMain: '#F5F7FA',
  bgCard: '#FFFFFF',
  textPrimary: '#1D2129',
  textSecondary: '#4E5969',
  textTertiary: '#86909C',
  border: '#E5E6EB',
  siderBg: '#1D2129',
  siderSelected: '#00B42A',
};

// 模拟数据
const mockStats = {
  hotelCount: 12,
  pendingCount: 3,
  reviewCount: 88,
  todayOrders: 28,
  todayCheckIn: 156,
  todayRevenue: 28600,
  orderChange: 12,
  checkInChange: -5,
  revenueChange: 8,
};

const recentReviews = [
  { id: 1, hotel: '北京王府井希尔顿', user: '张三', rating: 5, content: '服务态度很好！', status: 'pending' },
  { id: 2, hotel: '上海外滩威斯汀', user: '李四', rating: 4, content: '位置不错，房间有点小', status: 'pending' },
  { id: 3, hotel: '杭州西湖四季', user: '王五', rating: 5, content: '环境优雅，下次还来', status: 'published' },
];

// 格式化金额（千位分隔符）
const formatMoney = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 卡片组件
const StatCard = ({ title, value, suffix, prefix, color, subText, onClick, isPending }) => (
  <Card
    hoverable={!!onClick}
    onClick={onClick}
    style={{ 
      borderRadius: 8,
      boxShadow: '0 2px 12px 0 rgba(0, 0, 0, 0.05)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      border: isPending ? `2px solid ${theme.warning}` : '1px solid #fff',
    }}
    styles={{ body: { padding: '20px 24px' } }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: theme.textTertiary, marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: color || theme.textPrimary, lineHeight: 1.2 }}>
          {formatMoney(value)}
        </div>
        {suffix && (
          <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 4 }}>
            {suffix}
          </div>
        )}
        {subText && (
          <div style={{ 
            fontSize: 12, 
            marginTop: 8,
            color: subText.startsWith('↑') ? theme.error : theme.success,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            {subText.startsWith('↑') ? <Icon type="ArrowUpOutlined" /> : <Icon type="ArrowDownOutlined" />}
            {subText} 较昨日
          </div>
        )}
      </div>
      <div style={{ 
        width: 48, 
        height: 48, 
        borderRadius: 8, 
        background: '#F5F7FA',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: theme.textTertiary,
        fontSize: 22
      }}>
        {prefix}
      </div>
    </div>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = userInfo.role === 'admin';
  const username = userInfo.username || 'admin';

  const menuItems = [
    {
      key: '/dashboard',
      icon: <Icon type="DashboardOutlined" />,
      label: '运营概览',
    },
    {
      key: '/hotel',
      icon: <Icon type="BankOutlined" />,
      label: isAdmin ? '酒店管理' : '信息录入',
    },
    ...(isAdmin ? [{
      key: '/review',
      icon: <Icon type="AuditOutlined" />,
      label: '审核管理',
    }] : []),
  ];

  const handleMenuClick = (key) => {
    navigate(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <Icon type="UserOutlined" />,
      label: '个人设置',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <Icon type="LogoutOutlined" />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { text: '待审核', color: theme.warning, bg: theme.warningBg },
      published: { text: '已通过', color: theme.success, bg: theme.successBg },
      rejected: { text: '已驳回', color: theme.textTertiary, bg: '#F5F7FA' },
    };
    const config = statusMap[status] || statusMap.pending;
    return (
      <span style={{ color: config.color, background: config.bg, padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
        {config.text}
      </span>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 左侧导航栏 */}
      <Sider width={220} style={{ background: theme.siderBg, position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100 }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon type="HomeOutlined" />
            易宿后台
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          style={{ background: 'transparent', borderRight: 0, marginTop: 8 }}
        />
        <div style={{ position: 'absolute', bottom: 20, width: '100%' }}>
          <Menu
            theme="dark"
            mode="inline"
            items={[{ key: 'logout', icon: <Icon type="LogoutOutlined" />, label: '退出登录', onClick: handleLogout }]}
            style={{ background: 'transparent', borderRight: 0 }}
          />
        </div>
      </Sider>
      
      {/* 主内容区 */}
      <Layout style={{ marginLeft: 220, background: theme.bgMain, minHeight: '100vh' }}>
        {/* 顶部导航栏 */}
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, zIndex: 99 }}>
          <Breadcrumb
            items={[
              { title: <><Icon type="HomeOutlined" /> 首页</>, onClick: () => navigate('/dashboard') },
              { title: '运营概览' }
            ]}
            style={{ display: 'flex', alignItems: 'center' }}
          />
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, transition: 'background 0.3s' }}>
              <Avatar style={{ backgroundColor: theme.primary }} icon={<Icon type="UserOutlined" />} />
              <span style={{ color: theme.textPrimary, fontWeight: 500 }}>{username}</span>
              <Icon type="DownOutlined" style={{ color: theme.textTertiary, fontSize: 12 }} />
            </div>
          </Dropdown>
        </Header>
        
        {/* 内容区域 */}
        <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
          {/* 顶部欢迎条 - 精简版 */}
          {mockStats.pendingCount > 0 && isAdmin && (
            <div style={{ background: theme.primaryLight, borderRadius: 8, padding: '12px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${theme.primary}30` }}>
              <Icon type="BellOutlined" style={{ color: theme.primary }} />
              <span style={{ color: theme.textPrimary }}>
                欢迎回来，<strong>{username}</strong>！今日有 
                <span style={{ color: theme.warning, fontWeight: 600 }}> {mockStats.pendingCount} 项待审核任务</span>
                <a onClick={() => navigate('/review')} style={{ marginLeft: 8, color: theme.primary }}>
                  立即处理 <Icon type="RightOutlined" />
                </a>
              </span>
            </div>
          )}

          {/* 数据卡片区域 */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.textPrimary, marginBottom: 16 }}>核心数据</h3>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <StatCard title="酒店总数（家）" value={mockStats.hotelCount} prefix={<Icon type="BankOutlined" />} onClick={() => navigate('/hotel')} />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <StatCard title="待审核（条）" value={mockStats.pendingCount} prefix={<Icon type="ClockCircleOutlined" />} color={theme.warning} onClick={isAdmin ? () => navigate('/review') : undefined} isPending={mockStats.pendingCount > 0} />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <StatCard title="评论总数（条）" value={mockStats.reviewCount} prefix={<Icon type="MessageOutlined" />} />
              </Col>
            </Row>
          </div>

          {/* 今日数据 */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.textPrimary, marginBottom: 16 }}>今日概览</h3>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <StatCard title="今日订单（笔）" value={mockStats.todayOrders} suffix="笔" prefix={<Icon type="FileTextOutlined" />} subText={`${mockStats.orderChange > 0 ? '↑' : '↓'} ${Math.abs(mockStats.orderChange)}%`} />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <StatCard title="今日入住（人）" value={mockStats.todayCheckIn} suffix="人" prefix={<Icon type="TeamOutlined" />} subText={`${mockStats.checkInChange > 0 ? '↑' : '↓'} ${Math.abs(mockStats.checkInChange)}%`} />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <StatCard title="今日营收（元）" value={mockStats.todayRevenue} suffix="元" prefix={<Icon type="DollarOutlined" />} color="#165DFF" subText={`${mockStats.revenueChange > 0 ? '↑' : '↓'} ${Math.abs(mockStats.revenueChange)}%`} />
              </Col>
            </Row>
          </div>

          {/* 最近审核记录 */}
          <Card
            title={<span style={{ fontWeight: 600, fontSize: 15 }}><Icon type="AuditOutlined" style={{ marginRight: 8 }} />最近审核记录</span>}
            extra={isAdmin && (<a onClick={() => navigate('/review')} style={{ color: theme.textSecondary, fontSize: 13 }}>查看全部 <Icon type="RightOutlined" /></a>)}
            style={{ borderRadius: 8, boxShadow: '0 2px 12px 0 rgba(0, 0, 0, 0.05)' }}
            styles={{ header: { borderBottom: `1px solid ${theme.border}` } }}
          >
            {recentReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: theme.textTertiary }}>
                <Icon type="InboxOutlined" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
                <div>暂无审核记录</div>
              </div>
            ) : (
              recentReviews.map((review, index) => (
                <div key={review.id} style={{ padding: '14px 0', borderBottom: index < recentReviews.length - 1 ? `1px solid ${theme.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: theme.textPrimary, marginBottom: 4 }}>{review.hotel}</div>
                    <div style={{ fontSize: 13, color: theme.textTertiary }}>{review.user} · {review.content}</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 80 }}>
                    <div style={{ marginBottom: 4 }}>
                      {[1,2,3,4,5].map(star => (
                        <Icon key={star} type="StarFilled" style={{ color: star <= review.rating ? '#FFB800' : '#E5E6EB', fontSize: 12, marginRight: 2 }} />
                      ))}
                    </div>
                    {getStatusTag(review.status)}
                  </div>
                </div>
              ))
            )}
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
