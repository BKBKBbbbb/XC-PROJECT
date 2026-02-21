import React, { useState } from 'react';
import { Table, Tag, Space, Button, message } from 'antd';

const ReviewManage = () => {
  const [loading, setLoading] = useState(false);

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

  const handleDelete = (id) => {
    message.success('删除成功');
  };

  const handleAudit = (id, status) => {
    message.success(`审核通过`);
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
            <Button 
              type="link" 
              onClick={() => handleAudit(record._id, 'published')}
            >
              审核通过
            </Button>
          )}
          <Button 
            type="link" 
            danger 
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
      <Table 
        columns={columns} 
        dataSource={mockData} 
        rowKey="_id"
        loading={loading}
      />
    </div>
  );
};

export default ReviewManage;
