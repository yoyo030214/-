# 农业应用后端API服务

这是一个基于Express和Sequelize的农业应用后端API服务，使用MariaDB作为数据库。

## 功能特性

- 用户认证与授权（注册、登录、JWT认证）
- 农产品管理（增删改查）
- 订单管理系统
- 农业政策信息服务
- 天气信息查询服务

## 环境要求

- Node.js 12.x 或更高版本
- MariaDB 10.x 或更高版本
- Docker 和 Docker Compose (可选，推荐)

## 安装与运行

### 方式一：使用Docker (推荐)

1. 确保已安装Docker和Docker Compose

2. 克隆项目代码

3. 运行部署脚本
```bash
cd docker-backend
chmod +x docker-start.sh
./docker-start.sh
```

或者手动执行Docker Compose命令：
```bash
docker-compose up -d
```

服务启动后:
- API服务将在 http://localhost:5000 上运行
- MariaDB数据库将在端口3307上运行

### 方式二：常规部署

1. 克隆项目代码

2. 安装依赖
```bash
cd docker-backend
npm install
```

3. 配置环境变量
创建`.env`文件，参考`.env.example`配置数据库连接信息

4. 运行服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 数据库连接

### 使用Docker方式部署

数据库连接信息:
- 主机: localhost
- 端口: 3307
- 用户名: root
- 密码: lol110606YY
- 数据库名: agricultural_app

### 使用SSH隧道连接远程数据库

1. 建立SSH隧道:
```bash
ssh -L 3307:localhost:3307 Administrator@服务器公网IP
```

2. 然后连接到数据库:
```bash
mysql -h 127.0.0.1 -P 3307 -u root -plol110606YY
```

或使用数据库管理工具(DBeaver、Navicat等)通过SSH隧道连接。

## API文档

### 用户相关

- POST `/api/user/register` - 用户注册
- POST `/api/user/login` - 用户登录
- GET `/api/user/profile` - 获取用户资料
- PUT `/api/user/profile` - 更新用户资料

### 产品相关

- GET `/api/products` - 获取产品列表
- GET `/api/products/:id` - 获取产品详情
- POST `/api/products` - 创建新产品
- PUT `/api/products/:id` - 更新产品
- DELETE `/api/products/:id` - 删除产品

### 订单相关

- POST `/api/orders` - 创建订单
- GET `/api/orders/user` - 获取用户订单
- GET `/api/orders/:id` - 获取订单详情
- PUT `/api/orders/:id/status` - 更新订单状态
- PUT `/api/orders/:id/cancel` - 取消订单

### 政策相关

- GET `/api/policies` - 获取政策列表
- GET `/api/policies/:id` - 获取政策详情
- GET `/api/policies/categories/list` - 获取政策分类
- POST `/api/policies/:id/favorite` - 收藏政策
- DELETE `/api/policies/:id/favorite` - 取消收藏
- GET `/api/policies/favorites/user` - 获取用户收藏的政策
- GET `/api/policies/:id/favorite/status` - 获取收藏状态

### 天气相关

- GET `/api/weather/current` - 获取当前天气
- GET `/api/weather/forecast` - 获取天气预报
- GET `/api/weather/agricultural-index` - 获取农业指数

## 数据库初始化

服务首次启动时会自动初始化数据库并创建必要的表结构。同时会自动加载种子数据。

## 开发指南

本项目使用以下技术栈:
- Express - Web框架
- Sequelize - ORM工具
- MariaDB - 数据库
- JWT - 身份认证
- Axios - HTTP客户端 