import React from 'react';
import { Layout, Menu, Card, Row, Col, Statistic } from 'antd';
import * as Icons from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

// 创建图标组件的辅助函数
const Icon = ({ type }) => {
  const IconComponent = Icons[type];
  return IconComponent ? <IconComponent /> : null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <Icon type="DashboardOutlined" />,
      label: '仪表盘',
    },
    {
      key: '/hotel',
      icon: <Icon type="HotelOutlined" />,
      label: '酒店管理',
    },
    {
      key: '/review',
      icon: <Icon type="CommentOutlined" />,
      label: '评论管理',
    },
  ];

  const handleMenuClick = (key) => {
    navigate(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold'
        }}>
          易宿管理后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
        <div style={{ position: 'absolute', bottom: 20, width: '100%' }}>
          <Menu
            theme="dark"
            mode="inline"
            items={[
              {
                key: 'logout',
                icon: <Icon type="LogoutOutlined" />,
                label: '退出登录',
                onClick: handleLogout
              }
            ]}
          />
        </div>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span>欢迎，管理员</span>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#fff', minHeight: 280 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic title="酒店总数" value={12} prefix={<Icon type="HotelOutlined" />} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="待审核" value={3} valueStyle={{ color: '#faad14' }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="评论总数" value={88} prefix={<Icon type="CommentOutlined" />} />
              </Card>
            </Col>
          </Row>
          <div style={{ marginTop: 24 }}>
            <h2>欢迎使用易宿酒店管理后台</h2>
            <p>在这里你可以管理酒店信息、查看订单、处理评论等。</p>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
