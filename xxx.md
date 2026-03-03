# 易宿酒店预订平台 - 面试答辩知识点

> 项目技术栈：Node.js + Express + MySQL + React + Ant Design + Taro

---

## 📋 目录

1. [项目概述](#项目概述)
2. [前端技术要点](#前端技术要点)
3. [后端技术要点](#后端技术要点)
4. [数据库设计](#数据库设计)
5. [服务器部署](#服务器部署)
6. [安全机制](#安全机制)
7. [核心业务流程](#核心业务流程)
8. [常见面试问题](#常见面试问题)

---

## 一、项目概述

### 1.1 项目架构

```
XC-PROJECT/
├── backend/          # 后端服务 (Node.js + Express + MySQL)
├── admin/            # PC管理端 (React + Ant Design)
└── mobile/            # 移动端H5 (Taro + React)
```

### 1.2 技术选型理由

| 技术 | 选型理由 |
|------|---------|
| **Node.js + Express** | 轻量级、异步I/O、适合API服务，生态丰富 |
| **MySQL** | 关系型数据库，事务支持，数据一致性保证 |
| **React** | 组件化开发，生态成熟，适合管理后台 |
| **Taro** | 跨平台框架，一套代码多端运行（H5/小程序） |
| **JWT** | 无状态认证，适合分布式系统，易于扩展 |

---

## 二、前端技术要点

### 2.1 管理端（React + Ant Design）

#### 2.1.1 状态管理

**实现方式：**
- 使用 React Hooks (`useState`, `useEffect`) 管理组件状态
- 使用 `localStorage`（浏览器本地存储）保存登录后的 Token 和用户信息
- 通过 Context API 或 Props 传递共享状态

**为什么这么做：**
- 项目规模中等，不需要 Redux 等复杂状态管理
- Hooks 更简洁，符合 React 函数式编程理念
- localStorage 适合存储用户会话信息（Token），用于后续 API 请求的认证

**说明：localStorage vs MySQL**
- **localStorage（前端）**：浏览器本地存储，用于临时保存登录后的 Token 和用户信息，刷新页面后不需要重新登录
- **MySQL（后端）**：数据库，用于持久化存储业务数据（用户账号、酒店信息、订单等）
- **工作流程**：用户登录 → 后端验证（查询 MySQL）→ 返回 Token → 前端保存到 localStorage → 后续请求携带 Token

**关键代码：**
```javascript
// 登录后存储用户信息（前端 localStorage）
const res = await userApi.login(values);
localStorage.setItem('token', res.token);
localStorage.setItem('user', JSON.stringify(res.user));

// 获取用户信息判断角色（从 localStorage 读取）
const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
const isAdmin = userInfo.role === 'admin';
```

#### 2.1.2 路由与权限控制

**实现方式：**
- 使用 React Router 进行路由管理
- 根据用户角色（`admin`/`merchant`）动态显示菜单和功能
- 通过 `menuConfig.js` 统一管理菜单配置

**为什么这么做：**
- 集中管理菜单配置，便于维护
- 角色权限与UI展示分离，代码更清晰
- 支持动态路由，扩展性好

**关键代码：**
```javascript
// utils/menuConfig.js - 根据角色返回不同菜单
export const getMenuItems = (isAdmin, navigate) => {
  if (isAdmin) {
    return [
      { key: '/dashboard', label: '仪表盘', icon: 'DashboardOutlined' },
      { key: '/hotel', label: '酒店管理', icon: 'HomeOutlined' },
      { key: '/review', label: '评论管理', icon: 'CommentOutlined' }
    ];
  } else {
    return [
      { key: '/hotel', label: '信息录入', icon: 'HomeOutlined' }
    ];
  }
};
```

#### 2.1.3 API 请求封装

**实现方式：**
- 使用 Axios 封装统一的请求方法
- 请求拦截器自动添加 JWT Token
- 响应拦截器统一处理 401 错误（跳转登录）

**为什么这么做：**
- 避免在每个组件中重复写 Token 逻辑
- 统一错误处理，提升用户体验
- 便于后续添加请求日志、重试等功能

**关键代码：**
```javascript
// utils/api.js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 2.1.4 组件设计

**实现方式：**
- 通用组件抽离到 `components/` 目录
- 布局组件（`AppLayout`）统一管理侧边栏、头部
- 业务组件（`StatCard`）可复用

**为什么这么做：**
- 提高代码复用性
- 统一UI风格
- 便于维护和测试

---

### 2.2 移动端（Taro + React）

#### 2.2.1 跨平台开发

**实现方式：**
- 使用 Taro 框架，一套代码多端运行
- 通过配置文件区分开发/生产环境
- 使用 Taro 的 API 封装网络请求

**为什么这么做：**
- 降低开发成本，一套代码支持 H5/小程序/App
- Taro 提供统一的 API，屏蔽平台差异
- 便于后续扩展小程序版本

#### 2.2.2 状态管理与数据流

**实现方式：**
- 页面级状态使用 Hooks
- 跨页面数据通过 URL 参数或全局状态管理
- 酒店通用逻辑抽离到 `utils/hotel.js`

**为什么这么做：**
- 避免重复代码（如最低价计算、评分文案）
- 逻辑集中管理，便于维护

---

## 三、后端技术要点

### 3.1 架构设计

#### 3.1.1 分层架构

```
backend/
├── routes/          # 路由层（处理HTTP请求）
├── middleware/      # 中间件层（认证、权限）
├── utils/           # 工具层（数据库封装、工具函数）
└── config/          # 配置层（字段白名单、环境变量）
```

**为什么这么做：**
- **职责分离**：路由只处理请求，业务逻辑在工具层
- **可维护性**：修改数据库逻辑不影响路由代码
- **可测试性**：各层可独立测试

#### 3.1.2 通用存储封装（MySqlStore）

**实现方式：**
- 封装通用的 CRUD 操作（`find`, `findById`, `insert`, `update`, `remove`, `count`）
- 自动处理 JSON 字段序列化/反序列化
- 自动维护 `createdAt` 和 `updatedAt` 字段

**为什么这么做：**
- **减少重复代码**：所有表使用相同的 CRUD 逻辑
- **统一错误处理**：数据库错误统一处理
- **类型安全**：JSON 字段自动转换，避免手动处理

**关键代码：**
```javascript
// utils/store.js
class MySqlStore {
  constructor(tableName) {
    this.tableName = tableName;
  }
  
  // 自动处理 JSON 字段
  _parseItem(item) {
    for (const [key, value] of Object.entries(item)) {
      if (value instanceof Object && !(value instanceof Date)) {
        values.push(JSON.stringify(value)); // 对象转JSON字符串
      }
    }
  }
  
  // 自动添加时间戳
  insert(item) {
    const newItem = {
      ...item,
      id: require('crypto').randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
```

**使用示例：**
```javascript
// 所有表使用相同的接口
const { users, hotels, rooms, orders, comments } = require('./utils/store');

// 查询
const hotel = await hotels.findById(id);

// 更新
const updated = await hotels.update(id, { name: '新名称' });

// 统计
const count = await hotels.count({ status: 'published' });
```

---

### 3.2 认证与授权

#### 3.2.1 JWT 认证

**实现方式：**
- 登录成功后生成 JWT Token
- Token 包含用户 ID、用户名、角色
- 使用中间件验证 Token

**为什么这么做：**
- **无状态**：服务器不需要存储会话，适合分布式系统
- **安全性**：Token 签名防止篡改
- **扩展性**：易于添加新的认证方式

**关键代码：**
```javascript
// routes/users.js - 登录
const token = jwt.sign(
  { id: user.id, username: user.username, role: user.role },
  config.jwtSecret,
  { expiresIn: config.jwtExpire }
);

// middleware/auth.js - 验证
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: '请先登录' });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // 将用户信息挂载到 req.user
    next();
  } catch (error) {
    res.status(401).json({ message: '登录已过期，请重新登录' });
  }
};
```

#### 3.2.2 角色权限控制（RBAC）

**实现方式：**
- 在路由中检查 `req.user.role`
- 不同角色访问不同的接口和功能

**权限矩阵：**

| 功能 | 商户 (merchant) | 管理员 (admin) |
|------|----------------|----------------|
| 创建酒店 | ✅ | ❌ |
| 编辑自己的酒店 | ✅ | ❌ |
| 审核酒店 | ❌ | ✅ |
| 查看所有酒店 | ❌ | ✅ |
| 下线/恢复酒店 | ❌ | ✅ |

**关键代码：**
```javascript
// 审核接口 - 仅管理员可访问
router.put('/:id/review', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '无权限审核' });
  }
  // ... 审核逻辑
});

// 获取我的酒店 - 商户只能看自己的
router.get('/merchant/my', auth, async (req, res) => {
  const hotelList = await hotels.find({ merchantId: req.user.id });
  res.json(hotelList);
});
```

---

### 3.3 安全机制

#### 3.3.1 密码加密

**实现方式：**
- 使用 `bcrypt` 加密密码（盐值轮数：10）
- 登录时使用 `bcrypt.compare` 验证密码

**为什么这么做：**
- **不可逆加密**：即使数据库泄露，也无法还原密码
- **加盐处理**：相同密码加密结果不同，防止彩虹表攻击

**关键代码：**
```javascript
// 注册时加密
const hashedPassword = await bcrypt.hash(password, 10);

// 登录时验证
const isMatch = await bcrypt.compare(password, user.password);
```

#### 3.3.2 字段白名单过滤

**实现方式：**
- 定义允许更新的字段列表
- 过滤请求体，只保留白名单中的字段

**为什么这么做：**
- **防止 SQL 错误**：前端可能发送数据库中不存在的字段
- **防止 Mass Assignment 攻击**：恶意用户可能尝试修改敏感字段（如 `id`、`merchantId`）
- **数据一致性**：确保只有合法字段被写入数据库

**关键代码：**
```javascript
// config/fieldConfig.js - 定义字段白名单
const HOTEL_FIELDS = {
  basic: ['name', 'nameEn', 'city', 'address', 'star'],
  config: ['freeParking', 'freeWifi', 'breakfastType'],
  json: ['roomTypes', 'nearbyAttractions', 'discounts'],
  status: ['status', 'reviewNote'] // 仅管理员可修改
};

// 根据角色动态生成白名单
function getHotelAllowedFields(userRole) {
  const fields = [...HOTEL_FIELDS.basic, ...HOTEL_FIELDS.config, ...HOTEL_FIELDS.json];
  if (userRole === 'admin') {
    fields.push(...HOTEL_FIELDS.status);
  }
  return fields;
}

// routes/hotels.js - 使用白名单过滤
const allowedFields = getHotelAllowedFields(req.user.role);
const sanitizedUpdates = {};
for (const key of allowedFields) {
  if (req.body[key] !== undefined) {
    sanitizedUpdates[key] = req.body[key];
  }
}
const updatedHotel = await hotels.update(id, sanitizedUpdates);
```

**面试回答要点：**
1. **问题背景**：前端可能发送不存在的字段，导致 SQL 错误
2. **解决方案**：定义字段白名单，过滤请求数据
3. **安全性**：防止 Mass Assignment，保护敏感字段（如 `id`、`merchantId`）
4. **优化方向**：可以提取为工具函数、中间件或使用 Schema 验证库（Joi）

---

### 3.4 错误处理

**实现方式：**
- 所有路由使用 `try/catch` 包裹
- 统一返回格式：`{ message: '错误信息', error: '详细错误' }`
- 区分开发/生产环境，生产环境不暴露详细错误

**为什么这么做：**
- **用户体验**：返回友好的错误提示
- **安全性**：生产环境不暴露敏感信息（SQL错误、堆栈信息）
- **可维护性**：统一错误格式，便于前端处理

**关键代码：**
```javascript
router.put('/:id', auth, async (req, res) => {
  try {
    // ... 业务逻辑
  } catch (error) {
    console.error('错误详情:', error);
    const errorResponse = {
      message: '服务器错误',
      error: error.message
    };
    // 开发环境返回详细错误
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = {
        code: error.code,
        sqlState: error.sqlState,
        stack: error.stack
      };
    }
    res.status(500).json(errorResponse);
  }
});
```

---

### 3.5 中间件设计

**实现方式：**
- `auth.js`：JWT 认证中间件
- `cors`：跨域中间件
- `express.json()`：解析 JSON 请求体
- 请求日志中间件（开发环境）

**为什么这么做：**
- **职责分离**：每个中间件只处理一件事
- **可复用**：中间件可在多个路由中使用
- **可测试**：中间件可独立测试

**关键代码：**
```javascript
// server.js
app.use(cors());              // 跨域
app.use(express.json());      // 解析JSON
app.use((req, res, next) => { // 请求日志
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
```

---

## 四、数据库设计

### 4.1 表结构设计

#### 4.1.1 users 表（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) | 主键（UUID） |
| `username` | VARCHAR(50) | 用户名（唯一） |
| `password` | VARCHAR(255) | 密码（bcrypt加密） |
| `role` | VARCHAR(20) | 角色（merchant/admin） |
| `nickname` | VARCHAR(100) | 昵称 |
| `createdAt` | DATETIME | 创建时间 |
| `updatedAt` | DATETIME | 更新时间 |

**设计要点：**
- 使用 UUID 作为主键，避免自增ID的安全问题
- 密码字段足够长（255），支持 bcrypt 加密结果
- `role` 字段使用枚举值，便于权限控制

#### 4.1.2 hotels 表（酒店表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) | 主键 |
| `merchantId` | VARCHAR(36) | 商户ID（外键） |
| `name` | VARCHAR(200) | 中文名称 |
| `nameEn` | VARCHAR(200) | 英文名称 |
| `city` | VARCHAR(50) | 城市 |
| `address` | VARCHAR(500) | 地址 |
| `star` | INT | 星级（1-5） |
| `status` | VARCHAR(20) | 状态（pending/published/rejected/offline） |
| `reviewNote` | TEXT | 审核备注（拒绝原因） |
| `roomTypes` | JSON | 房型信息（JSON数组） |
| `nearbyAttractions` | JSON | 附近景点（JSON数组） |
| `discounts` | JSON | 优惠信息（JSON数组） |
| `customFields` | JSON | 自定义字段（JSON数组） |
| `createdAt` | DATETIME | 创建时间 |
| `updatedAt` | DATETIME | 更新时间 |

**设计要点：**
- **JSON 字段**：复杂可变结构（房型、周边信息）使用 JSON 存储，灵活且易于扩展
- **状态字段**：使用枚举值，便于状态流转和查询
- **外键关联**：`merchantId` 关联 `users` 表，确保数据一致性

**为什么使用 JSON 字段？**
- **灵活性**：不同酒店的房型、优惠信息结构可能不同
- **扩展性**：新增字段不需要修改表结构
- **性能**：MySQL 5.7+ 支持 JSON 索引和查询

#### 4.1.3 rooms 表（房型表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) | 主键 |
| `hotelId` | VARCHAR(36) | 酒店ID（外键） |
| `name` | VARCHAR(100) | 房型名称 |
| `price` | DECIMAL(10,2) | 价格 |
| `bedType` | VARCHAR(50) | 床型 |
| `capacity` | INT | 容纳人数 |
| `stock` | INT | 库存 |
| `images` | JSON | 图片列表 |
| `createdAt` | DATETIME | 创建时间 |
| `updatedAt` | DATETIME | 更新时间 |

**设计要点：**
- **外键关联**：`hotelId` 关联 `hotels` 表
- **价格字段**：使用 `DECIMAL` 类型，精确存储金额
- **库存字段**：用于订单库存管理

#### 4.1.4 orders 表（订单表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) | 主键 |
| `userId` | VARCHAR(36) | 用户ID |
| `hotelId` | VARCHAR(36) | 酒店ID |
| `roomId` | VARCHAR(36) | 房型ID |
| `checkIn` | DATE | 入住日期 |
| `checkOut` | DATE | 退房日期 |
| `nights` | INT | 入住晚数 |
| `totalPrice` | DECIMAL(10,2) | 总价 |
| `guestName` | VARCHAR(100) | 入住人姓名 |
| `guestPhone` | VARCHAR(20) | 入住人电话 |
| `status` | VARCHAR(20) | 订单状态（pending/confirmed/completed/cancelled） |
| `createdAt` | DATETIME | 创建时间 |
| `updatedAt` | DATETIME | 更新时间 |
| `cancelledAt` | DATETIME | 取消时间 |

**状态流转：**
```
pending（待确认） → confirmed（已确认） → completed（已完成）
                 ↓
              cancelled（已取消）
```

#### 4.1.5 comments 表（评论表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) | 主键 |
| `hotelId` | VARCHAR(36) | 酒店ID |
| `userId` | VARCHAR(36) | 用户ID |
| `rating` | INT | 评分（1-5） |
| `content` | TEXT | 评论内容 |
| `status` | VARCHAR(20) | 状态（pending/published/rejected/deleted） |
| `reviewNote` | TEXT | 审核备注 |
| `createdAt` | DATETIME | 创建时间 |
| `updatedAt` | DATETIME | 更新时间 |

---

### 4.2 数据库连接

#### 4.2.1 连接池配置

**实现方式：**
- 使用 `mysql2/promise` 创建连接池
- 配置连接数限制（`connectionLimit: 10`）
- 支持环境变量配置

**为什么这么做：**
- **性能优化**：连接池复用连接，避免频繁创建/销毁
- **资源控制**：限制最大连接数，防止数据库过载
- **配置灵活**：支持环境变量，便于不同环境部署

**关键代码：**
```javascript
// utils/db.js
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'hotel_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

#### 4.2.2 SQL 注入防护

**实现方式：**
- 使用参数化查询（Prepared Statements）
- 所有 SQL 使用 `?` 占位符，不拼接字符串

**为什么这么做：**
- **安全性**：参数化查询自动转义特殊字符，防止 SQL 注入
- **性能**：MySQL 可以缓存执行计划

**关键代码：**
```javascript
// ✅ 正确：使用参数化查询
const [rows] = await pool.execute(
  'SELECT * FROM hotels WHERE id = ?',
  [id]
);

// ❌ 错误：字符串拼接（存在SQL注入风险）
const sql = `SELECT * FROM hotels WHERE id = '${id}'`;
```

---

### 4.3 数据一致性

#### 4.3.1 事务处理

**实现方式：**
- 订单创建时使用事务
- 订单取消时回滚库存

**为什么这么做：**
- **数据一致性**：确保订单和库存同时更新，避免数据不一致
- **原子性**：要么全部成功，要么全部回滚

**关键代码：**
```javascript
// 订单创建（伪代码）
const connection = await pool.getConnection();
await connection.beginTransaction();
try {
  await connection.execute('INSERT INTO orders ...');
  await connection.execute('UPDATE rooms SET stock = stock - 1 WHERE id = ?', [roomId]);
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

---

## 五、服务器部署

### 5.1 环境配置

#### 5.1.1 环境变量

**实现方式：**
- 使用 `.env` 文件或系统环境变量
- 不同环境（开发/生产）使用不同配置

**配置项：**
```bash
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=hotel_db

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# 服务器配置
PORT=3001
NODE_ENV=development
```

**为什么这么做：**
- **安全性**：敏感信息（密码、密钥）不写死在代码中
- **灵活性**：不同环境使用不同配置
- **可维护性**：配置集中管理

#### 5.1.2 CORS 跨域配置

**实现方式：**
- 使用 `cors` 中间件
- 允许前端域名访问

**为什么这么做：**
- **前后端分离**：前端（localhost:3000）和后端（localhost:3001）不同端口
- **安全性**：只允许指定域名访问，防止跨站请求

**关键代码：**
```javascript
// server.js
app.use(cors()); // 开发环境允许所有来源
// 生产环境可配置具体域名
// app.use(cors({ origin: 'https://yourdomain.com' }));
```

---

### 5.2 静态资源

**实现方式：**
- 使用 `express.static` 提供静态文件服务
- 图片等资源存储在 `backend/public/` 目录

**为什么这么做：**
- **性能**：静态资源由 Express 直接提供，无需经过业务逻辑
- **安全性**：只暴露 `/static` 路径，其他路径不可访问

**关键代码：**
```javascript
// server.js
app.use('/static', express.static(path.join(__dirname, 'public')));
// 访问：http://localhost:3001/static/hotel.jpg
```

---

### 5.3 健康检查

**实现方式：**
- 提供 `/api/health` 接口
- 检查数据库连接状态

**为什么这么做：**
- **监控**：运维可以通过健康检查接口监控服务状态
- **负载均衡**：负载均衡器可以根据健康检查结果路由请求

**关键代码：**
```javascript
app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ status: 'ok', message: '服务运行中（MySQL存储）' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: '数据库连接失败' });
  }
});
```

---

## 六、核心业务流程

### 6.1 用户注册/登录流程

```
1. 用户填写注册信息（用户名、密码、角色）
   ↓
2. 后端验证用户名是否已存在
   ↓
3. 使用 bcrypt 加密密码
   ↓
4. 创建用户记录（status: pending）
   ↓
5. 返回成功信息

登录流程：
1. 用户提交用户名和密码
   ↓
2. 查询用户是否存在
   ↓
3. 使用 bcrypt.compare 验证密码
   ↓
4. 生成 JWT Token（包含 id、username、role）
   ↓
5. 返回 Token 和用户信息
```

### 6.2 酒店审核流程

```
1. 商户创建酒店（status: pending）
   ↓
2. 管理员查看待审核列表
   ↓
3. 管理员审核：
   - 通过：status → published，清除 reviewNote
   - 拒绝：status → rejected，设置 reviewNote（必填）
   ↓
4. 已发布的酒店可在移动端展示
   ↓
5. 管理员可以下线酒店（status → offline）
   ↓
6. 下线后可以恢复（status → published）
```

**关键代码：**
```javascript
// 审核通过
if (status === 'approved') {
  updateData.status = 'published';
  if (hotel.reviewNote) {
    updateData.reviewNote = null; // 清除拒绝原因
  }
}

// 审核拒绝
if (status === 'rejected') {
  if (!reviewNote) {
    return res.status(400).json({ message: '拒绝时必须填写原因' });
  }
  updateData.status = 'rejected';
  updateData.reviewNote = reviewNote;
}
```

### 6.3 订单创建流程

```
1. 用户选择酒店、房型、日期
   ↓
2. 前端计算总价和入住晚数
   ↓
3. 提交订单（POST /api/orders）
   ↓
4. 后端验证：
   - 房型是否存在
   - 库存是否充足
   - 日期是否有效
   ↓
5. 创建订单（status: pending）
   ↓
6. 商户确认订单（status: confirmed）
   ↓
7. 用户入住后完成订单（status: completed）
```

---

## 七、常见面试问题

### Q1: 为什么选择 MySQL 而不是 MongoDB？

**回答要点：**
1. **数据结构**：酒店、订单等数据是结构化数据，适合关系型数据库
2. **事务支持**：订单创建需要保证数据一致性，MySQL 支持事务
3. **查询性能**：复杂查询（如多条件筛选）在 MySQL 中性能更好
4. **团队熟悉度**：MySQL 更常见，团队更容易维护

**补充：**
- JSON 字段：MySQL 5.7+ 支持 JSON 类型，兼顾灵活性和关系型优势
- 如果未来需要全文搜索，可以考虑 Elasticsearch

---

### Q2: 如何保证数据安全？

**回答要点：**
1. **密码加密**：使用 bcrypt 加密，不可逆
2. **JWT Token**：使用签名防止篡改，设置过期时间
3. **字段白名单**：防止 Mass Assignment 攻击
4. **SQL 注入防护**：使用参数化查询
5. **权限控制**：基于角色的访问控制（RBAC）
6. **HTTPS**：生产环境使用 HTTPS 加密传输

---

### Q3: 如何处理高并发？

**回答要点：**
1. **连接池**：复用数据库连接，减少连接开销
2. **缓存**：使用 Redis 缓存热点数据（如酒店列表）
3. **CDN**：静态资源使用 CDN 加速
4. **负载均衡**：多台服务器负载均衡
5. **数据库优化**：添加索引，优化慢查询
6. **异步处理**：耗时操作（如发送邮件）使用消息队列

**当前项目优化方向：**
- 添加 Redis 缓存酒店列表
- 使用消息队列处理订单通知
- 数据库读写分离

---

### Q4: 如何设计 RESTful API？

**回答要点：**
1. **资源命名**：使用名词，如 `/api/hotels`、`/api/orders`
2. **HTTP 方法**：
   - GET：查询
   - POST：创建
   - PUT：更新（完整更新）
   - PATCH：更新（部分更新）
   - DELETE：删除
3. **状态码**：
   - 200：成功
   - 201：创建成功
   - 400：请求错误
   - 401：未授权
   - 403：无权限
   - 404：资源不存在
   - 500：服务器错误
4. **统一响应格式**：
   ```json
   {
     "message": "成功",
     "data": {...}
   }
   ```

**项目中的实现：**
```javascript
// GET /api/hotels - 获取酒店列表
// POST /api/hotels - 创建酒店
// GET /api/hotels/:id - 获取酒店详情
// PUT /api/hotels/:id - 更新酒店
// DELETE /api/hotels/:id - 删除酒店
// PUT /api/hotels/:id/review - 审核酒店（特殊操作）
```

---

### Q5: 前端如何实现权限控制？

**回答要点：**
1. **路由守卫**：根据角色判断是否可以访问页面
2. **菜单控制**：根据角色动态显示菜单
3. **按钮控制**：根据角色显示/隐藏操作按钮
4. **API 拦截**：401 错误自动跳转登录页

**项目中的实现：**
```javascript
// 1. 菜单控制
const menuItems = getMenuItems(isAdmin, navigate);

// 2. 按钮控制
{isAdmin && (
  <Button onClick={handleApprove}>审核通过</Button>
)}

// 3. API 拦截
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
  }
);
```

---

### Q6: 如何优化数据库查询性能？

**回答要点：**
1. **添加索引**：在常用查询字段上添加索引（如 `status`、`merchantId`）
2. **避免全表扫描**：使用 WHERE 条件过滤
3. **分页查询**：避免一次性查询大量数据
4. **避免 N+1 查询**：使用 JOIN 或批量查询
5. **使用连接池**：复用连接，减少连接开销

**项目中的优化：**
```javascript
// ✅ 添加索引
CREATE INDEX idx_status ON hotels(status);
CREATE INDEX idx_merchantId ON hotels(merchantId);

// ✅ 分页查询
const start = (page - 1) * limit;
const paginatedList = hotelList.slice(start, start + limit);

// ✅ 使用连接池
const pool = mysql.createPool({ connectionLimit: 10 });
```

---

### Q7: 如何处理文件上传？

**回答要点：**
1. **使用 multer 中间件**：处理 multipart/form-data
2. **文件验证**：检查文件类型、大小
3. **文件存储**：本地存储或云存储（OSS）
4. **文件路径**：返回文件访问 URL

**实现示例：**
```javascript
const multer = require('multer');
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片'));
    }
  }
});

router.post('/upload', upload.single('image'), (req, res) => {
  const fileUrl = `/static/${req.file.filename}`;
  res.json({ url: fileUrl });
});
```

---

### Q8: 如何实现数据校验？

**回答要点：**
1. **前端校验**：使用 Ant Design Form 校验
2. **后端校验**：使用 Joi 或 express-validator
3. **数据库约束**：NOT NULL、UNIQUE、CHECK

**项目中的实现：**
```javascript
// 前端校验（Ant Design）
<Form.Item
  name="name"
  rules={[
    { required: true, message: '请输入酒店名称' },
    { max: 200, message: '名称不能超过200字符' }
  ]}
>
  <Input />
</Form.Item>

// 后端校验（手动）
if (!name || name.length > 200) {
  return res.status(400).json({ message: '酒店名称无效' });
}
```

---

## 八、项目亮点总结

### 8.1 技术亮点

1. **通用存储封装**：MySqlStore 类统一 CRUD 操作，减少重复代码
2. **字段白名单过滤**：防止 SQL 错误和 Mass Assignment 攻击
3. **角色权限控制**：基于 JWT 的 RBAC 权限系统
4. **JSON 字段设计**：灵活存储复杂数据结构
5. **错误处理机制**：统一的错误处理和日志记录

### 8.2 业务亮点

1. **审核流程**：完整的酒店审核、发布、下线流程
2. **角色分离**：商户和管理员职责清晰
3. **状态管理**：订单、酒店、评论都有完整的状态流转
4. **数据展示**：管理端支持详情查看、筛选、分页

### 8.3 可扩展性

1. **模块化设计**：路由、中间件、工具函数分离
2. **配置化**：字段白名单、菜单配置可配置化
3. **跨平台**：移动端使用 Taro，可扩展小程序版本
4. **数据库设计**：JSON 字段支持灵活扩展

---

## 九、项目改进方向

### 9.1 性能优化

1. **添加 Redis 缓存**：缓存热点数据（酒店列表、用户信息）
2. **数据库索引优化**：在常用查询字段上添加索引
3. **CDN 加速**：静态资源使用 CDN
4. **图片压缩**：上传图片自动压缩

### 9.2 功能扩展

1. **全文搜索**：使用 Elasticsearch 实现酒店搜索
2. **消息通知**：订单状态变更、审核结果通知
3. **数据统计**：更详细的运营数据统计
4. **文件上传**：支持图片上传功能

### 9.3 安全性增强

1. **HTTPS**：生产环境使用 HTTPS 加密传输
2. **Rate Limiting**：添加接口限流，防止暴力破解
3. **输入验证**：使用 Joi 等库进行严格的输入验证
4. **XSS 防护**：对用户输入进行转义处理
5. **CSRF 防护**：添加 CSRF Token 验证

---

## 十、面试回答技巧

### 10.1 STAR 法则回答项目问题

**S (Situation)**：项目背景
- "这是一个酒店预订平台，包含管理端和移动端两个前端应用"

**T (Task)**：任务/目标
- "我负责后端 API 开发和数据库设计"

**A (Action)**：采取的行动
- "我设计了分层架构，封装了通用的 MySqlStore 类，实现了 JWT 认证和字段白名单过滤"

**R (Result)**：结果/成果
- "最终实现了完整的酒店管理、审核、订单等功能，代码复用率高，易于维护"

### 10.2 常见问题回答模板

#### 问题：你在项目中遇到的最大技术难点是什么？

**回答模板：**
1. **描述问题**："在实现酒店更新接口时，前端可能发送数据库中不存在的字段，导致 SQL 错误"
2. **分析原因**："这是因为前端可能包含临时字段、计算字段等，直接写入数据库会报错"
3. **解决方案**："我实现了字段白名单过滤机制，只允许更新白名单中的字段"
4. **优化思考**："未来可以考虑使用 Joi 等 Schema 验证库，同时实现字段过滤和数据验证"

#### 问题：如何保证代码质量？

**回答模板：**
1. **代码规范**：统一的命名规范、文件组织方式
2. **分层架构**：路由、中间件、工具层分离，职责清晰
3. **错误处理**：统一的错误处理和日志记录
4. **代码复用**：封装通用工具类（MySqlStore），减少重复代码
5. **安全性**：密码加密、JWT 认证、字段白名单、SQL 注入防护

### 10.3 技术深度展示

#### 展示对数据库的理解

**可以说的点：**
- "我使用 MySQL 5.7+ 的 JSON 字段存储复杂结构，兼顾灵活性和关系型优势"
- "通过连接池复用连接，减少连接开销，提升性能"
- "使用参数化查询防止 SQL 注入，所有 SQL 都使用 `?` 占位符"
- "在常用查询字段上添加索引，优化查询性能"

#### 展示对安全的理解

**可以说的点：**
- "密码使用 bcrypt 加密，不可逆，即使数据库泄露也无法还原"
- "JWT Token 包含签名，防止篡改，设置过期时间保证安全"
- "字段白名单过滤防止 Mass Assignment 攻击，保护敏感字段"
- "参数化查询防止 SQL 注入，这是最基本但最重要的安全措施"

#### 展示对架构的理解

**可以说的点：**
- "采用分层架构，路由层只处理 HTTP 请求，业务逻辑在工具层"
- "封装通用的 MySqlStore 类，所有表使用相同的 CRUD 接口"
- "中间件模式实现认证、跨域等功能，职责分离，易于测试"
- "配置化设计，字段白名单、菜单配置都可以灵活调整"

---

## 十一、项目演示要点

### 11.1 演示流程建议

1. **项目概述**（1分钟）
   - 介绍项目背景、技术栈、架构设计

2. **核心功能演示**（3-5分钟）
   - 用户注册/登录（展示 JWT 认证）
   - 酒店创建/审核流程（展示权限控制）
   - 移动端酒店列表/详情（展示前后端交互）

3. **技术亮点讲解**（2-3分钟）
   - 通用存储封装（MySqlStore）
   - 字段白名单过滤
   - 角色权限控制

4. **问题回答**（根据时间）

### 11.2 演示注意事项

1. **提前准备**：确保数据库有测试数据，功能正常运行
2. **突出重点**：重点展示技术亮点，不要只演示功能
3. **准备问题**：提前思考可能的问题，准备回答
4. **代码展示**：可以准备关键代码片段，展示技术实现

---

## 十二、补充知识点

### 12.1 Node.js 相关

#### Event Loop
- **单线程**：Node.js 是单线程的，通过事件循环处理异步操作
- **非阻塞 I/O**：异步 I/O 不会阻塞主线程，适合高并发场景
- **适用场景**：I/O 密集型应用（如 API 服务），不适合 CPU 密集型任务

#### 中间件机制
- **执行顺序**：中间件按注册顺序执行
- **next()**：调用 `next()` 继续执行下一个中间件
- **错误处理**：可以使用错误处理中间件统一处理错误

### 12.2 Express 相关

#### 路由设计
- **RESTful**：使用标准 HTTP 方法（GET、POST、PUT、DELETE）
- **资源命名**：使用名词，如 `/api/hotels`、`/api/orders`
- **嵌套资源**：如 `/api/hotels/:id/rooms`

#### 请求处理流程
```
请求 → 中间件（CORS、JSON解析） → 路由中间件（认证） → 路由处理函数 → 响应
```

### 12.3 MySQL 相关

#### JSON 字段使用
- **存储**：使用 `JSON.stringify()` 将对象转为 JSON 字符串
- **查询**：使用 `JSON_EXTRACT()` 或 `->` 操作符查询 JSON 字段
- **索引**：MySQL 5.7+ 支持 JSON 字段索引

#### 事务处理
- **ACID 特性**：原子性、一致性、隔离性、持久性
- **使用场景**：订单创建、库存扣减等需要保证数据一致性的操作
- **注意事项**：及时提交或回滚，避免长时间占用连接

### 12.4 React 相关

#### Hooks 使用
- **useState**：管理组件状态
- **useEffect**：处理副作用（数据获取、订阅等）
- **useContext**：跨组件共享状态（可选）

#### 性能优化
- **避免不必要的渲染**：使用 `React.memo`、`useMemo`、`useCallback`
- **代码分割**：使用 `React.lazy` 和 `Suspense` 实现按需加载
- **虚拟列表**：长列表使用虚拟滚动

### 12.5 前后端交互

#### API 设计原则
- **统一响应格式**：`{ message: '...', data: {...} }`
- **状态码使用**：200（成功）、400（请求错误）、401（未授权）、500（服务器错误）
- **错误处理**：前端统一处理错误，显示友好提示

#### 跨域问题
- **原因**：浏览器的同源策略限制
- **解决方案**：后端使用 CORS 中间件允许跨域
- **生产环境**：配置具体的允许域名，不要使用 `*`

---

## 十三、项目总结

### 13.1 技术收获

1. **全栈开发能力**：掌握了前后端分离的开发模式
2. **数据库设计**：学会了设计合理的表结构和关系
3. **安全实践**：了解了常见的安全问题和防护措施
4. **架构设计**：学会了分层架构和代码组织方式

### 13.2 项目价值

1. **业务理解**：理解了酒店预订业务的完整流程
2. **问题解决**：学会了分析和解决实际开发中的问题
3. **代码质量**：培养了良好的编码习惯和规范
4. **可扩展性**：考虑了项目的可维护性和可扩展性

### 13.3 未来规划

1. **性能优化**：添加 Redis 缓存、CDN 加速
2. **功能扩展**：实现支付、消息通知等功能
3. **技术升级**：考虑使用 TypeScript、GraphQL 等新技术
4. **部署优化**：使用 Docker、K8s 等容器化部署

---

**文档版本**：v1.0  
**最后更新**：2024年  
**维护者**：项目开发团队