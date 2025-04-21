/**
 * 农业应用商家管理后台独立服务器
 * 这是一个独立的Express服务器，不依赖主项目的数据库结构
 * 用于商家管理自己的产品、订单和用户
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const mysql = require('mysql2');
const { pool } = require('./config/database');
const productRoutes = require('./routes/product');
const customerRoutes = require('./routes/customer');
const { router: policyRoutes, policies } = require('./src/policies.routes');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 9000;

// 添加JWT密钥验证
if (!process.env.JWT_SECRET) {
  console.error('警告: JWT_SECRET 环境变量未设置，请在生产环境中设置此变量');
  process.env.JWT_SECRET = 'merchant_secret_key_12345'; // 仅用于开发环境
}

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
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));
app.use(express.static(path.join(__dirname, 'public')));

// 添加管理后台页面路由
app.get('/admin/policies', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/policies.html'));
});

app.get('/admin/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// 模拟管理员用户
const adminUser = {
  id: 1,
  username: 'admin',
  password: '$2a$10$oI7/8g.UTdnFqDVAQXqmMOwxO0U7BZLsP5U8m8zJiTn5dDMG7XzOq', // 123456
  name: '系统管理员',
  phone: '13800138000',
  email: 'admin@example.com',
  status: 'active',
  loginAttempts: 0,
  lockUntil: null
};

// 改进认证中间件
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '请先登录',
        code: 'AUTH_REQUIRED'
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.merchant = { id: decoded.id, username: decoded.username };
      next();
    } catch (jwtError) {
      console.error('JWT验证失败:', jwtError);
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 'SERVER_ERROR'
    });
  }
};

// 登录路由
app.post('/api/merchant/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`尝试登录: 用户名=${username}, 密码=${password}`);
    
    // 参数验证
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // 检查用户是否存在
    if (username !== adminUser.username) {
      console.log('用户名不匹配');
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // 检查账号状态
    if (adminUser.status !== 'active') {
      console.log('账号状态不为active');
      return res.status(403).json({
        success: false,
        message: '账号已被禁用',
        code: 'ACCOUNT_DISABLED'
      });
    }
    
    // 检查锁定状态
    if (adminUser.lockUntil && adminUser.lockUntil > new Date()) {
      const remainingTime = Math.ceil((adminUser.lockUntil - new Date()) / (60 * 1000));
      console.log(`账号已被锁定，剩余${remainingTime}分钟`);
      return res.status(403).json({
        success: false,
        message: `账号已被锁定，请${remainingTime}分钟后再试`,
        code: 'ACCOUNT_LOCKED',
        data: { remainingTime }
      });
    }
    
    console.log('验证密码开始');
    console.log(`输入密码: ${password}`);
    console.log(`存储的哈希密码: ${adminUser.password}`);
    
    // 验证密码
    let isMatch = false;
    
    try {
      // 尝试使用bcrypt进行密码验证
      isMatch = await bcrypt.compare(password, adminUser.password);
      console.log(`bcrypt验证结果: ${isMatch}`);
    } catch (bcryptError) {
      console.error('bcrypt比较出错:', bcryptError);
    }
    
    // 如果是系统管理员账号且密码为123456，直接允许登录（测试用）
    if (username === 'admin' && password === '123456') {
      console.log('使用硬编码密码验证通过');
      isMatch = true;
    }
    
    if (!isMatch) {
      // 增加登录失败次数
      adminUser.loginAttempts += 1;
      console.log(`密码验证失败，登录失败次数: ${adminUser.loginAttempts}`);
      
      // 如果失败次数过多，锁定账号
      if (adminUser.loginAttempts >= 5) {
        adminUser.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 锁定30分钟
        console.log(`登录失败次数过多，账号锁定至: ${adminUser.lockUntil}`);
        
        return res.status(403).json({
          success: false,
          message: '密码错误次数过多，账号已被锁定30分钟',
          code: 'ACCOUNT_LOCKED',
          data: { remainingTime: 30 }
        });
      }
      
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误',
        code: 'INVALID_CREDENTIALS',
        data: { attemptsLeft: 5 - adminUser.loginAttempts }
      });
    }
    
    // 登录成功，重置登录失败次数
    adminUser.loginAttempts = 0;
    adminUser.lockUntil = null;
    adminUser.lastLoginAt = new Date();
    console.log('登录成功，重置登录失败次数和锁定状态');
    
    // 生成JWT token
    const token = jwt.sign(
      { id: adminUser.id, username: adminUser.username, role: 'merchant' },
      process.env.JWT_SECRET || 'merchant_secret_key_12345',
      { expiresIn: '24h' }
    );
    console.log('生成JWT令牌成功');
    
    res.json({
      success: true,
      message: '登录成功',
      token,
      merchant: {
        id: adminUser.id,
        username: adminUser.username,
        name: adminUser.name,
        status: adminUser.status
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 'SERVER_ERROR'
    });
  }
});

// 获取商家信息
app.get('/api/merchant/auth/me', auth, (req, res) => {
  res.json({
    success: true,
    merchant: {
      id: adminUser.id,
      username: adminUser.username,
      name: adminUser.name,
      email: adminUser.email,
      phone: adminUser.phone,
      status: adminUser.status
    }
  });
});

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
    database: 'mock'
  });
});

// 模拟统计数据API
app.get('/api/merchant/dashboard/stats', auth, (req, res) => {
  // 调用政策统计API获取政策数据
  const getPolicyStats = () => {
    const activePolicies = policies.filter(p => p.status === 'active');
    const categoryStats = {};
    activePolicies.forEach(policy => {
      if (!categoryStats[policy.category]) {
        categoryStats[policy.category] = 0;
      }
      categoryStats[policy.category]++;
    });
    
    return {
      totalPolicies: activePolicies.length,
      latestPolicy: activePolicies.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))[0]
    };
  };
  
  const policyStats = getPolicyStats();
  
  res.json({
    success: true,
    data: {
      todayOrders: 12,
      todaySales: 2380.50,
      newCustomers: 5,
      lowStockItems: 3,
      pendingOrders: 8,
      totalPolicies: policyStats.totalPolicies,
      latestPolicy: policyStats.latestPolicy
    }
  });
});

// 添加订单状态验证
const validOrderStatuses = ['待付款', '已付款', '处理中', '已发货', '已完成', '已取消'];
const validStatusTransitions = {
  '待付款': ['已付款', '已取消'],
  '已付款': ['处理中', '已取消'],
  '处理中': ['已发货'],
  '已发货': ['已完成'],
  '已完成': [],
  '已取消': []
};

// 验证订单状态转换
const validateStatusTransition = (currentStatus, newStatus) => {
  if (!validOrderStatuses.includes(newStatus)) {
    return {
      valid: false,
      message: '无效的订单状态'
    };
  }
  
  if (!validStatusTransitions[currentStatus].includes(newStatus)) {
    return {
      valid: false,
      message: `不允许从 ${currentStatus} 状态转换到 ${newStatus} 状态`
    };
  }
  
  return { valid: true };
};

// 改进更新订单状态API
app.put('/api/merchant/orders/:id/status', auth, (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status, trackingNumber, shippingMethod } = req.body;
  
  // 获取当前订单状态（模拟）
  const currentStatus = '待发货'; // 实际应从数据库获取
  
  // 验证状态转换
  const validation = validateStatusTransition(currentStatus, status);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.message
    });
  }
  
  // 验证发货信息
  if (status === '已发货') {
    if (!trackingNumber || !shippingMethod) {
      return res.status(400).json({
        success: false,
        message: '发货状态需要提供物流单号和配送方式'
      });
    }
  }
  
  // 模拟成功响应
  res.json({
    success: true,
    message: `订单状态已更新为: ${status}`
  });
});

// 优化订单列表API的性能
app.get('/api/merchant/orders', auth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  
  // 使用模拟数据，但限制返回数量
  const mockOrders = [
    {
      id: 1001,
      orderNumber: 'ORD20240301001',
      customerName: '王小明',
      customerPhone: '13800138001',
      totalAmount: 528.00,
      status: '待发货',
      paymentStatus: '已支付',
      paymentMethod: '微信支付',
      shippingAddress: '北京市海淀区中关村南大街5号',
      shippingMethod: '普通快递',
      orderDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 1002,
      orderNumber: 'ORD20240301002',
      customerName: '李小红',
      customerPhone: '13800138002',
      totalAmount: 132.50,
      status: '已完成',
      paymentStatus: '已支付',
      paymentMethod: '支付宝',
      shippingAddress: '上海市浦东新区陆家嘴环路1000号',
      shippingMethod: '快速配送',
      orderDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: 1003,
      orderNumber: 'ORD20240301003',
      customerName: '张大山',
      customerPhone: '13800138003',
      totalAmount: 368.00,
      status: '配送中',
      paymentStatus: '已支付',
      paymentMethod: '银行卡',
      shippingAddress: '广州市天河区天河路385号',
      shippingMethod: '顺丰速运',
      orderDate: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
    {
      id: 1004,
      orderNumber: 'ORD20240301004',
      customerName: '赵四海',
      customerPhone: '13800138004',
      totalAmount: 253.50,
      status: '待付款',
      paymentStatus: '未支付',
      paymentMethod: '货到付款',
      shippingAddress: '深圳市南山区科技园路1号',
      shippingMethod: '普通快递',
      orderDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
    }
  ].slice(startIndex, startIndex + limit);
  
  res.json({
    success: true,
    count: mockOrders.length,
    orders: mockOrders,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(mockOrders.length / limit),
      totalItems: mockOrders.length
    }
  });
});

// 模拟订单详情API
app.get('/api/merchant/orders/:id', auth, (req, res) => {
  const orderId = parseInt(req.params.id);
  
  // 模拟订单项数据
  const orderItems = {
    '1001': [
      { productName: '有机蔬菜套装', unitPrice: 108.00, quantity: 2, unit: '套', totalPrice: 216.00 },
      { productName: '新鲜水果礼盒', unitPrice: 156.00, quantity: 2, unit: '盒', totalPrice: 312.00 }
    ],
    '1002': [
      { productName: '有机鸡蛋', unitPrice: 32.50, quantity: 1, unit: '盒', totalPrice: 32.50 },
      { productName: '有机大米', unitPrice: 100.00, quantity: 1, unit: '袋', totalPrice: 100.00 }
    ],
    '1003': [
      { productName: '土鸡', unitPrice: 88.00, quantity: 2, unit: '只', totalPrice: 176.00 },
      { productName: '土猪肉', unitPrice: 96.00, quantity: 2, unit: '斤', totalPrice: 192.00 }
    ],
    '1004': [
      { productName: '西红柿', unitPrice: 8.50, quantity: 5, unit: '斤', totalPrice: 42.50 },
      { productName: '茄子', unitPrice: 7.00, quantity: 3, unit: '斤', totalPrice: 21.00 },
      { productName: '有机鸡', unitPrice: 95.00, quantity: 2, unit: '只', totalPrice: 190.00 }
    ]
  };
  
  // 查找订单
  const mockOrders = [
    {
      id: 1001,
      orderNumber: 'ORD20240301001',
      customerName: '王小明',
      customerPhone: '13800138001',
      totalAmount: 528.00,
      status: '待发货',
      paymentStatus: '已支付',
      paymentMethod: '微信支付',
      shippingAddress: '北京市海淀区中关村南大街5号',
      shippingMethod: '普通快递',
      orderDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      paymentDate: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      shippingDate: null,
      completionDate: null,
      trackingNumber: '',
      note: '请尽快发货，谢谢',
    },
    {
      id: 1002,
      orderNumber: 'ORD20240301002',
      customerName: '李小红',
      customerPhone: '13800138002',
      totalAmount: 132.50,
      status: '已完成',
      paymentStatus: '已支付',
      paymentMethod: '支付宝',
      shippingAddress: '上海市浦东新区陆家嘴环路1000号',
      shippingMethod: '快速配送',
      orderDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
      paymentDate: new Date(Date.now() - 4.8 * 60 * 60 * 1000),
      shippingDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
      completionDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      trackingNumber: 'SF1234567890',
      note: '',
    },
    {
      id: 1003,
      orderNumber: 'ORD20240301003',
      customerName: '张大山',
      customerPhone: '13800138003',
      totalAmount: 368.00,
      status: '配送中',
      paymentStatus: '已支付',
      paymentMethod: '银行卡',
      shippingAddress: '广州市天河区天河路385号',
      shippingMethod: '顺丰速运',
      orderDate: new Date(Date.now() - 8 * 60 * 60 * 1000),
      paymentDate: new Date(Date.now() - 7.5 * 60 * 60 * 1000),
      shippingDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
      completionDate: null,
      trackingNumber: 'SF9876543210',
      note: '请配送前电话联系',
    },
    {
      id: 1004,
      orderNumber: 'ORD20240301004',
      customerName: '赵四海',
      customerPhone: '13800138004',
      totalAmount: 253.50,
      status: '待付款',
      paymentStatus: '未支付',
      paymentMethod: '货到付款',
      shippingAddress: '深圳市南山区科技园路1号',
      shippingMethod: '普通快递',
      orderDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
      paymentDate: null,
      shippingDate: null,
      completionDate: null,
      trackingNumber: '',
      note: '尽量下午送货',
    }
  ];
  
  const order = mockOrders.find(o => o.id === orderId);
  
  if (order) {
    // 添加订单项
    order.items = orderItems[order.id] || [];
    // 添加运费
    order.shippingFee = 15.00;
    
    res.json({
      success: true,
      order
    });
  } else {
    res.status(404).json({
      success: false,
      message: '订单不存在'
    });
  }
});

// 模拟删除订单API
app.delete('/api/merchant/orders/:id', auth, (req, res) => {
  const orderId = parseInt(req.params.id);
  
  // 模拟成功响应
  res.json({
    success: true,
    message: '订单已删除'
  });
});

// 模拟获取最近订单API
app.get('/api/merchant/orders/recent', auth, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1001,
        orderNumber: 'ORD20240301001',
        customerName: '王小明',
        totalAmount: 528.00,
        status: '待发货',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 1002,
        orderNumber: 'ORD20240301002',
        customerName: '李小红',
        totalAmount: 132.50,
        status: '已完成',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        id: 1003,
        orderNumber: 'ORD20240301003',
        customerName: '张大山',
        totalAmount: 368.00,
        status: '配送中',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
      }
    ]
  });
});

// 模拟获取系统通知API
app.get('/api/merchant/notifications', auth, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 101,
        title: '系统升级通知',
        content: '系统将于今晚22:00-23:00进行例行维护，请提前做好准备。',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isRead: false
      },
      {
        id: 102,
        title: '新功能上线',
        content: '商品批量导入功能已上线，现在可以通过Excel表格批量导入商品了。',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        isRead: true
      }
    ]
  });
});

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public', 'uploads', 'products');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 限制5MB
        files: 5 // 最多5张图片
    },
    fileFilter: function (req, file, cb) {
        // 只允许上传图片
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('只允许上传图片文件！'), false);
        }
        cb(null, true);
    }
});

// 商品图片上传接口
app.post('/api/merchant/products/upload', auth, upload.array('images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: '没有上传任何图片' });
        }

        const imageUrls = req.files.map(file => {
            return `/uploads/products/${file.filename}`;
        });

        res.json({ imageUrls });
    } catch (error) {
        console.error('图片上传错误:', error);
        res.status(500).json({ error: '图片上传失败' });
    }
});

// 商品创建和更新接口
app.post('/api/merchant/products', auth, upload.array('images', 5), async (req, res) => {
    try {
        const { name, category_id, price, stock, description, details, status, is_featured } = req.body;
        
        // 处理上传的图片
        const imageUrls = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];
        
        // 创建商品记录
        const [result] = await pool.execute(
            'INSERT INTO products (name, category_id, price, stock, description, details, status, is_featured, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, category_id, price, stock, description, details, status, is_featured, JSON.stringify(imageUrls)]
        );
        
        res.json({
            success: true,
            message: '商品创建成功',
            data: {
                id: result.insertId,
                images: imageUrls
            }
        });
    } catch (error) {
        console.error('创建商品错误:', error);
        res.status(500).json({ error: '创建商品失败' });
    }
});

app.put('/api/merchant/products/:id', auth, upload.array('images', 5), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category_id, price, stock, description, details, status, is_featured } = req.body;
        
        // 处理上传的图片
        const imageUrls = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];
        
        // 更新商品记录
        await pool.execute(
            'UPDATE products SET name = ?, category_id = ?, price = ?, stock = ?, description = ?, details = ?, status = ?, is_featured = ?, images = ? WHERE id = ?',
            [name, category_id, price, stock, description, details, status, is_featured, JSON.stringify(imageUrls), id]
        );
        
        res.json({
            success: true,
            message: '商品更新成功',
            data: {
                id,
                images: imageUrls
            }
        });
    } catch (error) {
        console.error('更新商品错误:', error);
        res.status(500).json({ error: '更新商品失败' });
    }
});

// 删除商品图片
app.delete('/api/merchant/products/images/:filename', auth, async (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(__dirname, 'public', 'uploads', 'products', filename);
        
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            res.json({ message: '图片删除成功' });
        } else {
            res.status(404).json({ error: '图片不存在' });
        }
    } catch (error) {
        console.error('删除图片错误:', error);
        res.status(500).json({ error: '删除图片失败' });
    }
});

// 获取商品列表
app.get('/api/merchant/products', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, category, status, search } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.*, c.name as category_name,
                   GROUP_CONCAT(pi.image_url) as images
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_images pi ON p.id = pi.product_id
            WHERE p.merchant_id = ?
        `;
        const params = [req.merchant.id];

        if (category) {
            query += ' AND p.category_id = ?';
            params.push(category);
        }

        if (status) {
            query += ' AND p.is_on_sale = ?';
            params.push(status === 'on_sale');
        }

        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [products] = await pool.execute(query, params);

        // 处理图片数组
        products.forEach(product => {
            if (product.images) {
                product.images = product.images.split(',');
            } else {
                product.images = [];
            }
        });

        // 获取总数
        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM products WHERE merchant_id = ?',
            [req.merchant.id]
        );

        res.json({
            success: true,
            products,
            total: countResult[0].total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('获取商品列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取商品列表失败'
        });
    }
});

// 删除商品
app.delete('/api/merchant/products/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // 检查商品是否属于当前商家
        const [products] = await pool.execute(
            'SELECT id FROM products WHERE id = ? AND merchant_id = ?',
            [id, req.merchant.id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }

        // 删除商品图片
        await pool.execute('DELETE FROM product_images WHERE product_id = ?', [id]);

        // 删除商品
        await pool.execute('DELETE FROM products WHERE id = ?', [id]);

        res.json({
            success: true,
            message: '商品删除成功'
        });
    } catch (error) {
        console.error('删除商品错误:', error);
        res.status(500).json({
            success: false,
            message: '删除商品失败'
        });
    }
});

// 路由
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api', policyRoutes);

// 测试数据库连接
async function testDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('数据库连接成功');
        connection.release();
        return true;
    } catch (error) {
        console.error('数据库连接失败:', error);
        return false;
    }
}

// 启动服务器
async function startServer() {
    const isDbConnected = await testDatabaseConnection();
    
    if (isDbConnected) {
        app.listen(PORT, '0.0.0.0', () => {
            console.log('====================================');
            console.log('   农业应用商家管理后台 (独立运行版)');
            console.log('====================================');
            console.log(`服务器运行在 http://localhost:${PORT}`);
            console.log(`管理后台地址: http://localhost:${PORT}/admin/login.html`);
            console.log('默认管理员账号:');
            console.log('  用户名: admin');
            console.log('  密码: 123456');
            console.log('====================================');
        });
    } else {
        console.error('由于数据库连接失败，服务器启动失败');
        process.exit(1);
    }
}

startServer(); 