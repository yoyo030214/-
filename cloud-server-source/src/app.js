const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const userRoutes = require('./routes/userRoutes');
const policyRoutes = require('./routes/policyRoutes');
const farmerStoryRoutes = require('./routes/farmerStoryRoutes');
const farmerProductRoutes = require('./routes/farmerProductRoutes');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// API路由
app.use('/api/users', userRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/farmer-stories', farmerStoryRoutes);
app.use('/api/farmer-products', farmerProductRoutes);

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
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`管理后台地址: http://localhost:${PORT}/admin`);
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
}); 