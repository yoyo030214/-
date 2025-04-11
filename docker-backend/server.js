const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();

// 初始化Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 导入数据库模型
const { sequelize, syncDatabase } = require('./src/models');
const { syncMerchantDatabase } = require('./database/src/models');

// 导入种子数据初始化函数
const { initializeAllSeeds } = require('./database/src/seeders');

// 导入路由
const policyRoutes = require('./src/routes/policyRoutes');
const productRoutes = require('./src/routes/productRoutes');
const userRoutes = require('./src/routes/userRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const weatherRoutes = require('./src/routes/weatherRoutes');
const imageRoutes = require('./src/routes/imageRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// 导入商家路由
const { router: merchantAuthRoutes } = require('./merchant/src/routes/merchantAuthRoutes');
const customerRoutes = require('./merchant/src/routes/customerRoutes');

// 导入微信小程序API路由
const wxAuthRoutes = require('./merchant/src/routes/wxAuthRoutes');
const wxProductRoutes = require('./merchant/src/routes/wxProductRoutes');
const wxOrderRoutes = require('./merchant/src/routes/wxOrderRoutes');
const wxShopRoutes = require('./merchant/src/routes/wxShopRoutes');
const wxCartRoutes = require('./merchant/src/routes/wxCartRoutes');

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));
app.use('/merchant', express.static(path.join(__dirname, 'merchant/public')));
app.use('/frontend', express.static(path.join(__dirname, 'frontend/public')));

// 使用路由
app.use('/api/policies', policyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/user', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/images', imageRoutes);
app.use('/admin', adminRoutes);

// 使用商家路由
app.use('/api/merchant/auth', merchantAuthRoutes);
app.use('/api/merchant/customers', customerRoutes);

// 微信小程序API路由
app.use('/api/wx/auth', wxAuthRoutes);
app.use('/api/wx/products', wxProductRoutes);
app.use('/api/wx/orders', wxOrderRoutes);
app.use('/api/wx/shops', wxShopRoutes);
app.use('/api/wx/cart', wxCartRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({ message: '农业应用后端API服务运行正常' });
});

// 商家版首页
app.get('/merchant', (req, res) => {
  res.sendFile(path.join(__dirname, 'merchant/public/admin/index.html'));
});

// 确保上传目录存在
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 确保商家上传目录存在
const merchantUploadDir = path.join(__dirname, 'merchant/uploads');
if (!fs.existsSync(merchantUploadDir)) {
  fs.mkdirSync(merchantUploadDir, { recursive: true });
}

// 同步数据库并启动服务器
const startServer = async () => {
  try {
    // 同步数据库模型
    await syncDatabase();
    
    // 同步商家数据库模型
    await syncMerchantDatabase();
    
    // 初始化所有种子数据
    await initializeAllSeeds();
    
    // 设置端口并启动服务器
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
  }
};

// 启动服务器
startServer(); 