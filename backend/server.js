const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const pool = require('./utils/db');
const auth = require('./middleware/auth');
const { hotels, comments } = require('./utils/store');

// 引入路由
let userRoutes, hotelRoutes, roomRoutes, orderRoutes, commentRoutes, dashboardRoutes;

try {
  userRoutes = require('./routes/users');
  hotelRoutes = require('./routes/hotels');
  roomRoutes = require('./routes/rooms');
  orderRoutes = require('./routes/orders');
  commentRoutes = require('./routes/comments');
  dashboardRoutes = require('./routes/dashboard');
  console.log('所有路由模块加载成功');
  console.log('评论路由类型:', typeof commentRoutes);
  console.log('评论路由是否为函数:', typeof commentRoutes === 'function');
} catch (error) {
  console.error('路由模块加载失败:', error);
  process.exit(1);
}

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 静态资源：对外暴露 /static 前缀，用于访问酒店图片等静态文件
// 例如: backend/public/hotel.jpg -> http://localhost:3001/static/hotel.jpg
app.use('/static', express.static(path.join(__dirname, 'public')));

// 请求日志中间件（用于调试）
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

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
app.use('/api/comments', commentRoutes);

// Dashboard 统计接口（直接注册，确保可用）
app.get('/api/dashboard/stats', auth, async (req, res) => {
  try {
    const [hotelCount, pendingCount, reviewCount] = await Promise.all([
      hotels.count({ status: 'published' }),
      comments.count({ status: 'pending' }),
      comments.count(),
    ]);
    const payload = {
      hotelCount: Number(hotelCount ?? 0),
      pendingCount: Number(pendingCount ?? 0),
      reviewCount: Number(reviewCount ?? 0),
    };
    console.log('[Dashboard] stats:', payload);
    res.json(payload);
  } catch (error) {
    console.error('获取运营统计失败:', error);
    res.status(500).json({ message: '获取统计数据失败', error: error.message });
  }
});

app.use('/api/dashboard', dashboardRoutes);

// 调试信息
console.log('评论路由已注册: /api/comments');
console.log('评论路由类型:', typeof commentRoutes);
console.log('评论路由是否为Router:', commentRoutes && typeof commentRoutes === 'function');

// 健康检查
app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ status: 'ok', message: '服务运行中（MySQL存储）' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: '数据库连接失败' });
  }
});

// 404 错误处理中间件（必须在所有路由之后）
app.use((req, res) => {
  console.error(`404 - 路由未找到: ${req.method} ${req.originalUrl}`);
  console.error(`请求路径: ${req.path}, 完整URL: ${req.originalUrl}`);
  console.error(`请求头:`, req.headers);
  res.status(404).json({ message: '路由未找到', path: req.path, originalUrl: req.originalUrl });
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
