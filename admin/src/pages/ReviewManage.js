import React, { useState, useEffect } from 'react';
import { 
  Layout, Menu, Table, Tag, Space, Button, message, Breadcrumb 
} from 'antd';
import { 
  HomeOutlined, AuditOutlined, BankOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Header, Sider, Content } = Layout;

const ReviewManage = () => {
  const [loading, setLoading] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('review');
  const navigate = useNavigate();
  
  // 获取用户信息判断角色
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = userInfo.role === 'admin';

  // 模拟数据
  const mockData = [
    {
      _id: '1',
      hotelName: '北京王府井希尔顿酒店',
      userName: '张三',
      rating: 5,
      content: '酒店位置很好，服务也很不错！',
      status: 'published',
      createdAt: '2026-02-20'
    },
    {
      _id: '2',
      hotelName: '上海外滩威斯汀酒店',
      userName: '李四',
      rating: 4,
      content: '房间有点小，但是位置一级棒',
      status: 'published',
      createdAt: '2026-02-19'
    },
    {
      _id: '3',
      hotelName: '杭州西湖四季酒店',
      userName: '王五',
      rating: 3,
      content: '一般般，没有想象中好',
      status: 'pending',
      createdAt: '2026-02-18'
    }
  ];

  // 菜单项
  const menuItems = [
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: '控制台',
      onClick: () => navigate('/dashboard')
    },
    {
      key: 'hotel',
      icon: <BankOutlined />,
      label: '酒店管理',
      onClick: () => navigate('/hotel')
    },
    {
      key: 'review',
      icon: <AuditOutlined />,
      label: '审核管理',
    },
  ];

  const handleDelete = (id) => {
    message.success('删除成功');
  };

  const handleAudit = (id, status) => {
    message.success(status === 'published' ? '审核通过' : '审核拒绝');
  };

  const columns = [
    {
      title: '酒店名称',
      dataIndex: 'hotelName',
      key: 'hotelName',
    },
    {
      title: '用户',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <Tag color={rating >= 4 ? 'green' : rating >= 3 ? 'orange' : 'red'}>
          {rating} 星
        </Tag>
      )
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      key: 'content',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'published' ? 'green' : 'orange'}>
          {status === 'published' ? '已发布' : '待审核'}
        </Tag>
      )
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <>
              <Button 
                type="link" 
                icon={<CheckCircleOutlined />}
                onClick={() => handleAudit(record.id, 'published')}
              >
                通过
              </Button>
              <Button 
                type="link" 
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleAudit(record.id, 'rejected')}
              >
                拒绝
              </Button>
            </>
          )}
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
        <Sider 
          width={220} 
          style={{ 
            background: '#1D2129',
            borderRight: '1px solid #E5E6EB'
          }}
        >
        <div style={{ 
          padding: '16px', 
          fontSize: '18px', 
          fontWeight: 'bold',
          textAlign: 'center',
          borderBottom: '1px solid #f0f0f0',
          color: '#1890ff'
        }}>
          易宿后台
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedMenu]}
          onClick={({ key }) => setSelectedMenu(key)}
          style={{ height: '100%', borderRight: 0 }}
          items={menuItems}
        />
      </Sider>
      
      <Layout>
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
            items={[
              { title: <><HomeOutlined /> 首页</>, onClick: () => navigate('/dashboard') },
              { title: '审核管理' }
            ]}
            style={{ display: 'flex', alignItems: 'center' }}
          />
          <div style={{ color: '#666' }}>
            欢迎，{userInfo.username || '管理员'}
          </div>
        </Header>
        
        <Content style={{ 
          padding: '24px', 
          minHeight: 280,
          background: '#F5F7FA'
        }}>
          <div style={{ marginBottom: 16 }}>
            <h2>评论审核列表</h2>
            <p style={{ color: '#666' }}>
              对用户的评论进行审核管理，待审核的评论需要管理员进行审核后才能显示
            </p>
          </div>
          <Table 
            columns={columns} 
            dataSource={mockData} 
            rowKey="id"
            loading={loading}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default ReviewManage;
