const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const app = express();

// CORS配置
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: '服务器运行正常',
    time: new Date().toISOString()
  });
});

// 简单的政策API - 不依赖数据库
const testPolicies = [
  { 
    id: 1, 
    title: '农业补贴政策', 
    content: '2024年农业补贴政策详情...', 
    publishDate: '2024-01-15',
    source: '农业部',
    category: '补贴',
    status: 'active'
  },
  { 
    id: 2, 
    title: '农产品市场保障措施', 
    content: '关于保障农产品市场稳定的政策...', 
    publishDate: '2024-02-20',
    source: '市场监管总局',
    category: '市场',
    status: 'active'
  }
];

// 政策列表
app.get('/api/policies', (req, res) => {
  res.json({
    success: true,
    data: testPolicies
  });
});

// 政策详情
app.get('/api/policies/:id', (req, res) => {
  const policy = testPolicies.find(p => p.id === parseInt(req.params.id));
  
  if (!policy) {
    return res.status(404).json({
      success: false,
      message: '政策不存在'
    });
  }
  
  res.json({
    success: true,
    data: policy
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;

// 启动应用
app.listen(PORT, () => {
  console.log(`简易演示服务器运行在端口 ${PORT}`);
  console.log(`测试API: http://localhost:${PORT}/api/test`);
  console.log(`政策列表: http://localhost:${PORT}/api/policies`);
});

module.exports = app; 