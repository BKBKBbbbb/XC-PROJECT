# 易宿酒店预订平台

> 酒店预订全栈课程设计项目（Node.js + MySQL + Taro + React）  
> GitHub: `https://github.com/BKBKBbbbb/XC-PROJECT`

## 项目结构（结构清晰，分层明确）

```bash
XC-PROJECT/
├── backend/                 # 后端服务 (Node.js + Express + MySQL)
│   ├── config/              # 配置文件（JWT、环境变量等）
│   ├── middleware/          # 中间件（JWT 认证等）
│   ├── routes/              # 业务路由
│   │   ├── users.js         # 用户注册/登录/当前用户
│   │   ├── hotels.js        # 酒店增删改查、审核、发布
│   │   ├── rooms.js         # 房型管理
│   │   ├── orders.js        # 订单管理
│   │   └── comments.js      # 评论审核管理
│   ├── utils/
│   │   ├── db.js            # MySQL 连接池配置
│   │   └── store.js         # 通用 MySqlStore，封装 CRUD / 分页 / 统计
│   └── server.js            # Express 入口文件，挂载路由和中间件
│
├── mobile/                  # 移动端 H5 (Taro + React)
│   └── src/
│       ├── pages/
│       │   ├── index/       # 首页
│       │   ├── list/        # 酒店列表页（支持城市、价格、星级等筛选）
│       │   └── detail/      # 酒店详情页（房型列表、评论入口等）
│       ├── utils/
│       │   ├── api.js       # 通用请求封装（携带 JWT Token）
│       │   └── hotel.js     # 酒店相关通用逻辑（评分文案/最低价/晚数计算等）
│       └── assets/          # 静态资源（banner、酒店示意图）
│
└── admin/                   # PC 管理端 (React + Ant Design)
    └── src/
        ├── pages/           # 页面（登录、仪表盘、酒店管理、评论管理等）
        ├── components/      # 通用组件（布局、统计卡片等）
        └── utils/           # 管理端 API、菜单配置等
```

## 数据库与表结构设计（MySQL + 通用存储封装）

后端通过 `utils/store.js` 定义了一个通用的 `MySqlStore` 类，对应以下业务表：`users`、`hotels`、`rooms`、`orders`、`comments`，统一使用 `id` 作为主键，并自动维护 `createdAt` / `updatedAt` 字段，保证各表结构与时间线一致。

- **users 表（用户/角色）**
  - 字段示例：`id`, `username`, `password`, `role`(merchant/admin), `nickname`, `createdAt`, `updatedAt`
  - 特点：登录使用 `username + password`，密码统一使用 `bcrypt` 加密，JWT 中只存 `id/username/role`

- **hotels 表（酒店主体信息）**
  - 字段示例：`id`, `merchantId`, `name`, `nameEn`, `city`, `address`, `star`, `openDate`, `phone`, `email`, `contactPerson`, `description`，以及若干 JSON 字段：`roomTypes`, `nearbyAttractions`, `nearbyTransport`, `nearbyMalls`, `discounts`, `customFields` 等
  - 状态字段：`status`（draft/pending/published/rejected/offline）、`reviewNote`
  - 设计思路：将复杂可变结构（房型、周边信息、营销配置）统一存储为 JSON，结合 `roomTypes`/`rooms` 两种粒度兼容不同阶段的数据

- **rooms 表（房型信息）**
  - 字段示例：`id`, `hotelId`, `name`, `price`, `bedType`, `capacity`, `stock`, `images`, `createdAt`, `updatedAt`
  - 与 `hotels` 通过 `hotelId` 关联，房型价格用于列表和详情页的「最低价」计算

- **orders 表（订单信息）**
  - 字段示例：`id`, `userId`, `hotelId`, `roomId`, `checkIn`, `checkOut`, `nights`, `totalPrice`, `guestName`, `guestPhone`, `status`, `createdAt`, `updatedAt`, `cancelledAt`
  - 状态流转：`pending → confirmed → completed / cancelled`，并在取消时自动回滚房型库存

- **comments 表（评论与审核）**
  - 字段示例：`id`, `hotelId`, `userId`, `rating`, `content`, `status`, `reviewNote`, `createdAt`, `updatedAt`
  - 状态设计：`pending / published / rejected / deleted`，支持管理员审核、虚拟删除和恢复

通过统一的 `MySqlStore` 封装，所有业务表都使用相同的 CRUD 逻辑和错误处理，既减少重复代码，又保证了存储结构的**一致性和可维护性**。

## 快速启动

### 1. 准备 MySQL 数据库

1. 创建数据库（默认名为 `hotel_db`，可按需修改）：
   - `CREATE DATABASE hotel_db DEFAULT CHARSET utf8mb4;`
2. 在 `.env` 或系统环境变量中配置数据库信息（也可以直接修改 `backend/utils/db.js`）：
   - `DB_HOST=localhost`
   - `DB_USER=root`
   - `DB_PASSWORD=123456`
   - `DB_NAME=hotel_db`

> 表结构可根据上述字段设计建表 SQL，字段设计与业务代码完全对应。

### 2. 启动后端

```bash
cd backend
npm install
npm start
# 服务运行在 http://localhost:3001
```

### 3. 启动移动端（Taro H5）

```bash
cd mobile
npm install
npm run dev:h5
# 移动端运行在 http://localhost:10086
```

### 4. 启动 PC 管理端

```bash
cd admin
npm install
npm start
# PC 端运行在 http://localhost:3000
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

1. 当前版本已使用 **MySQL 持久化存储**，不再依赖 MongoDB/本地 JSON 文件。
2. 首次使用请先在管理端/后端接口注册用户，角色选择 `merchant`(商户) 或 `admin`(管理员)。
3. 商户登录后可创建酒店和房间；房型价格将影响前台列表和详情页展示的「最低价」。 
4. 管理员审核通过并发布后，酒店才能在移动端列表/详情中正常展示。

## 编码规范说明

- **通用约定**
  - 全项目统一使用 ES6+ 语法，前端采用 React 函数组件 + Hooks。
  - 变量/函数名使用小驼峰（`camelCase`），组件名使用大驼峰（`PascalCase`）。
  - 接口返回统一使用 JSON，对外暴露清晰、稳定的字段结构。

- **后端（Node.js + Express）**
  - 每个业务模块单独一个路由文件（`users.js` / `hotels.js` / `rooms.js` / `orders.js` / `comments.js`）。
  - 与数据库交互统一通过 `utils/store.js` 中的 `MySqlStore`，避免在路由里直接写 SQL。
  - 所有接口都使用 `try/catch` 包裹，统一返回 `message` 字段描述错误信息。
  - 使用 `middleware/auth.js` 中间件统一处理 JWT 鉴权与角色权限判断。

- **移动端（Taro + React）**
  - 网络请求统一通过 `src/utils/api.js` 封装，自动附带 `Authorization: Bearer <token>`。
  - 酒店通用逻辑（评分文案、最低价计算、晚数计算等）抽离到 `src/utils/hotel.js`，在 `list` / `detail` 两个页面复用，减少重复代码。
  - 页面文件内部按「常量配置 → 工具函数 → 组件定义 → 默认导出组件」顺序组织，便于阅读。

- **PC 管理端（React + Ant Design）**
  - 通用布局和统计卡片抽象为 `src/components/common` 与 `src/components/layout`，页面只关注业务逻辑。
  - 左侧菜单配置统一在 `src/utils/menuConfig.js` 中维护，便于新增/调整页面。

## 默认账号

首次注册后即可使用，注册时选择角色：
- **商户** (merchant) - 可以管理自己的酒店
- **管理员** (admin) - 可以审核和发布所有酒店
