const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users } = require('../utils/store');
const config = require('../config');

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // 检查用户是否存在
    const existingUser = users.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user = users.insert({
      username,
      password: hashedPassword,
      role: role || 'merchant',
      nickname: ''
    });
    
    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查找用户
    const user = users.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }
    
    // 生成 Token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        nickname: user.nickname
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '未登录' });
    }
    
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = users.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    const { password, ...userInfo } = user;
    res.json(userInfo);
  } catch (error) {
    res.status(401).json({ message: '无效的Token' });
  }
});

module.exports = router;
