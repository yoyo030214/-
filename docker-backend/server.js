const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
console.log('[INFO] 正在加载环境变量...');
dotenv.config();

// 初始化Express应用
console.log('[INFO] 正在初始化Express应用...');
const app = express();

// 中间件
console.log('[INFO] 正在配置中间件...');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 导入数据库模型
console.log('[INFO] 正在导入数据库模型...');
const { sequelize, syncDatabase } = require('./src/models');

// 导入种子数据初始化函数
console.log('[INFO] 正在导入种子数据...');
const { initializeAllSeeds } = require('./src/seeders');

// 导入路由
console.log('[INFO] 正在导入路由...');
const policyRoutes = require('./src/routes/policyRoutes');
const productRoutes = require('./src/routes/productRoutes');
const userRoutes = require('./src/routes/userRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const weatherRoutes = require('./src/routes/weatherRoutes');
const imageRoutes = require('./src/routes/imageRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// 导入商家路由
console.log('[INFO] 正在导入商家路由...');
const { router: merchantAuthRoutes } = require('./merchant/src/routes/merchantAuthRoutes');
const customerRoutes = require('./merchant/src/routes/customerRoutes');

// 导入微信小程序API路由
console.log('[INFO] 正在导入微信小程序API路由...');
const wxAuthRoutes = require('./merchant/src/routes/wxAuthRoutes');
const wxProductRoutes = require('./merchant/src/routes/wxProductRoutes');
const wxOrderRoutes = require('./merchant/src/routes/wxOrderRoutes');
const wxShopRoutes = require('./merchant/src/routes/wxShopRoutes');
const wxCartRoutes = require('./merchant/src/routes/wxCartRoutes');

// 设置静态文件目录
console.log('[INFO] 正在设置静态文件目录...');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/merchant', express.static(path.join(__dirname, 'merchant/public/admin')));
app.use('/frontend', express.static(path.join(__dirname, 'frontend/public')));

// 使用路由
console.log('[INFO] 正在注册路由...');
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
console.log('[INFO] 正在检查上传目录...');
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  console.log('[INFO] 创建上传目录...');
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 确保商家上传目录存在
const merchantUploadDir = path.join(__dirname, 'merchant/uploads');
if (!fs.existsSync(merchantUploadDir)) {
  console.log('[INFO] 创建商家上传目录...');
  fs.mkdirSync(merchantUploadDir, { recursive: true });
}

// 同步数据库并启动服务器
const startServer = async () => {
  try {
    console.log('[INFO] 开始同步数据库...');
    // 同步数据库模型
    await syncDatabase();
    console.log('[INFO] 数据库同步完成');
    
    // 初始化所有种子数据
    console.log('[INFO] 开始初始化种子数据...');
    await initializeAllSeeds();
    console.log('[INFO] 种子数据初始化完成');
    
    // 设置端口并启动服务器
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`[INFO] 服务器运行在端口 ${PORT}`);
      console.log(`[INFO] 访问地址: http://localhost:${PORT}`);
      console.log(`[INFO] 商家后台: http://localhost:${PORT}/merchant`);
    });
  } catch (error) {
    console.error('[ERROR] 启动服务器失败:', error);
  }
};

// 启动服务器
console.log('[INFO] 开始启动服务器...');
startServer(); 