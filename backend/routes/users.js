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
    const existingUser = await users.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user = await users.insert({
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
    const user = await users.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }
    
    // 验证密码（bcrypt.compare 验证密码）
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }
    
    // 生成 JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },   // 载荷（payload）
      config.jwtSecret,                                           // 密钥（secret）
      { expiresIn: config.jwtExpire }                             // 过期时间（expiresIn）
    );
    
    res.json({
      token,
      user: {
        id: user.id,
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
    const user = await users.findById(decoded.id);
    
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

//  JWT的结构
//  JWT = Header.Payload.Signature
//  Header：头部，包含算法和类型
//  Payload：载荷，包含用户信息
//  Signature：签名，包含Header和Payload的加密
//  Header和Payload都是JSON对象，签名是Header和Payload的加密

// JWT 和 Session的区别
// Session 和 JWT 的核心区别在于登录状态存储位置不同。
// Session 把用户会话保存在服务端，客户端只保存 Session ID
// JWT 把用户标识和过期时间等信息放在 Token 中，客户端自行携带，服务端主要负责校验签名。
// Session 的优点是安全控制强、支持主动注销，但分布式场景需要做共享存储
// JWT 的优点是更适合前后端分离和微服务，扩展性更好，但 Token 一旦泄露，在过期前较难主动失效。