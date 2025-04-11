const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const sequelize = require('./config/database');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入路由
const authRoutes = require('./routes/authRoutes');
const { router: merchantAuthRoutes } = require('./routes/merchantAuthRoutes');
const customerRoutes = require('./routes/customerRoutes');
const wxAuthRoutes = require('./routes/wxAuthRoutes');
const wxProductRoutes = require('./routes/wxProductRoutes');
const wxOrderRoutes = require('./routes/wxOrderRoutes');
const wxShopRoutes = require('./routes/wxShopRoutes');
const wxCartRoutes = require('./routes/wxCartRoutes');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 9000;

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));
app.use(express.static(path.join(__dirname, '../public')));

// API路由
app.use('/api/merchant/auth', authRoutes);
app.use('/api/merchant', merchantAuthRoutes);
app.use('/api/merchant/customers', customerRoutes);
app.use('/api/wx/auth', wxAuthRoutes);
app.use('/api/wx/products', wxProductRoutes);
app.use('/api/wx/orders', wxOrderRoutes);
app.use('/api/wx/shops', wxShopRoutes);
app.use('/api/wx/cart', wxCartRoutes);

// 添加根路由重定向到登录页面
app.get('/', (req, res) => {
  res.redirect('/admin/login.html');
});

// 测试路由
app.get('/plain', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send('服务器正常运行');
});

app.get('/test', (req, res) => {
  res.json({ 
    message: '服务器正常运行',
    version: '1.0.1',
    timestamp: new Date().toISOString()
  });
});

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP',
    timestamp: new Date().toISOString(),
    database: sequelize.authenticate().then(() => true).catch(() => false) ? 'connected' : 'disconnected'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    code: 'SERVER_ERROR'
  });
});

// 404处理
app.use((req, res) => {
  console.log(`404 - 未找到: ${req.url}`);
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    code: 'NOT_FOUND'
  });
});

// 数据库同步
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('数据库同步完成');
  } catch (err) {
    console.error('数据库同步失败:', err);
    process.exit(1);
  }
};

// 启动服务器
const startServer = async () => {
  try {
    // 先同步数据库
    await syncDatabase();
    
    // 然后启动服务器
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log(`静态文件路径: ${path.join(__dirname, '../public')}`);
      console.log(`管理后台路径: ${path.join(__dirname, '../public/admin')}`);
      console.log(`尝试访问: http://localhost:${PORT}/admin/login.html`);
    });

    // 添加服务器错误处理
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用，请尝试其他端口`);
      } else {
        console.error('服务器错误:', error);
      }
      process.exit(1);
    });
    
    // 处理进程退出
    process.on('SIGTERM', () => {
      console.log('收到SIGTERM信号，优雅关闭服务器');
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

// 启动应用
startServer(); 