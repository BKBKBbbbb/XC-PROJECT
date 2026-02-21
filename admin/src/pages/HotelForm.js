import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, message, Card } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const { Option } = Select;
const { TextArea } = Input;

const HotelForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      fetchHotel();
    }
  }, [id]);

  const fetchHotel = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:3001/api/hotels/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      form.setFieldsValue(res.data);
    } catch (error) {
      message.error('获取酒店信息失败');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (isEdit) {
        await axios.put(`http://localhost:3001/api/hotels/${id}`, values, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success('更新成功');
      } else {
        await axios.post('http://localhost:3001/api/hotels', values, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success('创建成功');
      }
      navigate('/hotel');
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={isEdit ? '编辑酒店' : '添加酒店'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="name"
          label="酒店名称"
          rules={[{ required: true, message: '请输入酒店名称' }]}
        >
          <Input placeholder="请输入酒店名称" />
        </Form.Item>

        <Form.Item
          name="nameEn"
          label="英文名称"
        >
          <Input placeholder="请输入英文名称（可选）" />
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

        <Form.Item
          name="description"
          label="酒店描述"
        >
          <TextArea rows={4} placeholder="请输入酒店描述" />
        </Form.Item>

        <Form.Item
          name="status"
          label="状态"
          initialValue="draft"
        >
          <Select>
            <Option value="draft">草稿</Option>
            <Option value="pending">提交审核</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEdit ? '更新' : '创建'}
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate('/hotel')}>
            取消
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default HotelForm;
