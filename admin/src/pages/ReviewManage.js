import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, message, Tabs, Modal, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { AppLayout, Icon } from '../components';
import { getMenuItems } from '../utils/menuConfig';
import { commentApi } from '../utils/api';

const { TextArea } = Input;

const ReviewManage = () => {
  const [commentTab, setCommentTab] = useState('pending');
  const [commentList, setCommentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState({ visible: false, id: null });
  const [rejectReason, setRejectReason] = useState('');
  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = userInfo.role === 'admin';

  const menuItems = getMenuItems(isAdmin, navigate);

  // 评论状态映射
  const commentStatusMap = {
    pending: { text: '待审核', color: 'orange' },
    published: { text: '已发布', color: 'green' },
    rejected: { text: '已拒绝', color: 'red' },
    deleted: { text: '已删除', color: 'default' }
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      console.log('正在获取评论列表，状态:', commentTab);
      const res = await commentApi.list({ status: commentTab });
      console.log('评论列表响应:', res);
      setCommentList(res.list || []);
    } catch (error) {
      console.error('获取评论列表失败:', error);
      console.error('错误详情:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      const errorMessage = error.response?.data?.message || error.message || '获取评论列表失败';
      message.error(`获取评论列表失败: ${errorMessage} (状态码: ${error.response?.status || 'N/A'})`);
      setCommentList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [commentTab]);

  // 评论：通过
  const handleCommentApprove = async (id) => {
    try {
      await commentApi.approve(id);
      message.success('审核通过');
      fetchComments();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 评论：拒绝
  const handleCommentReject = (id) => {
    setRejectModal({ visible: true, id });
    setRejectReason('');
  };

  const confirmReject = async () => {
    const { id } = rejectModal;
    try {
      await commentApi.reject(id, rejectReason);
      message.success('已拒绝');
      setRejectModal({ visible: false, id: null });
      setRejectReason('');
      fetchComments();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 评论：删除（虚拟删除）
  const handleCommentDelete = async (id) => {
    try {
      await commentApi.delete(id);
      message.success('已移至已删除');
      fetchComments();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 评论：恢复
  const handleCommentRestore = async (id) => {
    try {
      await commentApi.restore(id);
      message.success('已恢复');
      fetchComments();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const commentColumns = [
    { title: '酒店名称', dataIndex: 'hotelName', key: 'hotelName' },
    { title: '用户', dataIndex: 'userName', key: 'userName' },
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
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <span title={text}>{text || '-'}</span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const item = commentStatusMap[status] || { text: status, color: 'default' };
        return <Tag color={item.color}>{item.text}</Tag>;
      }
    },
    ...(commentTab === 'rejected' ? [{
      title: '拒绝原因',
      dataIndex: 'reviewNote',
      key: 'reviewNote',
      ellipsis: {
        showTitle: false,
      },
      render: (v) => <span title={v || ''}>{v || '-'}</span>
    }] : []),
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => {
        if (!d) return '-';
        const date = new Date(d);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
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
                icon={<Icon type="CheckCircleOutlined" />}
                onClick={() => handleCommentApprove(record.id)}
              >
                通过
              </Button>
              <Button
                type="link"
                danger
                icon={<Icon type="CloseCircleOutlined" />}
                onClick={() => handleCommentReject(record.id)}
              >
                拒绝
              </Button>
            </>
          )}
          {record.status !== 'deleted' && (
            <Button
              type="link"
              danger
              icon={<Icon type="DeleteOutlined" />}
              onClick={() => handleCommentDelete(record.id)}
            >
              删除
            </Button>
          )}
          {record.status === 'deleted' && (
            <Button
              type="link"
              icon={<Icon type="UndoOutlined" />}
              onClick={() => handleCommentRestore(record.id)}
            >
              恢复
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <AppLayout
      menuItems={menuItems}
      breadcrumbItems={[{ title: '评论管理' }]}
      username={userInfo.username || '管理员'}
      sidebarTheme="light"
    >
      <div style={{ marginBottom: 16 }}>
        <h2>评论管理</h2>
        <p style={{ color: '#666' }}>
          对用户的评论进行审核管理，待审核的评论需要管理员审核后才能显示
        </p>
      </div>

      <Tabs
        activeKey={commentTab}
        onChange={setCommentTab}
        style={{ marginBottom: 16 }}
        items={[
          { key: 'pending', label: '待审核' },
          { key: 'published', label: '已发布' },
          { key: 'rejected', label: '已拒绝' },
          { key: 'deleted', label: '已删除' }
        ]}
      />
      <Table
        columns={commentColumns}
        dataSource={commentList}
        rowKey="id"
        loading={loading}
        locale={{
          emptyText: '暂无评论数据'
        }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条评论`,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
      />

      <Modal
        title="填写拒绝原因"
        open={rejectModal.visible}
        onOk={confirmReject}
        onCancel={() => setRejectModal({ visible: false, id: null })}
        okText="确定拒绝"
        cancelText="取消"
      >
        <TextArea
          rows={4}
          placeholder="可选填写拒绝原因"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </AppLayout>
  );
};

export default ReviewManage;
