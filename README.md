# 🛍️ 楚农优品小程序

<div align="center">
  <img src="https://img.shields.io/badge/微信小程序-07C160?style=for-the-badge&logo=wechat&logoColor=white" alt="微信小程序">
  <img src="https://img.shields.io/badge/Spring Boot-6DB33F?style=for-the-badge&logo=spring&logoColor=white" alt="Spring Boot">
  <img src="https://img.shields.io/badge/云开发-07C160?style=for-the-badge&logo=wechat&logoColor=white" alt="云开发">
  <img src="https://img.shields.io/badge/AI助手-FF6B6B?style=for-the-badge&logo=openai&logoColor=white" alt="AI助手">
</div>

## 🌟 项目简介

楚农优品是一个专注于农产品销售的微信小程序，集成了 AI 智能助手功能，为用户提供智能化的购物体验。通过语音交互、智能推荐等功能，让农产品购买更加便捷、智能。

## 🚀 主要功能

### 🛒 商城功能
- 📱 商品展示与分类
- 🛍️ 智能购物车
- 💳 微信支付
- 📦 订单管理
- 👤 用户中心
- 📍 地址管理

### 🤖 AI 智能助手
- 🗣️ 语音交互
- 🌐 多语言支持
- ❤️ 情感分析
- 🎯 个性化推荐
- 💬 智能客服

### ☁️ 云开发功能
- ⚡ 云函数
- 💾 云数据库
- 📁 云存储
- 🔄 云调用

## 🛠️ 技术架构

### 前端技术栈
- 微信小程序原生开发
- WXML + WXSS
- JavaScript/ES6+
- 组件化开发

### 后端技术栈
- Spring Boot
- Spring Cloud
- MySQL
- MongoDB
- Redis

### AI 服务
- Deepseek API
- 语音识别与合成
- 情感分析
- 智能推荐

## 📁 项目结构

```
├── miniprogram/              # 小程序前端代码
│   ├── pages/               # 页面文件
│   ├── components/          # 自定义组件
│   ├── services/            # 服务层
│   ├── utils/               # 工具函数
│   ├── styles/              # 样式文件
│   └── images/              # 图片资源
├── cloudfunctions/          # 云函数
│   ├── getPolicies/        # 获取政策信息
│   └── voiceAPI/           # 语音处理
├── backend/                 # 后端服务
│   ├── cloud-server/       # 云服务器代码
│   └── docker-backend/     # Docker 部署配置
├── docs/                    # 项目文档
└── scripts/                 # 部署脚本
```

## 🚀 快速开始

### 环境要求
- 微信开发者工具
- Node.js >= 12.0.0
- JDK >= 1.8
- Maven >= 3.6
- Docker >= 19.03

### 开发部署
```bash
# 克隆项目
git clone https://github.com/yoyo030214/-.git

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 编译后端
cd backend/cloud-server
mvn clean package

# 运行服务
java -jar target/cloud-server.jar
```

## 🔧 配置说明

### 小程序配置
在 `project.config.json` 中配置：
- AppID
- 项目名称
- 服务器域名

### 云开发配置
在云开发控制台配置：
- 环境 ID
- 云函数配置
- 数据库权限

### 后端配置
在 `application.yml` 中配置：
- 数据库连接
- Redis 配置
- 微信支付配置
- AI 服务配置

## 📱 功能展示

### 商城功能
- 首页展示
  - 商品分类导航
  - 热门商品推荐
  - 促销活动展示
- 商品详情
  - 商品信息展示
  - 规格选择
  - 商品评价
- 购物车
  - 商品管理
  - 价格计算
  - 结算功能
- 订单管理
  - 订单列表
  - 订单详情
  - 物流跟踪

### AI 助手功能
- 智能对话
  - 文本对话
  - 语音交互
  - 多语言支持
- 商品推荐
  - 个性化推荐
  - 智能搜索
  - 商品比价
- 客服支持
  - 智能问答
  - 问题分类
  - 自动回复

## 📝 注意事项

1. 首次运行需要配置相关密钥和证书
2. 支付功能需要在真机上测试
3. 部分功能需要用户授权
4. 云开发环境需要正确配置

## 🤝 参与贡献

1. Fork 项目
2. 创建特性分支
3. 提交代码
4. 发起 Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

如有问题，请联系项目维护者。 