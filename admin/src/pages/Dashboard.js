import React, { useEffect, useState } from 'react';
import { Card, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { AppLayout, Icon, StatCard } from '../components';
import { theme } from '../components/common/theme';
import './Dashboard.css';
import { getMenuItems } from '../utils/menuConfig';
import { dashboardApi } from '../utils/api';

// 核心数据
const mockStats = {
  hotelCount: 13,
  pendingCount: 2,
  reviewCount: 38,
};

// 今日数据
const mockTodayStats = {
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


const Dashboard = () => {
  const navigate = useNavigate();
  // 后端统计数据
  const [stats, setStats] = useState({
    hotelCount: 0,
    pendingCount: 0,
    reviewCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = userInfo.role === 'admin';
  const username = userInfo.username || 'admin';

  const menuItems = getMenuItems(isAdmin, navigate);

  // 拉取后端运营统计数据（已通过酒店数、待审核数、评论总数）
  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const res = await dashboardApi.getStats();
        if (!mounted || !res) return;
        setStats({
          hotelCount: Number(res.hotelCount ?? 0),
          pendingCount: Number(res.pendingCount ?? 0),
          reviewCount: Number(res.reviewCount ?? 0),
        });
      } catch (error) {
        console.error('获取运营统计失败:', error);
        // 出错时保持默认 0，避免展示错误的“死数据”
      } finally {
        if (mounted) {
          setLoadingStats(false);
        }
      }
    };
    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

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

  const bottomMenuItems = [
    { 
      key: 'logout', 
      icon: <Icon type="LogoutOutlined" />, 
      label: '退出登录', 
      onClick: handleLogout 
    }
  ];

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { text: '待审核', className: 'dashboard-status-pending' },
      published: { text: '已通过', className: 'dashboard-status-published' },
      rejected: { text: '已驳回', className: 'dashboard-status-rejected' },
    };
    const config = statusMap[status] || statusMap.pending;
    return (
      <span className={`dashboard-status-tag ${config.className}`}>
        {config.text}
      </span>
    );
  };

  return (
    <AppLayout
      menuItems={menuItems}
      bottomMenuItems={bottomMenuItems}
      breadcrumbItems={[{ title: '运营概览' }]}
      userMenuItems={userMenuItems}
      username={username}
      sidebarTheme="dark"
      contentStyle={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}
    >
          {/* 顶部欢迎条 - 精简版（避免加载时闪现错误数据） */}
          {!loadingStats && stats.pendingCount > 0 && isAdmin && (
            <div className="dashboard-welcome-bar">
              <Icon type="BellOutlined" />
              <span className="dashboard-welcome-text">
                欢迎回来，<strong>{username}</strong>！今日有 
                <span className="dashboard-welcome-highlight"> {stats.pendingCount} 项待审核任务</span>
                <a onClick={() => navigate('/review')} className="dashboard-welcome-link">
                  立即处理 <Icon type="RightOutlined" />
                </a>
              </span>
            </div>
          )}

          {/* 数据卡片区域（仅管理员可见） */}
          {isAdmin && (
            <div className="dashboard-section">
              <h3 className="dashboard-section-title">核心数据</h3>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <StatCard
                    title="酒店总数（家）"
                    value={loadingStats ? '--' : stats.hotelCount}
                    prefix={<Icon type="BankOutlined" />}
                    onClick={() => navigate('/hotel?tab=approved')}
                  />
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <StatCard 
                    title="待审核（条）" 
                    value={loadingStats ? '--' : stats.pendingCount} 
                    prefix={<Icon type="ClockCircleOutlined" />} 
                    color={theme.warning} 
                    onClick={isAdmin ? () => navigate('/hotel') : undefined} 
                    isPending={!loadingStats && stats.pendingCount > 0} />
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <StatCard
                    title="评论总数（条）"
                    value={loadingStats ? '--' : stats.reviewCount}
                    prefix={<Icon type="MessageOutlined" />}
                    onClick={() => navigate('/review?tab=published')}
                  />
                </Col>
              </Row>
            </div>
          )}

          {/* 今日数据 */}
          <div className="dashboard-section">
            <h3 className="dashboard-section-title">今日概览</h3>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <StatCard title="今日订单（笔）" value={mockTodayStats.todayOrders} suffix="笔" prefix={<Icon type="FileTextOutlined" />} subText={`${mockTodayStats.orderChange > 0 ? '↑' : '↓'} ${Math.abs(mockTodayStats.orderChange)}%`} />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <StatCard title="今日入住（人）" value={mockTodayStats.todayCheckIn} suffix="人" prefix={<Icon type="TeamOutlined" />} subText={`${mockTodayStats.checkInChange > 0 ? '↑' : '↓'} ${Math.abs(mockTodayStats.checkInChange)}%`} />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <StatCard title="今日营收（元）" value={mockTodayStats.todayRevenue} suffix="元" prefix={<Icon type="DollarOutlined" />} color="#165DFF" subText={`${mockTodayStats.revenueChange > 0 ? '↑' : '↓'} ${Math.abs(mockTodayStats.revenueChange)}%`} />
              </Col>
            </Row>
          </div>

          {/* 最近审核记录 */}
          <Card
            title={<span className="dashboard-card-title"><Icon type="AuditOutlined" />最近评论记录</span>}
            extra={isAdmin && (<a onClick={() => navigate('/review')} className="dashboard-card-extra">查看全部 <Icon type="RightOutlined" /></a>)}
            className="dashboard-card"
          >
            {recentReviews.length === 0 ? (
              <div className="dashboard-empty">
                <Icon type="InboxOutlined" className="dashboard-empty-icon" />
                <div>暂无审核记录</div>
              </div>
            ) : (
              recentReviews.map((review, index) => (
                <div
                  key={review.id}
                  className={`dashboard-review-item ${index < recentReviews.length - 1 ? 'dashboard-review-item-border' : ''}`}
                >
                  <div className="dashboard-review-main">
                    <div className="dashboard-review-hotel">{review.hotel}</div>
                    <div className="dashboard-review-info">{review.user} · {review.content}</div>
                  </div>
                  <div className="dashboard-review-right">
                    <div className="dashboard-review-stars">
                      {[1,2,3,4,5].map(star => (
                        <Icon
                          key={star}
                          type="StarFilled"
                          className={`dashboard-review-star ${star <= review.rating ? 'dashboard-review-star-active' : ''}`}
                        />
                      ))}
                    </div>
                    {getStatusTag(review.status)}
                  </div>
                </div>
              ))
            )}
          </Card>
    </AppLayout>
  );
};

export default Dashboard;
