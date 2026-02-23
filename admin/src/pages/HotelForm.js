import React, { useState, useEffect } from 'react';
import { 
  Layout, Menu, Form, Input, Select, Button, Card, 
  message, Divider, Space, Popconfirm 
} from 'antd';
import { 
  HomeOutlined, EnvironmentOutlined, StarOutlined, 
  PhoneOutlined, FileTextOutlined, PlusOutlined, 
  DeleteOutlined, SaveOutlined, SyncOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { hotelApi } from '../utils/api';

const { Header, Sider, Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

const HotelForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('basic');
  const [customFields, setCustomFields] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();

  // 模拟实时同步状态
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      fetchHotel();
    }
  }, [id]);

  const fetchHotel = async () => {
    try {
      const res = await hotelApi.get(id);
      const hotelData = res;
      
      // 处理自定义字段
      if (hotelData.customFields) {
        setCustomFields(hotelData.customFields);
      }
      
      form.setFieldsValue(hotelData);
    } catch (error) {
      message.error('获取酒店信息失败: ' + (error.message || '未知错误'));
    }
  };

  // 模拟实时同步到后端
  const handleSync = async () => {
    setSyncStatus('syncing');
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const values = form.getFieldsValue();
      const token = localStorage.getItem('token');
      
      if (isEdit) {
        await hotelApi.update(id, {
          ...values,
          customFields
        });
      }
      
      setSyncStatus('synced');
      message.success('数据已同步');
      
      // 3秒后重置状态
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      setSyncStatus('idle');
      message.error('同步失败');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const submitData = {
        ...values,
        customFields
      };
      
      if (isEdit) {
        await hotelApi.update(id, submitData);
        message.success('更新成功');
      } else {
        await hotelApi.create(submitData);
        message.success('创建成功');
      }
      navigate('/hotel');
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 添加自定义维度
  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { key: '', value: '', type: 'text' }
    ]);
  };

  // 删除自定义维度
  const removeCustomField = (index) => {
    const newFields = [...customFields];
    newFields.splice(index, 1);
    setCustomFields(newFields);
  };

  // 更新自定义维度
  const updateCustomField = (index, field, value) => {
    const newFields = [...customFields];
    newFields[index][field] = value;
    setCustomFields(newFields);
  };

  // 菜单项配置
  const menuItems = [
    {
      key: 'basic',
      icon: <HomeOutlined />,
      label: '基本信息',
    },
    {
      key: 'contact',
      icon: <PhoneOutlined />,
      label: '联系方式',
    },
    {
      key: 'description',
      icon: <FileTextOutlined />,
      label: '酒店描述',
    },
    {
      key: 'custom',
      icon: <PlusOutlined />,
      label: '自定义维度',
    },
  ];

  // 渲染对应菜单的内容
  const renderContent = () => {
    switch (selectedMenu) {
      case 'basic':
        return (
          <>
            <Form.Item
              name="name"
              label="酒店名称"
              rules={[{ required: true, message: '请输入酒店名称' }]}
            >
              <Input placeholder="请输入酒店名称" />
            </Form.Item>

            <Form.Item
              name="city"
              label="城市"
              rules={[{ required: true, message: '请输入城市' }]}
            >
              <Input placeholder="如：北京、上海" />
            </Form.Item>

            <Form.Item
              name="address"
              label="地址"
              rules={[{ required: true, message: '请输入地址' }]}
            >
              <Input placeholder="请输入详细地址" />
            </Form.Item>

            <Form.Item
              name="star"
              label="星级"
              rules={[{ required: true, message: '请选择星级' }]}
            >
              <Select placeholder="请选择星级">
                <Option value={1}>一星级</Option>
                <Option value={2}>二星级</Option>
                <Option value={3}>三星级</Option>
                <Option value={4}>四星级</Option>
                <Option value={5}>五星级</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 'contact':
        return (
          <>
            <Form.Item
              name="phone"
              label="联系电话"
              rules={[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
              ]}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>

            <Form.Item
              name="email"
              label="电子邮箱"
            >
              <Input placeholder="请输入电子邮箱（可选）" />
            </Form.Item>

            <Form.Item
              name="contactPerson"
              label="联系人"
            >
              <Input placeholder="请输入联系人姓名（可选）" />
            </Form.Item>
          </>
        );

      case 'description':
        return (
          <Form.Item
            name="description"
            label="酒店描述"
          >
            <TextArea 
              rows={8} 
              placeholder="请输入酒店描述、特色服务、设施介绍等..." 
              showCount
              maxLength={1000}
            />
          </Form.Item>
        );

      case 'custom':
        return (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>自定义维度</span>
              <Button 
                type="dashed" 
                onClick={addCustomField}
                icon={<PlusOutlined />}
              >
                添加自定义维度
              </Button>
            </div>
            
            {customFields.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 0', 
                color: '#999',
                border: '1px dashed #d9d9d9',
                borderRadius: '8px'
              }}>
                <EnvironmentOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <p>暂无自定义维度</p>
                <p>点击上方按钮添加（如：停车场、宠物、WiFi等）</p>
              </div>
            ) : (
              customFields.map((field, index) => (
                <Card 
                  key={index} 
                  size="small" 
                  style={{ marginBottom: 16 }}
                  extra={
                    <Popconfirm
                      title="确定删除此维度？"
                      onConfirm={() => removeCustomField(index)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                      placeholder="维度名称（如：停车场）"
                      value={field.key}
                      onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                      addonBefore="名称"
                    />
                    <Select
                      value={field.type}
                      onChange={(value) => updateCustomField(index, 'type', value)}
                      addonBefore="类型"
                    >
                      <Option value="text">文本</Option>
                      <Option value="boolean">是/否</Option>
                      <Option value="number">数字</Option>
                    </Select>
                    {field.type === 'boolean' ? (
                      <Select
                        value={field.value}
                        onChange={(value) => updateCustomField(index, 'value', value)}
                        addonBefore="值"
                      >
                        <Option value={true}>是</Option>
                        <Option value={false}>否</Option>
                      </Select>
                    ) : (
                      <Input
                        placeholder="请输入值"
                        value={field.value}
                        onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                        addonBefore="值"
                      />
                    )}
                  </Space>
                </Card>
              ))
            )}
            
            <Divider />
            
            <div style={{ 
              background: '#f6f8fa', 
              padding: '16px', 
              borderRadius: '8px',
              fontSize: '13px',
              color: '#666'
            }}>
              <h4 style={{ marginTop: 0 }}>💡 常见自定义维度示例</h4>
              <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li>是否有停车场 - 是/否</li>
                <li>是否允许宠物 - 是/否</li>
                <li>WiFi覆盖 - 是/否</li>
                <li>早餐提供 - 是/否</li>
                <li>入住时间 - 文本</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
          borderBottom: '1px solid #E5E6EB'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
          {isEdit ? '编辑酒店' : '添加酒店'}
        </div>
        <Space>
          <Button 
            icon={<SyncOutlined spin={syncStatus === 'syncing'} />}
            onClick={handleSync}
            loading={syncStatus === 'syncing'}
          >
            {syncStatus === 'synced' ? '已同步' : '实时同步'}
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={loading}
          >
            保存
          </Button>
        </Space>
      </Header>
      
      <Layout>
        <Sider 
          width={200} 
          style={{ 
            background: '#1D2129',
            borderRight: '1px solid #E5E6EB'
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedMenu]}
            onClick={({ key }) => setSelectedMenu(key)}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        
        <Content style={{ 
          padding: '24px', 
          minHeight: 280,
          background: '#F5F7FA'
        }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              star: 3,
              status: 'draft'
            }}
          >
            {renderContent()}
          </Form>
        </Content>
      </Layout>
    </Layout>
  );
};

export default HotelForm;
