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
  const [roomTypes, setRoomTypes] = useState([]); // 房型与基础价格
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
      
      // 处理房型信息
      if (hotelData.roomTypes) {
        try {
          const parsed = typeof hotelData.roomTypes === 'string' 
            ? JSON.parse(hotelData.roomTypes) 
            : hotelData.roomTypes;
          const normalized = (Array.isArray(parsed) ? parsed : []).map((item) => ({
            name: item.name || '',
            basePrice: item.basePrice ?? null,
            bedType: item.bedType || '',
            maxOccupancy: item.maxOccupancy ?? null,
            remainingRooms: item.remainingRooms ?? null,
            description: item.description || '',
          }));
          setRoomTypes(normalized);
        } catch (e) {
          setRoomTypes([]);
        }
      }
      
      // 处理自定义字段
      if (hotelData.customFields) {
        try {
          const parsed = typeof hotelData.customFields === 'string' 
            ? JSON.parse(hotelData.customFields) 
            : hotelData.customFields;
          const normalized = (Array.isArray(parsed) ? parsed : []).map((field) => ({
            id: field.id || field.key || '',
            name: field.name || field.label || field.key || '',
            type: field.type || 'text',
            value: field.value ?? '',
          }));
          setCustomFields(normalized);
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
          const normalized = (Array.isArray(parsed) ? parsed : []).map((item) => {
            let distanceValue = item.distanceValue ?? null;
            let distanceUnit = item.distanceUnit || '米';
            if (distanceValue == null && typeof item.distance === 'string') {
              const num = parseFloat(item.distance);
              if (!Number.isNaN(num)) {
                distanceValue = num;
              }
              if (item.distance.includes('公里')) {
                distanceUnit = '公里';
              }
            }
            return {
              name: item.name || '',
              distanceValue,
              distanceUnit,
            };
          });
          setNearbyAttractions(normalized);
        } catch (e) {
          setNearbyAttractions([]);
        }
      }
      if (hotelData.nearbyTransport) {
        try {
          const parsed = typeof hotelData.nearbyTransport === 'string' 
            ? JSON.parse(hotelData.nearbyTransport) 
            : hotelData.nearbyTransport;
          const normalized = (Array.isArray(parsed) ? parsed : []).map((item) => {
            let distanceValue = item.distanceValue ?? null;
            let distanceUnit = item.distanceUnit || '米';
            if (distanceValue == null && typeof item.distance === 'string') {
              const num = parseFloat(item.distance);
              if (!Number.isNaN(num)) {
                distanceValue = num;
              }
              if (item.distance.includes('公里')) {
                distanceUnit = '公里';
              }
            }
            return {
              type: item.type || '',
              station: item.station || '',
              distanceValue,
              distanceUnit,
            };
          });
          setNearbyTransport(normalized);
        } catch (e) {
          setNearbyTransport([]);
        }
      }
      if (hotelData.nearbyMalls) {
        try {
          const parsed = typeof hotelData.nearbyMalls === 'string' 
            ? JSON.parse(hotelData.nearbyMalls) 
            : hotelData.nearbyMalls;
          const normalized = (Array.isArray(parsed) ? parsed : []).map((item) => {
            let distanceValue = item.distanceValue ?? null;
            let distanceUnit = item.distanceUnit || '米';
            if (distanceValue == null && typeof item.distance === 'string') {
              const num = parseFloat(item.distance);
              if (!Number.isNaN(num)) {
                distanceValue = num;
              }
              if (item.distance.includes('公里')) {
                distanceUnit = '公里';
              }
            }
            return {
              name: item.name || '',
              distanceValue,
              distanceUnit,
            };
          });
          setNearbyMalls(normalized);
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
          const normalized = (Array.isArray(parsed) ? parsed : []).map((discount) => ({
            type: discount.type || undefined,
            name: discount.name || '',
            method: discount.method || undefined,
            value: discount.value ?? null,
            description: discount.description || '',
            startDate: discount.startDate || null,
            endDate: discount.endDate || null,
            roomTypes: Array.isArray(discount.roomTypes) ? discount.roomTypes : [],
          }));
          setDiscounts(normalized);
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
          customFields,
          roomTypes,
          nearbyAttractions,
          nearbyTransport,
          nearbyMalls,
          discounts,
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

      // 校验房型信息（至少一条，且必填字段完整）
      if (!roomTypes || roomTypes.length === 0) {
        setSaving(false);
        message.error('请至少添加一种房型，并填写完整的房型信息');
        setSelectedMenu('rooms');
        return;
      }

      for (let i = 0; i < roomTypes.length; i++) {
        const room = roomTypes[i];
        if (
          !room.name ||
          room.basePrice === null ||
          room.basePrice === undefined ||
          !room.bedType ||
          room.maxOccupancy === null ||
          room.maxOccupancy === undefined ||
          room.remainingRooms === null ||
          room.remainingRooms === undefined
        ) {
          setSaving(false);
          message.error(`请完善第 ${i + 1} 个房型的必填信息`);
          setSelectedMenu('rooms');
          return;
        }
        if (
          Number.isNaN(Number(room.basePrice)) ||
          Number(room.basePrice) < 0 ||
          Number.isNaN(Number(room.maxOccupancy)) ||
          Number(room.maxOccupancy) <= 0 ||
          Number.isNaN(Number(room.remainingRooms)) ||
          Number(room.remainingRooms) < 0
        ) {
          setSaving(false);
          message.error(`第 ${i + 1} 个房型的价格/人数/房量必须为有效的非负数字，且入住人数大于 0`);
          setSelectedMenu('rooms');
          return;
        }
      }
      
      const submitData = {
        ...allValues,
        roomTypes,
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

    if (['name', 'nameEn', 'city', 'address', 'star', 'openDate', 'freeParking', 'freeWifi', 'breakfastType'].includes(fieldName)) {
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
      { id: '', name: '', value: '', type: 'text' }
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
      key: 'rooms',
      icon: <ShopOutlined />,
      label: '房型与价格',
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
            <Select placeholder="请选择城市">
              <Option value="北京">北京</Option>
              <Option value="上海">上海</Option>
              <Option value="广州">广州</Option>
              <Option value="深圳">深圳</Option>
              <Option value="杭州">杭州</Option>
              <Option value="南京">南京</Option>
              <Option value="成都">成都</Option>
              <Option value="重庆">重庆</Option>
              <Option value="西安">西安</Option>
              <Option value="苏州">苏州</Option>
            </Select>
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
              <Option value={1}>1 星</Option>
              <Option value={2}>2 星</Option>
              <Option value={3}>3 星</Option>
              <Option value={4}>4 星</Option>
              <Option value={5}>5 星</Option>
              </Select>
            </Form.Item>

          <Form.Item
            name="openDate"
            label="酒店开业时间"
            rules={[{ required: true, message: '请选择开业时间' }]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              placeholder="请选择开业时间（YYYY-MM-DD）"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Divider />

          <Card title="酒店基础配置" bordered={false} style={{ marginBottom: 0 }}>
            <Form.Item
              name="freeParking"
              label="免费停车场"
              rules={[{ required: true, message: '请选择是否提供免费停车场' }]}
            >
              <Select placeholder="请选择">
                <Option value={true}>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="freeWifi"
              label="免费 WiFi"
              rules={[{ required: true, message: '请选择是否提供免费 WiFi' }]}
            >
              <Select placeholder="请选择">
                <Option value={true}>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="breakfastType"
              label="早餐服务"
              rules={[{ required: true, message: '请选择早餐服务类型' }]}
            >
              <Select placeholder="请选择早餐服务类型">
                <Option value="none">无早</Option>
                <Option value="single">含单早</Option>
                <Option value="double">含双早</Option>
                <Option value="buffet">自助早</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="familyFriendly"
              label="亲子友好（选填）"
            >
              <Select placeholder="请选择">
                <Option value={true}>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="petsAllowed"
              label="可携带宠物（选填）"
            >
              <Select placeholder="请选择">
                <Option value={true}>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Form.Item>
          </Card>
        </div>

        {/* 房型与基础价格 */}
        <div style={{ display: selectedMenu === 'rooms' ? 'block' : 'none' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {roomTypes.map((room, index) => (
              <Card
                key={index}
                title={`房型 ${index + 1}`}
                extra={
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const newList = roomTypes.filter((_, i) => i !== index);
                      setRoomTypes(newList);
                    }}
                  >
                    删除
                  </Button>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Form.Item label="房型名称（如：经典双床房）" required style={{ marginBottom: 0 }}>
                    <Input
                      placeholder="请输入房型名称"
                      value={room.name}
                      onChange={(e) => {
                        const newList = [...roomTypes];
                        newList[index] = { ...newList[index], name: e.target.value };
                        setRoomTypes(newList);
                      }}
                    />
                  </Form.Item>

                  <Space style={{ width: '100%' }}>
                    <Form.Item label="基础单价（元）" required style={{ marginBottom: 0, flex: 1 }}>
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        value={room.basePrice}
                        onChange={(value) => {
                          const newList = [...roomTypes];
                          newList[index] = { ...newList[index], basePrice: value };
                          setRoomTypes(newList);
                        }}
                        placeholder="请输入基础价格"
                      />
                    </Form.Item>
                    <Form.Item label="床型" required style={{ marginBottom: 0, flex: 1 }}>
                      <Input
                        placeholder="如：1.8m 大床、1.2m 双床"
                        value={room.bedType}
                        onChange={(e) => {
                          const newList = [...roomTypes];
                          newList[index] = { ...newList[index], bedType: e.target.value };
                          setRoomTypes(newList);
                        }}
                      />
                    </Form.Item>
                  </Space>

                  <Space style={{ width: '100%' }}>
                    <Form.Item label="最大入住人数" required style={{ marginBottom: 0, flex: 1 }}>
                      <InputNumber
                        style={{ width: '100%' }}
                        min={1}
                        value={room.maxOccupancy}
                        onChange={(value) => {
                          const newList = [...roomTypes];
                          newList[index] = { ...newList[index], maxOccupancy: value };
                          setRoomTypes(newList);
                        }}
                        placeholder="请输入最大入住人数"
                      />
                    </Form.Item>
                    <Form.Item label="剩余房量" required style={{ marginBottom: 0, flex: 1 }}>
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        value={room.remainingRooms}
                        onChange={(value) => {
                          const newList = [...roomTypes];
                          newList[index] = { ...newList[index], remainingRooms: value };
                          setRoomTypes(newList);
                        }}
                        placeholder="请输入当前剩余房量"
                      />
                    </Form.Item>
                  </Space>

                  <Form.Item label="房型简介（选填）" style={{ marginBottom: 0 }}>
                    <TextArea
                      rows={3}
                      placeholder="可填写房间面积、楼层、窗景等信息"
                      value={room.description}
                      onChange={(e) => {
                        const newList = [...roomTypes];
                        newList[index] = { ...newList[index], description: e.target.value };
                        setRoomTypes(newList);
                      }}
                    />
                  </Form.Item>
                </Space>
              </Card>
            ))}

            <Button
              type="dashed"
              onClick={() =>
                setRoomTypes([
                  ...roomTypes,
                  {
                    name: '',
                    basePrice: null,
                    bedType: '',
                    maxOccupancy: null,
                    remainingRooms: null,
                    description: '',
                  },
                ])
              }
              icon={<PlusOutlined />}
              block
              size="large"
            >
              添加房型
            </Button>
          </Space>
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
                  <Space style={{ width: 260 }}>
                    <InputNumber
                      placeholder="距离数值"
                      value={item.distanceValue}
                      onChange={(value) => {
                        const newList = [...nearbyAttractions];
                        newList[index] = { ...newList[index], distanceValue: value };
                        setNearbyAttractions(newList);
                      }}
                      style={{ width: 140 }}
                      min={0}
                    />
                    <Select
                      value={item.distanceUnit || '米'}
                      onChange={(value) => {
                        const newList = [...nearbyAttractions];
                        newList[index] = { ...newList[index], distanceUnit: value };
                        setNearbyAttractions(newList);
                      }}
                      style={{ width: 100 }}
                    >
                      <Option value="米">米</Option>
                      <Option value="公里">公里</Option>
                    </Select>
                  </Space>
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
                onClick={() => setNearbyAttractions([...nearbyAttractions, { name: '', distanceValue: null, distanceUnit: '米' }])}
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
                  <Space style={{ width: 260 }}>
                    <InputNumber
                      placeholder="距离数值"
                      value={item.distanceValue}
                      onChange={(value) => {
                        const newList = [...nearbyTransport];
                        newList[index] = { ...newList[index], distanceValue: value };
                        setNearbyTransport(newList);
                      }}
                      style={{ width: 140 }}
                      min={0}
                    />
                    <Select
                      value={item.distanceUnit || '米'}
                      onChange={(value) => {
                        const newList = [...nearbyTransport];
                        newList[index] = { ...newList[index], distanceUnit: value };
                        setNearbyTransport(newList);
                      }}
                      style={{ width: 100 }}
                    >
                      <Option value="米">米</Option>
                      <Option value="公里">公里</Option>
                    </Select>
                  </Space>
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
                onClick={() => setNearbyTransport([...nearbyTransport, { type: '', station: '', distanceValue: null, distanceUnit: '米' }])}
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
                  <Space style={{ width: 260 }}>
                    <InputNumber
                      placeholder="距离数值"
                      value={item.distanceValue}
                      onChange={(value) => {
                        const newList = [...nearbyMalls];
                        newList[index] = { ...newList[index], distanceValue: value };
                        setNearbyMalls(newList);
                      }}
                      style={{ width: 140 }}
                      min={0}
                    />
                    <Select
                      value={item.distanceUnit || '米'}
                      onChange={(value) => {
                        const newList = [...nearbyMalls];
                        newList[index] = { ...newList[index], distanceUnit: value };
                        setNearbyMalls(newList);
                      }}
                      style={{ width: 100 }}
                    >
                      <Option value="米">米</Option>
                      <Option value="公里">公里</Option>
                    </Select>
                  </Space>
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
                onClick={() => setNearbyMalls([...nearbyMalls, { name: '', distanceValue: null, distanceUnit: '米' }])}
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

                  <Space style={{ width: '100%' }}>
                    <Form.Item label="优惠开始时间" style={{ marginBottom: 0, flex: 1 }}>
                      <DatePicker
                        style={{ width: '100%' }}
                        format="YYYY-MM-DD"
                        placeholder="请选择开始日期"
                        value={discount.startDate ? dayjs(discount.startDate) : null}
                        onChange={(date) => {
                          const newList = [...discounts];
                          newList[index] = { 
                            ...newList[index], 
                            startDate: date ? date.format('YYYY-MM-DD') : null 
                          };
                          setDiscounts(newList);
                        }}
                      />
                    </Form.Item>
                    <Form.Item label="优惠结束时间" style={{ marginBottom: 0, flex: 1 }}>
                      <DatePicker
                        style={{ width: '100%' }}
                        format="YYYY-MM-DD"
                        placeholder="请选择结束日期"
                        value={discount.endDate ? dayjs(discount.endDate) : null}
                        onChange={(date) => {
                          const newList = [...discounts];
                          newList[index] = { 
                            ...newList[index], 
                            endDate: date ? date.format('YYYY-MM-DD') : null 
                          };
                          setDiscounts(newList);
                        }}
                      />
                    </Form.Item>
                  </Space>

                  <Form.Item label="适用房型" style={{ marginBottom: 0 }}>
                    <Select
                      mode="multiple"
                      placeholder="请选择适用房型"
                      value={discount.roomTypes || []}
                      onChange={(value) => {
                        const newList = [...discounts];
                        newList[index] = { ...newList[index], roomTypes: value };
                        setDiscounts(newList);
                      }}
                      allowClear
                    >
                      {roomTypes.map((room, i) => (
                        <Option key={room.name || `room-${i}`} value={room.name || `房型${i + 1}`}>
                          {room.name || `房型 ${i + 1}`}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  
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
                  <Space style={{ width: '100%' }}>
                    <Input
                      placeholder="维度唯一标识（如：gym）"
                      value={field.id}
                      onChange={(e) => updateCustomField(index, 'id', e.target.value)}
                      addonBefore="标识"
                    />
                    <Input
                      placeholder="维度名称（如：健身房）"
                      value={field.name}
                      onChange={(e) => updateCustomField(index, 'name', e.target.value)}
                      addonBefore="名称"
                    />
                  </Space>
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
              <li>标识 gym，名称 健身房，类型 是/否</li>
              <li>标识 parking，名称 停车场，类型 是/否</li>
              <li>标识 pet，名称 宠物友好，类型 是/否</li>
              <li>标识 wifi，名称 WiFi 覆盖，类型 是/否</li>
              <li>标识 checkinTime，名称 入住时间，类型 文本</li>
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
              star: 3,
              breakfastType: 'none'
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
