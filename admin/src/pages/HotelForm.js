import React, { useState, useEffect } from 'react';
import { 
  Layout, Menu, Form, Input, Select, Button, Card, 
  message, Divider, Space, Popconfirm, DatePicker, InputNumber
} from 'antd';
import { 
  HomeOutlined, EnvironmentOutlined, StarOutlined, 
  PhoneOutlined, FileTextOutlined, PlusOutlined, 
  DeleteOutlined, SaveOutlined, SyncOutlined, ArrowLeftOutlined,
  ShopOutlined, DollarOutlined, CalendarOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { hotelApi } from '../utils/api';
import dayjs from 'dayjs';

const { Header, Sider, Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const HotelForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('basic');
  const [customFields, setCustomFields] = useState([]);
  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const [nearbyTransport, setNearbyTransport] = useState([]);
  const [nearbyMalls, setNearbyMalls] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [pendingError, setPendingError] = useState(null); // 用于存储待显示的错误信息
  const navigate = useNavigate();
  const { id } = useParams();

  // 检查用户角色，管理员不能访问此页面
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    if (userInfo.role === 'admin') {
      message.warning('管理员不能进行酒店信息录入和编辑');
      navigate('/hotel');
    }
  }, [navigate]);

  // 模拟实时同步状态
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      fetchHotel();
    }
  }, [id]);

  // 当标签页切换完成且有待显示的错误时，显示错误并聚焦字段
  useEffect(() => {
    if (pendingError) {
      const { fieldName, errorMessage } = pendingError;
      // 等待 DOM 完全渲染（标签页切换需要时间）
      const timer = setTimeout(() => {
        message.error(errorMessage, 4);
        // 尝试多种方式查找字段
        setTimeout(() => {
          // Ant Design Form 会为字段生成 id，格式可能是 form_phone 或类似
          let errorField = document.querySelector(`input[name="${fieldName}"]`) ||
                          document.querySelector(`input[id*="${fieldName}"]`) ||
                          document.querySelector(`select[name="${fieldName}"]`) ||
                          document.querySelector(`select[id*="${fieldName}"]`);
          
          if (errorField) {
            errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorField.focus();
          }
        }, 200);
      }, 200);
      // 清除待显示的错误
      setPendingError(null);
      return () => clearTimeout(timer);
    }
  }, [selectedMenu, pendingError]);

  const fetchHotel = async () => {
    try {
      const res = await hotelApi.get(id);
      const hotelData = res;
      
      // 处理自定义字段
      if (hotelData.customFields) {
        try {
          const parsed = typeof hotelData.customFields === 'string' 
            ? JSON.parse(hotelData.customFields) 
            : hotelData.customFields;
          setCustomFields(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setCustomFields([]);
        }
      }
      
      // 处理周边信息
      if (hotelData.nearbyAttractions) {
        try {
          const parsed = typeof hotelData.nearbyAttractions === 'string' 
            ? JSON.parse(hotelData.nearbyAttractions) 
            : hotelData.nearbyAttractions;
          setNearbyAttractions(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setNearbyAttractions([]);
        }
      }
      if (hotelData.nearbyTransport) {
        try {
          const parsed = typeof hotelData.nearbyTransport === 'string' 
            ? JSON.parse(hotelData.nearbyTransport) 
            : hotelData.nearbyTransport;
          setNearbyTransport(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setNearbyTransport([]);
        }
      }
      if (hotelData.nearbyMalls) {
        try {
          const parsed = typeof hotelData.nearbyMalls === 'string' 
            ? JSON.parse(hotelData.nearbyMalls) 
            : hotelData.nearbyMalls;
          setNearbyMalls(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setNearbyMalls([]);
        }
      }
      
      // 处理价格优惠
      if (hotelData.discounts) {
        try {
          const parsed = typeof hotelData.discounts === 'string' 
            ? JSON.parse(hotelData.discounts) 
            : hotelData.discounts;
          setDiscounts(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setDiscounts([]);
        }
      }
      
      // 处理日期字段
      if (hotelData.openDate) {
        hotelData.openDate = hotelData.openDate ? dayjs(hotelData.openDate) : null;
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
    setSaving(true);
    try {
      // 获取所有表单值（包括不在当前标签页的字段）
      const allValues = form.getFieldsValue();
      
      // 清理电话号码（去除空格）
      if (allValues.phone) {
        allValues.phone = allValues.phone.replace(/\s/g, '');
      }
      
      // 处理日期字段
      if (allValues.openDate) {
        allValues.openDate = dayjs(allValues.openDate).format('YYYY-MM-DD');
      }
      
      const submitData = {
        ...allValues,
        customFields,
        nearbyAttractions,
        nearbyTransport,
        nearbyMalls,
        discounts
      };
      
      // 新建时，删除 status 字段，让后端设置默认值为 pending
      if (!isEdit) {
        delete submitData.status;
      }
      
      if (isEdit) {
        await hotelApi.update(id, submitData);
        message.success('更新成功');
      } else {
        await hotelApi.create(submitData);
        message.success('创建成功');
      }
      navigate('/hotel');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || '操作失败';
      message.error(errorMessage);
      console.error('保存失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 表单校验失败时触发：根据第一个错误字段自动切换到对应标签页并聚焦
  const onFinishFailed = (errorInfo) => {
    if (!errorInfo || !errorInfo.errorFields || errorInfo.errorFields.length === 0) {
      return;
    }

    const firstError = errorInfo.errorFields[0];
    const fieldName = firstError.name[0];

    // 根据字段名切换到对应的标签页
    let targetMenu = selectedMenu;
    let errorMessage = firstError.errors[0] || '请填写所有必填字段';

    if (['name', 'nameEn', 'city', 'address', 'star', 'openDate'].includes(fieldName)) {
      targetMenu = 'basic';
      // 根据具体字段给出更友好的提示
      if (fieldName === 'name') {
        errorMessage = '请先填写酒店名称';
      } else if (fieldName === 'nameEn') {
        errorMessage = '请先填写酒店英文名称';
      } else if (fieldName === 'city') {
        errorMessage = '请先填写城市';
      } else if (fieldName === 'address') {
        errorMessage = '请先填写地址';
      } else if (fieldName === 'star') {
        errorMessage = '请先选择星级';
      } else if (fieldName === 'openDate') {
        errorMessage = '请先选择开业时间';
      }
    } else if (fieldName === 'phone') {
      targetMenu = 'contact';
      errorMessage = '请先填写联系电话，这是必填项';
    } else if (['email', 'contactPerson'].includes(fieldName)) {
      targetMenu = 'contact';
    }

    // 如果需要切换标签页，先切换，然后通过 useEffect 处理错误显示与聚焦
    if (targetMenu !== selectedMenu) {
      setSelectedMenu(targetMenu);
      // 设置待显示的错误信息，useEffect 会在标签页切换完成后处理
      setPendingError({ fieldName, errorMessage });
    } else {
      // 如果已经在正确的标签页，直接显示错误并尝试聚焦
      message.error(errorMessage, 4);
      setTimeout(() => {
        let errorField = document.querySelector(`input[name="${fieldName}"]`) ||
                        document.querySelector(`input[id*="${fieldName}"]`) ||
                        document.querySelector(`select[name="${fieldName}"]`) ||
                        document.querySelector(`select[id*="${fieldName}"]`);
        if (errorField) {
          errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorField.focus();
        }
      }, 100);
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
      key: 'nearby',
      icon: <EnvironmentOutlined />,
      label: '周边信息',
    },
    {
      key: 'discounts',
      icon: <DollarOutlined />,
      label: '价格优惠',
    },
    {
      key: 'custom',
      icon: <PlusOutlined />,
      label: '自定义维度',
    },
  ];

  // 渲染对应菜单的内容
  const renderContent = () => {
    return (
      <>
        {/* 基本信息 */}
        <div style={{ display: selectedMenu === 'basic' ? 'block' : 'none' }}>
          <Form.Item
            name="name"
            label="酒店名称（中文）"
            rules={[{ required: true, message: '请输入酒店名称' }]}
          >
            <Input placeholder="请输入酒店名称" />
          </Form.Item>

          <Form.Item
            name="nameEn"
            label="酒店名称（英文）"
            rules={[{ required: true, message: '请输入酒店英文名称' }]}
          >
            <Input placeholder="Enter hotel name in English" />
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
            label="酒店地址"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input placeholder="请输入详细地址" />
          </Form.Item>

          <Form.Item
            name="star"
            label="酒店星级"
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

          <Form.Item
            name="openDate"
            label="酒店开业时间"
            rules={[{ required: true, message: '请选择开业时间' }]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              placeholder="请选择开业时间"
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </div>

        {/* 联系方式 */}
        <div style={{ display: selectedMenu === 'contact' ? 'block' : 'none' }}>
          <Form.Item
            name="phone"
            label={
              <span>
                联系电话 <span style={{ color: 'red' }}>*</span>
              </span>
            }
            rules={[
              { required: true, message: '请输入联系电话' },
              { 
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }
                  // 去除空格和横线后验证
                  const cleaned = value.replace(/[\s-]/g, '');
                  // 手机号：1开头，11位数字
                  // 座机号：0开头，10-11位数字
                  // 400电话：400开头，10位数字
                  const phonePattern = /^(1[3-9]\d{9}|0\d{9,10}|400\d{7})$/;
                  if (phonePattern.test(cleaned)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('请输入正确的电话号码（支持手机号、座机号、400电话）'));
                }
              }
            ]}
            normalize={(value) => {
              // 自动去除空格
              return value ? value.replace(/\s/g, '') : value;
            }}
          >
            <Input placeholder="请输入联系电话（手机号或座机号）" />
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
        </div>

        {/* 酒店描述 */}
        <div style={{ display: selectedMenu === 'description' ? 'block' : 'none' }}>
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
        </div>

        {/* 周边信息 */}
        <div style={{ display: selectedMenu === 'nearby' ? 'block' : 'none' }}>
          <Card title="附近热门景点" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {nearbyAttractions.map((item, index) => (
                <Space key={index} style={{ width: '100%' }}>
                  <Input
                    placeholder="景点名称"
                    value={item.name}
                    onChange={(e) => {
                      const newList = [...nearbyAttractions];
                      newList[index] = { ...newList[index], name: e.target.value };
                      setNearbyAttractions(newList);
                    }}
                    style={{ flex: 1 }}
                  />
                  <Input
                    placeholder="距离（如：500米）"
                    value={item.distance}
                    onChange={(e) => {
                      const newList = [...nearbyAttractions];
                      newList[index] = { ...newList[index], distance: e.target.value };
                      setNearbyAttractions(newList);
                    }}
                    style={{ width: 150 }}
                  />
                  <Button 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const newList = nearbyAttractions.filter((_, i) => i !== index);
                      setNearbyAttractions(newList);
                    }}
                  >
                    删除
                  </Button>
                </Space>
              ))}
              <Button 
                type="dashed" 
                onClick={() => setNearbyAttractions([...nearbyAttractions, { name: '', distance: '' }])}
                icon={<PlusOutlined />}
                block
              >
                添加景点
              </Button>
            </Space>
          </Card>

          <Card title="附近交通" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {nearbyTransport.map((item, index) => (
                <Space key={index} style={{ width: '100%' }}>
                  <Input
                    placeholder="交通方式（如：地铁1号线）"
                    value={item.type}
                    onChange={(e) => {
                      const newList = [...nearbyTransport];
                      newList[index] = { ...newList[index], type: e.target.value };
                      setNearbyTransport(newList);
                    }}
                    style={{ flex: 1 }}
                  />
                  <Input
                    placeholder="站点名称"
                    value={item.station}
                    onChange={(e) => {
                      const newList = [...nearbyTransport];
                      newList[index] = { ...newList[index], station: e.target.value };
                      setNearbyTransport(newList);
                    }}
                    style={{ width: 200 }}
                  />
                  <Input
                    placeholder="距离"
                    value={item.distance}
                    onChange={(e) => {
                      const newList = [...nearbyTransport];
                      newList[index] = { ...newList[index], distance: e.target.value };
                      setNearbyTransport(newList);
                    }}
                    style={{ width: 150 }}
                  />
                  <Button 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const newList = nearbyTransport.filter((_, i) => i !== index);
                      setNearbyTransport(newList);
                    }}
                  >
                    删除
                  </Button>
                </Space>
              ))}
              <Button 
                type="dashed" 
                onClick={() => setNearbyTransport([...nearbyTransport, { type: '', station: '', distance: '' }])}
                icon={<PlusOutlined />}
                block
              >
                添加交通
              </Button>
            </Space>
          </Card>

          <Card title="附近商场">
            <Space direction="vertical" style={{ width: '100%' }}>
              {nearbyMalls.map((item, index) => (
                <Space key={index} style={{ width: '100%' }}>
                  <Input
                    placeholder="商场名称"
                    value={item.name}
                    onChange={(e) => {
                      const newList = [...nearbyMalls];
                      newList[index] = { ...newList[index], name: e.target.value };
                      setNearbyMalls(newList);
                    }}
                    style={{ flex: 1 }}
                  />
                  <Input
                    placeholder="距离（如：800米）"
                    value={item.distance}
                    onChange={(e) => {
                      const newList = [...nearbyMalls];
                      newList[index] = { ...newList[index], distance: e.target.value };
                      setNearbyMalls(newList);
                    }}
                    style={{ width: 150 }}
                  />
                  <Button 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const newList = nearbyMalls.filter((_, i) => i !== index);
                      setNearbyMalls(newList);
                    }}
                  >
                    删除
                  </Button>
                </Space>
              ))}
              <Button 
                type="dashed" 
                onClick={() => setNearbyMalls([...nearbyMalls, { name: '', distance: '' }])}
                icon={<PlusOutlined />}
                block
              >
                添加商场
              </Button>
            </Space>
          </Card>
        </div>

        {/* 价格优惠 */}
        <div style={{ display: selectedMenu === 'discounts' ? 'block' : 'none' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {discounts.map((discount, index) => (
              <Card 
                key={index}
                title={`优惠 ${index + 1}`}
                extra={
                  <Button 
                    danger 
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const newList = discounts.filter((_, i) => i !== index);
                      setDiscounts(newList);
                    }}
                  >
                    删除
                  </Button>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item label="优惠类型" style={{ marginBottom: 0 }}>
                    <Select
                      value={discount.type}
                      onChange={(value) => {
                        const newList = [...discounts];
                        newList[index] = { ...newList[index], type: value };
                        setDiscounts(newList);
                      }}
                      placeholder="请选择优惠类型"
                    >
                      <Option value="festival">节日优惠</Option>
                      <Option value="package">套餐优惠</Option>
                      <Option value="earlyBird">早鸟优惠</Option>
                      <Option value="member">会员优惠</Option>
                      <Option value="other">其他</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item label="优惠名称" style={{ marginBottom: 0 }}>
                    <Input
                      value={discount.name}
                      onChange={(e) => {
                        const newList = [...discounts];
                        newList[index] = { ...newList[index], name: e.target.value };
                        setDiscounts(newList);
                      }}
                      placeholder="如：春节特惠、机票+酒店套餐"
                    />
                  </Form.Item>
                  
                  <Space style={{ width: '100%' }}>
                    <Form.Item label="优惠方式" style={{ marginBottom: 0, flex: 1 }}>
                      <Select
                        value={discount.method}
                        onChange={(value) => {
                          const newList = [...discounts];
                          newList[index] = { ...newList[index], method: value };
                          setDiscounts(newList);
                        }}
                        placeholder="请选择优惠方式"
                      >
                        <Option value="discount">打折（如：8折）</Option>
                        <Option value="reduce">减价（如：减100元）</Option>
                        <Option value="package">套餐减价（如：机票+酒店减200元）</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item label="优惠值" style={{ marginBottom: 0, width: 200 }}>
                      <InputNumber
                        value={discount.value}
                        onChange={(value) => {
                          const newList = [...discounts];
                          newList[index] = { ...newList[index], value: value };
                          setDiscounts(newList);
                        }}
                        placeholder="数值"
                        style={{ width: '100%' }}
                        min={0}
                        precision={discount.method === 'discount' ? 2 : 0}
                      />
                    </Form.Item>
                  </Space>
                  
                  <Form.Item label="优惠说明" style={{ marginBottom: 0 }}>
                    <TextArea
                      value={discount.description}
                      onChange={(e) => {
                        const newList = [...discounts];
                        newList[index] = { ...newList[index], description: e.target.value };
                        setDiscounts(newList);
                      }}
                      placeholder="优惠详细说明（可选）"
                      rows={2}
                    />
                  </Form.Item>
                </Space>
              </Card>
            ))}
            
            <Button 
              type="dashed" 
              onClick={() => setDiscounts([...discounts, { type: '', name: '', method: '', value: null, description: '' }])}
              icon={<PlusOutlined />}
              block
              size="large"
            >
              添加优惠
            </Button>
          </Space>
        </div>

        {/* 自定义维度 */}
        <div style={{ display: selectedMenu === 'custom' ? 'block' : 'none' }}>
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
      </>
    );
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/hotel')}
          >
            返回
          </Button>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {isEdit ? '编辑酒店' : '添加酒店'}
          </div>
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
            loading={saving}
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
            onFinishFailed={onFinishFailed}
            initialValues={{
              star: 3
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
