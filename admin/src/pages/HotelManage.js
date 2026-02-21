import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, message } from 'antd';
import * as Icons from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { confirm } = Modal;

// 创建图标组件的辅助函数
const Icon = ({ type }) => {
  const IconComponent = Icons[type];
  return IconComponent ? <IconComponent /> : null;
};

const HotelManage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<Icon type="PlusOutlined" />} 
          onClick={handleAdd}
        >
          添加酒店
        </Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="_id"
        loading={loading}
      />
    </div>
  );
};

export default HotelManage;
