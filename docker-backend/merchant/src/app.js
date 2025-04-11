const express = require('express');
const cors = require('cors');
const policyRoutes = require('./routes/policyRoutes');

const app = express();

// CORS配置
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'], // 允许的前端域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// 注册政策路由
app.use('/api', policyRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app; 