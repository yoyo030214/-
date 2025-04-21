const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/database');
const initializeDatabase = require('./config/init-db');
const { User, Policy, FarmerStory, FarmerProduct } = require('./models');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/policies', require('./routes/policyRoutes'));
app.use('/api/farmer-stories', require('./routes/farmerStoryRoutes'));
app.use('/api/farmer-products', require('./routes/farmerProductRoutes'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 同步数据库模型
    await sequelize.sync();
    console.log('数据库模型同步成功');

    // 初始化数据库
    await initializeDatabase();
    console.log('数据库初始化成功');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
  }
}

startServer(); 