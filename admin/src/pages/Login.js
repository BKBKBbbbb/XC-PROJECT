import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { userApi } from '../utils/api';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await userApi.login(values);
      // axios 响应拦截器已返回 response.data，直接使用 res
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      message.success('登录成功');
      
      // 根据用户角色跳转到不同页面
      const userRole = res.user.role;
      if (userRole === 'admin') {
        // 管理员跳转到主页面
        navigate('/dashboard');
      } else {
        // 商户跳转到信息录入页（酒店管理）
        navigate('/hotel');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo">易宿酒店管理后台</div>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              登录
            </Button>
          </Form.Item>
          
          <div className="login-footer">
            还没有账号？<Link to="/register">立即注册</Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
