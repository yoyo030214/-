const express = require('express');
const cors = require('cors');
const farmerRoutes = require('./routes/farmerRoutes');
const policyRoutes = require('./routes/policyRoutes');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/farmers', farmerRoutes);
app.use('/api', policyRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app; 