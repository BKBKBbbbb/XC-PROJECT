import React, { useState, useEffect } from 'react';
import { 
  Layout, Menu, Table, Button, Tag, Space, Modal, message, Breadcrumb 
} from 'antd';
import * as Icons from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const { Header, Sider, Content } = Layout;

const { confirm } = Modal;

// 创建图标组件的辅助函数
const Icon = ({ type }) => {
  const IconComponent = Icons[type];
  return IconComponent ? <IconComponent /> : null;
};

// 主题色配置
const theme = {
  primary: '#00B42A',
  warning: '#F53F3F',
  bgMain: '#F5F7FA',
  textPrimary: '#1D2129',
  textSecondary: '#4E5969',
  textTertiary: '#86909C',
  border: '#E5E6EB',
  siderBg: '#1D2129',
};

const HotelManage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('hotel');
  const navigate = useNavigate();
  const location = useLocation();

  // 获取用户信息判断角色
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = userInfo.role === 'admin';

  // 菜单项
  const menuItems = [
    {
      key: '/dashboard',
      icon: <Icon type="DashboardOutlined" />,
      label: '控制台',
      onClick: () => navigate('/dashboard')
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
      onClick: () => navigate('/review')
    }] : []),
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3001/api/hotels/merchant/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    navigate('/hotel/add');
  };

  const handleEdit = (id) => {
    navigate(`/hotel/edit/${id}`);
  };

  const handleDelete = (id) => {
    confirm({
      title: '确认删除',
      icon: <Icon type="ExclamationCircleOutlined" />,
      content: '确定要删除这个酒店吗？',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:3001/api/hotels/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          message.success('删除成功');
          fetchData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const statusMap = {
    draft: { text: '草稿', color: 'default' },
    pending: { text: '待审核', color: 'orange' },
    published: { text: '已发布', color: 'green' },
    offline: { text: '已下线', color: 'red' }
  };

  const columns = [
    {
      title: '酒店名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: '星级',
      dataIndex: 'star',
      key: 'star',
      render: (star) => `${star}星`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const item = statusMap[status] || statusMap.draft;
        return <Tag color={item.color}>{item.text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<Icon type="EditOutlined" />} 
            onClick={() => handleEdit(record._id)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<Icon type="DeleteOutlined" />} 
            onClick={() => handleDelete(record._id)}
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
          selectedKeys={[location.pathname]}
          onClick={({ key }) => {
            if (key === '/dashboard') navigate('/dashboard');
            else if (key === '/review') navigate('/review');
            else if (key === '/hotel') setSelectedMenu('hotel');
          }}
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
          <Breadcrumb>
            <Breadcrumb.Item>
              <Button 
                type="link" 
                onClick={() => navigate('/dashboard')}
              >
                首页
              </Button>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{isAdmin ? '酒店管理' : '信息录入'}</Breadcrumb.Item>
          </Breadcrumb>
          <div style={{ color: '#666' }}>
            欢迎，{userInfo.username || '用户'}
          </div>
        </Header>
        
        <Content style={{ 
          padding: '24px', 
          minHeight: 280,
          background: '#F5F7FA'
        }}>
          <div style={{ marginBottom: 16 }}>
            <h2>{isAdmin ? '酒店管理' : '我的酒店'}</h2>
            <p style={{ color: '#666' }}>
              {isAdmin ? '管理所有酒店信息' : '录入和管理您的酒店信息'}
            </p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              icon={<Icon type="PlusOutlined" />} 
              onClick={handleAdd}
            >
              {isAdmin ? '添加酒店' : '新增酒店'}
            </Button>
          </div>
          <Table 
            columns={columns} 
            dataSource={data} 
            rowKey="_id"
            loading={loading}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default HotelManage;
