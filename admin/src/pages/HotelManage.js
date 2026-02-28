import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, message, Input, Tabs, Descriptions, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import { AppLayout, Icon } from '../components';
import { getMenuItems } from '../utils/menuConfig';
import { hotelApi } from '../utils/api';

const { confirm } = Modal;
const { TextArea } = Input;

const HotelManage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState({ visible: false, id: null });
  const [rejectReason, setRejectReason] = useState('');
  const [statusTab, setStatusTab] = useState('pending'); // 状态筛选标签页
  const [actionLoadingId, setActionLoadingId] = useState(null); // 正在执行操作的酒店 ID（通过/拒绝/下线/恢复）
  const [detailModal, setDetailModal] = useState({ visible: false, loading: false, hotel: null }); // 查看详情弹窗
  const navigate = useNavigate();

  // 获取用户信息判断角色
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = userInfo.role === 'admin';

  // 菜单项
  const menuItems = getMenuItems(isAdmin, navigate);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // 管理员：根据状态筛选
        const statusFilter = statusTab === 'approved' ? 'published' : statusTab;
        const res = await hotelApi.getAllHotels({ status: statusFilter, limit: 100 });
        setData(res.list || []);
      } else {
        // 商户：获取所有自己的酒店，不进行状态筛选
      const res = await hotelApi.getMyHotels();
        setData(Array.isArray(res) ? res : []);
      }
    } catch (error) {
      message.error('获取数据失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusTab]);

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
          await hotelApi.delete(id);
          message.success('删除成功');
          fetchData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 查看详情（管理员/商户通用，只读展示）
  const handleViewDetail = async (id) => {
    setDetailModal({ visible: true, loading: true, hotel: null });
    try {
      const res = await hotelApi.get(id);
      setDetailModal({ visible: true, loading: false, hotel: res || null });
    } catch (error) {
      console.error('获取酒店详情失败:', error);
      const errorMsg = error.response?.data?.message || error.message || '获取酒店详情失败';
      message.error(errorMsg);
      setDetailModal({ visible: false, loading: false, hotel: null });
    }
  };

  const statusMap = {
    pending: { text: '审核中', color: 'orange' },
    published: { text: '已通过', color: 'green' },
    rejected: { text: '已拒绝', color: 'red' },
    offline: { text: '已下线', color: 'default' },
    draft: { text: '审核中', color: 'orange' } // 兼容旧数据，将 draft 显示为审核中
  };

  const handleOffline = (id) => {
    confirm({
      title: '确认下线',
      content: '下线后酒店将不再展示，但数据保留可恢复。确定要下线吗？',
      onOk: async () => {
        try {
          await hotelApi.offline(id);
          message.success('已下线');
          fetchData();
        } catch (error) {
          console.error('下线失败:', error);
          console.error('错误详情:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
          });
          const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || '操作失败';
          message.error(`下线失败: ${errorMsg}`);
        }
      },
    });
  };

  const handleRestore = async (id) => {
    try {
      await hotelApi.restore(id);
      message.success('已恢复');
      fetchData();
    } catch (error) {
      console.error('恢复失败:', error);
      console.error('错误详情:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || '操作失败';
      message.error(`恢复失败: ${errorMsg}`);
    }
  };

  // 工具函数：解析可能为 JSON 字符串或数组的字段
  const parseArrayField = (value, defaultValue = []) => {
    if (!value) return defaultValue;
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  // 工具函数：将多种形式的布尔值（true/false、1/0、'1'/'0'）统一转换为“是/否/-”
  const renderYesNo = (value) => {
    if (value === true || value === 1 || value === '1') return '是';
    if (value === false || value === 0 || value === '0') return '否';
    return '-';
  };

  // 审核通过
  const handleApprove = async (id) => {
    setActionLoadingId(id);
    try {
      await hotelApi.review(id, { status: 'approved' });
      message.success('审核通过');
      // 审核通过后刷新列表
      if (isAdmin) {
        if (statusTab !== 'approved') {
          setStatusTab('approved'); // 切换到"已通过"标签页，会触发 useEffect 刷新
        } else {
          fetchData();
        }
      } else {
        fetchData();
      }
    } catch (error) {
      console.error('审核通过失败:', error);
      console.error('错误详情:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || '操作失败';
      message.error(`审核通过失败: ${errorMsg}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 审核拒绝
  const handleReject = (id) => {
    setRejectModal({ visible: true, id });
    setRejectReason('');
  };

  // 确认拒绝
  const confirmReject = async () => {
    const { id } = rejectModal;
    if (!rejectReason.trim()) {
      message.warning('请填写拒绝原因');
      return;
    }
    try {
      await hotelApi.review(id, { status: 'rejected', reviewNote: rejectReason });
      message.success('已拒绝');
      setRejectModal({ visible: false, id: null });
      setRejectReason('');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
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
        const item = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={item.color}>{item.text}</Tag>;
      }
    },
    {
      title: '拒绝原因',
      dataIndex: 'reviewNote',
      key: 'reviewNote',
      render: (v, record) => {
        // 只有已拒绝状态才显示拒绝原因
        if (record.status === 'rejected') {
          return v ? <span style={{ color: '#ff4d4f' }}>{v}</span> : '-';
        }
        return '-';
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
      render: (_, record) => {
        // 商户角色：只能编辑自己的酒店（不能删除）
        if (!isAdmin) {
          return (
        <Space size="middle">
              <Button
                type="link"
                icon={<Icon type="EyeOutlined" />}
                onClick={() => handleViewDetail(record.id)}
              >
                查看详情
              </Button>
          <Button 
            type="link" 
            icon={<Icon type="EditOutlined" />} 
            onClick={() => handleEdit(record.id)}
          >
            编辑
              </Button>
            </Space>
          );
        }
        
        // 管理员角色：只能进行审核、发布、下线、恢复操作
        return (
          <Space size="middle">
            <Button
              type="link"
              icon={<Icon type="EyeOutlined" />}
              onClick={() => handleViewDetail(record.id)}
            >
              查看详情
            </Button>
            {(record.status === 'pending' || record.status === 'draft') && (
              <>
                <Button 
                  type="link" 
                  style={{ color: '#52c41a' }}
                  icon={<Icon type="CheckOutlined" />}
                  loading={actionLoadingId === record.id}
                  disabled={!!actionLoadingId}
                  onClick={() => handleApprove(record.id)}
                >
                  通过
          </Button>
          <Button 
            type="link" 
            danger 
                  icon={<Icon type="CloseOutlined" />}
                  onClick={() => handleReject(record.id)}
                >
                  拒绝
                </Button>
              </>
            )}
            {record.status === 'rejected' && (
              <Button 
                type="link" 
                style={{ color: '#52c41a' }}
                icon={<Icon type="CheckOutlined" />}
                loading={actionLoadingId === record.id}
                disabled={!!actionLoadingId}
                onClick={() => handleApprove(record.id)}
              >
                通过
              </Button>
            )}
            {record.status === 'published' && (
              <Button 
                type="link" 
                icon={<Icon type="StopOutlined" />}
                onClick={() => handleOffline(record.id)}
              >
                下线
              </Button>
            )}
            {record.status === 'offline' && (
              <Button 
                type="link" 
                icon={<Icon type="UndoOutlined" />}
                onClick={() => handleRestore(record.id)}
              >
                恢复
          </Button>
            )}
        </Space>
        );
      },
    },
  ];

  return (
    <AppLayout
      menuItems={menuItems}
      breadcrumbItems={[{ title: isAdmin ? '酒店管理' : '信息录入' }]}
      username={userInfo.username}
      sidebarTheme="light"
    >
          <div style={{ marginBottom: 16 }}>
            <h2>{isAdmin ? '酒店管理' : '我的酒店'}</h2>
            <p style={{ color: '#666' }}>
              {isAdmin ? '管理所有酒店信息' : '录入和管理您的酒店信息'}
            </p>
          </div>
      {/* 只有商户角色才能看到新增按钮 */}
      {!isAdmin && (
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              icon={<Icon type="PlusOutlined" />} 
              onClick={handleAdd}
            >
            新增酒店
            </Button>
          </div>
      )}
      {/* 管理员显示状态筛选标签页 */}
      {isAdmin && (
        <Tabs
          activeKey={statusTab}
          onChange={setStatusTab}
          style={{ marginBottom: 16 }}
          items={[
            { key: 'pending', label: '审核中' },
            { key: 'approved', label: '已通过' },
            { key: 'rejected', label: '已拒绝' },
            { key: 'offline', label: '已下线' }
          ]}
        />
      )}
          <Table 
            columns={columns} 
            dataSource={data} 
            rowKey="id"
            loading={loading}
          />

      {/* 拒绝审核模态框 */}
      <Modal
        title="拒绝审核"
        open={rejectModal.visible}
        onOk={confirmReject}
        onCancel={() => {
          setRejectModal({ visible: false, id: null });
          setRejectReason('');
        }}
        okText="确认拒绝"
        cancelText="取消"
      >
        <p style={{ marginBottom: 16 }}>确定要拒绝这个酒店吗？</p>
        <TextArea
          placeholder="请输入拒绝原因（必填）"
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      {/* 酒店详情弹窗（只读） */}
      <Modal
        title="酒店详情"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, loading: false, hotel: null })}
        footer={
          <Button onClick={() => setDetailModal({ visible: false, loading: false, hotel: null })}>
            关闭
          </Button>
        }
        width={900}
      >
        {detailModal.loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>正在加载...</div>
        ) : !detailModal.hotel ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无详情数据</div>
        ) : (
          (() => {
            const h = detailModal.hotel;
            const roomTypes = parseArrayField(h.roomTypes);
            const nearbyAttractions = parseArrayField(h.nearbyAttractions);
            const nearbyTransport = parseArrayField(h.nearbyTransport);
            const nearbyMalls = parseArrayField(h.nearbyMalls);
            const discounts = parseArrayField(h.discounts);
            const customFields = parseArrayField(h.customFields);

            const formatDistance = (item) => {
              if (item.distanceValue == null && item.distance) {
                return item.distance;
              }
              if (item.distanceValue == null) return '-';
              return `${item.distanceValue}${item.distanceUnit || '米'}`;
            };

            const formatDate = (value) => {
              if (!value) return '-';
              const d = new Date(value);
              if (Number.isNaN(d.getTime())) return String(value);
              return d.toLocaleDateString('zh-CN');
            };

            return (
              <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
                {/* 基本信息 */}
                <Descriptions
                  title="基本信息"
                  bordered
                  size="small"
                  column={2}
                  style={{ marginBottom: 16 }}
                >
                  <Descriptions.Item label="中文名称">{h.name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="英文名称">{h.nameEn || '-'}</Descriptions.Item>
                  <Descriptions.Item label="城市">{h.city || '-'}</Descriptions.Item>
                  <Descriptions.Item label="地址">{h.address || '-'}</Descriptions.Item>
                  <Descriptions.Item label="星级">
                    {h.star ? `${h.star} 星` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="开业时间">
                    {formatDate(h.openDate)}
                  </Descriptions.Item>
                </Descriptions>

                {/* 基础配置 */}
                <Descriptions
                  title="基础配置"
                  bordered
                  size="small"
                  column={2}
                  style={{ marginBottom: 16 }}
                >
                  <Descriptions.Item label="免费停车场">
                    {renderYesNo(h.freeParking)}
                  </Descriptions.Item>
                  <Descriptions.Item label="免费 WiFi">
                    {renderYesNo(h.freeWifi)}
                  </Descriptions.Item>
                  <Descriptions.Item label="早餐服务">
                    {(() => {
                      switch (h.breakfastType) {
                        case 'none':
                          return '无早';
                        case 'single':
                          return '含单早';
                        case 'double':
                          return '含双早';
                        case 'buffet':
                          return '自助早';
                        default:
                          return '-';
                      }
                    })()}
                  </Descriptions.Item>
                  <Descriptions.Item label="亲子友好">
                    {renderYesNo(h.familyFriendly)}
                  </Descriptions.Item>
                  <Descriptions.Item label="可携带宠物">
                    {renderYesNo(h.petsAllowed)}
                  </Descriptions.Item>
                </Descriptions>

                {/* 联系方式 */}
                <Descriptions
                  title="联系方式"
                  bordered
                  size="small"
                  column={2}
                  style={{ marginBottom: 16 }}
                >
                  <Descriptions.Item label="联系电话">{h.phone || '-'}</Descriptions.Item>
                  <Descriptions.Item label="邮箱">{h.email || '-'}</Descriptions.Item>
                  <Descriptions.Item label="联系人">{h.contactPerson || '-'}</Descriptions.Item>
                </Descriptions>

                {/* 酒店描述 */}
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>酒店描述</h4>
                  <div
                    style={{
                      padding: 12,
                      minHeight: 60,
                      border: '1px solid #f0f0f0',
                      borderRadius: 4,
                      background: '#fafafa',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {h.description || '暂无描述'}
                  </div>
                </div>

                {/* 周边信息 */}
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>周边信息</h4>
                  <Divider orientation="left" plain style={{ margin: '8px 0' }}>
                    附近景点
                  </Divider>
                  {nearbyAttractions.length === 0 ? (
                    <div style={{ color: '#999', marginBottom: 8 }}>暂无景点信息</div>
                  ) : (
                    <ul style={{ paddingLeft: 20 }}>
                      {nearbyAttractions.map((item, index) => (
                        <li key={index}>
                          {item.name || '-'}（距离：{formatDistance(item)}）
                        </li>
                      ))}
                    </ul>
                  )}

                  <Divider orientation="left" plain style={{ margin: '8px 0' }}>
                    附近交通
                  </Divider>
                  {nearbyTransport.length === 0 ? (
                    <div style={{ color: '#999', marginBottom: 8 }}>暂无交通信息</div>
                  ) : (
                    <ul style={{ paddingLeft: 20 }}>
                      {nearbyTransport.map((item, index) => (
                        <li key={index}>
                          {item.type || '-'} - {item.station || '-'}（距离：
                          {formatDistance(item)}）
                        </li>
                      ))}
                    </ul>
                  )}

                  <Divider orientation="left" plain style={{ margin: '8px 0' }}>
                    附近商场
                  </Divider>
                  {nearbyMalls.length === 0 ? (
                    <div style={{ color: '#999' }}>暂无商场信息</div>
                  ) : (
                    <ul style={{ paddingLeft: 20 }}>
                      {nearbyMalls.map((item, index) => (
                        <li key={index}>
                          {item.name || '-'}（距离：{formatDistance(item)}）
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 房型与价格信息 */}
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>房型与价格信息</h4>
                  {roomTypes.length === 0 ? (
                    <div style={{ color: '#999' }}>暂无房型信息</div>
                  ) : (
                    <Table
                      size="small"
                      pagination={false}
                      rowKey={(_, index) => index}
                      columns={[
                        { title: '房型名称', dataIndex: 'name', key: 'name' },
                        {
                          title: '基础单价（元）',
                          dataIndex: 'basePrice',
                          key: 'basePrice',
                          render: (v) => (v != null ? v : '-'),
                        },
                        { title: '床型', dataIndex: 'bedType', key: 'bedType' },
                        {
                          title: '最大入住人数',
                          dataIndex: 'maxOccupancy',
                          key: 'maxOccupancy',
                          render: (v) => (v != null ? v : '-'),
                        },
                        {
                          title: '剩余房量',
                          dataIndex: 'remainingRooms',
                          key: 'remainingRooms',
                          render: (v) => (v != null ? v : '-'),
                        },
                        {
                          title: '房型简介',
                          dataIndex: 'description',
                          key: 'description',
                          ellipsis: true,
                        },
                      ]}
                      dataSource={roomTypes}
                    />
                  )}
                </div>

                {/* 优惠信息 */}
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>优惠信息</h4>
                  {discounts.length === 0 ? (
                    <div style={{ color: '#999' }}>暂无优惠信息</div>
                  ) : (
                    <Table
                      size="small"
                      pagination={false}
                      rowKey={(_, index) => index}
                      columns={[
                        { title: '优惠名称', dataIndex: 'name', key: 'name' },
                        { title: '优惠类型', dataIndex: 'type', key: 'type' },
                        { title: '优惠方式', dataIndex: 'method', key: 'method' },
                        {
                          title: '优惠值',
                          dataIndex: 'value',
                          key: 'value',
                          render: (v) => (v != null ? v : '-'),
                        },
                        {
                          title: '开始日期',
                          dataIndex: 'startDate',
                          key: 'startDate',
                          render: (v) => (v ? formatDate(v) : '-'),
                        },
                        {
                          title: '结束日期',
                          dataIndex: 'endDate',
                          key: 'endDate',
                          render: (v) => (v ? formatDate(v) : '-'),
                        },
                        {
                          title: '适用房型',
                          dataIndex: 'roomTypes',
                          key: 'roomTypes',
                          render: (v) =>
                            Array.isArray(v) && v.length > 0 ? v.join('，') : '-',
                        },
                      ]}
                      dataSource={discounts}
                    />
                  )}
                </div>

                {/* 自定义维度 */}
                <div style={{ marginBottom: 0 }}>
                  <h4 style={{ marginBottom: 8 }}>自定义维度</h4>
                  {customFields.length === 0 ? (
                    <div style={{ color: '#999' }}>暂无自定义维度</div>
                  ) : (
                    <Table
                      size="small"
                      pagination={false}
                      rowKey={(_, index) => index}
                      columns={[
                        { title: '标识', dataIndex: 'id', key: 'id' },
                        { title: '名称', dataIndex: 'name', key: 'name' },
                        { title: '类型', dataIndex: 'type', key: 'type' },
                        {
                          title: '值',
                          dataIndex: 'value',
                          key: 'value',
                          render: (v) => {
                            if (typeof v === 'boolean') {
                              return v ? '是' : '否';
                            }
                            if (v == null || v === '') return '-';
                            return String(v);
                          },
                        },
                      ]}
                      dataSource={customFields}
                    />
                  )}
                </div>
              </div>
            );
          })()
        )}
      </Modal>
    </AppLayout>
  );
};

export default HotelManage;
