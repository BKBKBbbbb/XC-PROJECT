const express = require('express');
const cors = require('cors');
const config = require('./config');
const pool = require('./utils/db');

// 引入路由
const userRoutes = require('./routes/users');
const hotelRoutes = require('./routes/hotels');
const roomRoutes = require('./routes/rooms');
const orderRoutes = require('./routes/orders');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 根路径
app.get('/', (req, res) => {
  res.json({ 
    name: '易宿酒店预订API', 
    version: '1.0.0',
    status: 'running',
    endpoints: [
      '/api/health - 健康检查',
      '/api/users - 用户相关API',
      '/api/hotels - 酒店相关API',
      '/api/rooms - 房型相关API',
      '/api/orders - 订单相关API'
    ]
  });
});

// 路由
app.use('/api/users', userRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/orders', orderRoutes);

// 健康检查
app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ status: 'ok', message: '服务运行中（MySQL存储）' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: '数据库连接失败' });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

// 启动服务器
app.listen(config.port, () => {
  console.log(`服务器运行在 http://localhost:${config.port}`);
});

module.exports = app;
