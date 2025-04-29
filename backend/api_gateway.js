const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');

// 环境变量配置
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SERVICE_URL = process.env.SERVICE_URL || 'http://localhost:8000';

// 安全性增强中间件
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 全局速率限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 15分钟内限制100次请求
  standardHeaders: true,
  message: { error: '请求过多，请稍后再试' }
});

app.use('/api/', apiLimiter);

// 身份验证中间件
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: '无效的访问令牌' });
      }
      
      req.user = user;
      next();
    });
  } else {
    // 检查是否是公共路由
    const publicPaths = ['/api/login', '/api/register', '/api/products/public'];
    const isPublicPath = publicPaths.some(path => req.path.startsWith(path));
    
    if (isPublicPath) {
      next();
    } else {
      res.status(401).json({ error: '需要身份验证' });
    }
  }
};

// 登录路由（直接处理而不是代理）
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 调用认证服务
    const response = await fetch(`${SERVICE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { id: data.user.id, username: data.user.username, role: data.user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      status: 'success',
      message: '登录成功',
      token,
      user: {
        username: data.user.username,
        role: data.user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 注册路由
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // 调用认证服务
    const response = await fetch(`${SERVICE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    res.json({
      status: 'success',
      message: '注册成功',
      user: data.user
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 认证API路由
app.use('/api/auth', authenticateJWT, createProxyMiddleware({
  target: SERVICE_URL,
  pathRewrite: { '^/api/auth': '/auth' },
  changeOrigin: true
}));

// 商品API路由
app.use('/api/products', createProxyMiddleware({
  target: SERVICE_URL,
  pathRewrite: { '^/api/products': '/products' },
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // 添加认证信息到后端请求
    if (req.user) {
      proxyReq.setHeader('X-User-ID', req.user.id);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  }
}));

// 受保护的API路由
app.use('/api/secured', authenticateJWT, createProxyMiddleware({
  target: SERVICE_URL,
  pathRewrite: { '^/api/secured': '/internal' },
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    if (req.user) {
      proxyReq.setHeader('X-User-ID', req.user.id);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  }
}));

// 政策信息路由
app.use('/api/policies', createProxyMiddleware({
  target: SERVICE_URL,
  pathRewrite: { '^/api/policies': '/policies' },
  changeOrigin: true
}));

// 农户故事路由
app.use('/api/farmer-stories', createProxyMiddleware({
  target: SERVICE_URL,
  pathRewrite: { '^/api/farmer-stories': '/farmer-stories' },
  changeOrigin: true
}));

// 文件上传代理
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB 限制
});

app.post('/api/upload', authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未上传文件' });
    }
    
    // 创建FormData实例
    const FormData = require('form-data');
    const form = new FormData();
    
    // 添加文件
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // 添加其他字段
    Object.keys(req.body).forEach(key => {
      form.append(key, req.body[key]);
    });
    
    // 添加用户信息
    form.append('userId', req.user.id);
    
    // 发送到服务端
    const response = await fetch(`${SERVICE_URL}/upload`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    res.json(data);
  } catch (error) {
    console.error('上传错误:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`API网关运行在端口 ${PORT}`);
  console.log(`连接到服务层: ${SERVICE_URL}`);
});

module.exports = app; 