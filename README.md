# 易宿酒店预订平台

> 第一天项目初始化完成
> GitHub: https://github.com/BKBKBbbbb/XC-PROJECT

## 项目结构

```
XC-PROJECT/
├── backend/           # 后端服务 (Node.js + Express + JSON文件存储)
│   ├── config/        # 配置文件
│   ├── middleware/    # 中间件（JWT认证）
│   ├── models/        # 数据模型（User, Hotel, Room, Order）
│   ├── routes/        # API路由
│   ├── utils/         # 工具（JSON存储）
│   └── server.js      # 入口文件
│
├── mobile/            # 移动端 (Taro + React)
│   └── src/
│       ├── pages/     # 页面（首页、酒店列表、酒店详情）
│       ├── components/# 组件
│       ├── utils/     # 工具（API请求）
│       └── styles/    # 样式
│
└── admin/            # PC管理端 (React + Ant Design)
    └── src/
        ├── pages/    # 页面（登录、仪表盘、酒店管理、评论管理）
        └── components/# 组件
```

## 快速启动

### 1. 启动后端

```bash
cd backend
npm start
# 服务运行在 http://localhost:3001
```

### 2. 启动移动端

```bash
cd mobile
npm run dev:h5
# 移动端运行在 http://localhost:10086
```

### 3. 启动PC端

```bash
cd admin
npm start
# PC端运行在 http://localhost:3000
```

## API 接口文档

### 1. 用户模块 `/api/users`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /register | 注册（支持 role: merchant/admin） | 否 |
| POST | /login | 登录 | 否 |
| GET | /me | 获取当前用户信息 | 是 |

**注册示例：**
```json
POST /api/users/register
{
  "username": "hotel001",
  "password": "123456",
  "role": "merchant"  // merchant(商户) 或 admin(管理员)
}
```

**登录示例：**
```json
POST /api/users/login
{
  "username": "hotel001",
  "password": "123456"
}
```

---

### 2. 酒店模块 `/api/hotels`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | / | 酒店列表（公开） | 否 |
| GET | /?city=北京 | 按城市筛选 | 否 |
| GET | /?star=5 | 按星级筛选 | 否 |
| GET | /?minPrice=200&maxPrice=1000 | 按价格筛选 | 否 |
| GET | /?keyword=希尔顿 | 关键字搜索 | 否 |
| GET | /:id | 酒店详情（含房型和最低价） | 否 |
| POST | / | 创建酒店 | 商户 |
| PUT | /:id | 更新酒店 | 商户/管理员 |
| DELETE | /:id | 删除酒店 | 商户/管理员 |
| GET | /merchant/my | 商户酒店列表 | 商户 |
| GET | /admin/all | 管理员查看所有酒店（含待审核） | 管理员 |
| PUT | /:id/review | 审核酒店（通过/不通过） | 管理员 |
| PUT | /:id/publish | 发布酒店（上线） | 管理员 |
| PUT | /:id/offline | 下线酒店 | 商户/管理员 |

**酒店列表筛选参数：**
- `city` - 城市名称
- `star` - 酒店星级（1-5）
- `minPrice` - 最低价格
- `maxPrice` - 最高价格
- `keyword` - 关键字（酒店名/城市/地址）
- `page` - 页码（默认1）
- `limit` - 每页数量（默认10）

---

### 3. 房型模块 `/api/rooms`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | / | 房间列表 | 否 |
| GET | /?hotelId=xxx | 按酒店筛选 | 否 |
| GET | /:id | 房间详情 | 否 |
| POST | / | 创建房间 | 商户 |
| PUT | /:id | 更新房间 | 商户 |
| DELETE | /:id | 删除房间 | 商户 |

**创建房间示例：**
```json
POST /api/rooms
{
  "hotelId": "酒店ID",
  "name": "豪华大床房",
  "price": 599,
  "bedType": "大床",
  "capacity": 2,
  "stock": 10,
  "images": []
}
```

---

### 4. 订单模块 `/api/orders`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | / | 创建订单 | 可选 |
| GET | /?type=user | 用户订单列表 | 用户 |
| GET | /?type=merchant | 商户订单列表 | 商户 |
| GET | /:id | 订单详情 | 是 |
| PUT | /:id | 更新订单状态 | 商户/管理员 |
| POST | /:id/cancel | 取消订单 | 用户 |

**创建订单示例：**
```json
POST /api/orders
{
  "hotelId": "酒店ID",
  "roomId": "房间ID",
  "checkIn": "2026-03-01",
  "checkOut": "2026-03-03",
  "nights": 2,
  "guestName": "张三",
  "guestPhone": "13800138000",
  "totalPrice": 1198
}
```

**订单状态流转：**
- `pending` (待确认) → `confirmed` (已确认) / `cancelled` (已取消)
- `confirmed` (已确认) → `completed` (已完成) / `cancelled` (已取消)

---

## 功能清单

### 后端
- [x] 用户注册/登录（JWT认证）
- [x] 支持角色选择（商户/管理员）
- [x] 酒店CRUD接口
- [x] 酒店审核功能
- [x] 酒店发布/下线
- [x] 房型管理
- [x] 订单管理

### 移动端
- [x] 首页（Banner、快捷入口、热门酒店）
- [x] 酒店列表（城市筛选）
- [x] 酒店详情

### PC管理端
- [x] 登录页面
- [x] 仪表盘
- [x] 酒店管理（增删改查）
- [x] 评论管理

## 注意事项

1. **无需 MongoDB** - 使用 JSON 文件存储数据
2. **首次使用请先注册用户** - 角色选择 merchant(商户) 或 admin(管理员)
3. 商户登录后可创建酒店和房间
4. 管理员审核通过后酒店才能发布上线

## 默认账号

首次注册后即可使用，注册时选择角色：
- **商户** (merchant) - 可以管理自己的酒店
- **管理员** (admin) - 可以审核和发布所有酒店
