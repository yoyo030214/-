const express = require('express');
const router = express.Router();
const { Product, User } = require('../models');
const jwt = require('jsonwebtoken');

// 私钥，实际应用中应该放在环境变量中
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// 验证JWT中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: '令牌已过期' });
      }
      return res.status(403).json({ message: '无效的令牌' });
    }
    
    req.user = user;
    next();
  });
};

// 获取所有产品
router.get('/', async (req, res) => {
  try {
    const { category, featured, isOrganic, limit = 20, page = 1 } = req.query;
    
    // 构建查询条件
    const whereCondition = {};
    if (category) whereCondition.category = category;
    if (featured) whereCondition.featured = featured === 'true';
    if (isOrganic) whereCondition.isOrganic = isOrganic === 'true';
    
    // 分页
    const offset = (page - 1) * limit;
    
    // 查询产品
    const products = await Product.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'farmer',
          attributes: ['id', 'username', 'email', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // 计算总页数
    const totalPages = Math.ceil(products.count / limit);
    
    res.status(200).json({
      products: products.rows,
      totalCount: products.count,
      totalPages,
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('获取产品列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个产品详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id, {
      include: [
        {
          model: User,
          as: 'farmer',
          attributes: ['id', 'username', 'email', 'avatar']
        }
      ]
    });
    
    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }
    
    res.status(200).json({ product });
  } catch (error) {
    console.error('获取产品详情失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新产品（需要认证）
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, stock, category, images, origin, harvestDate, isOrganic, featured } = req.body;
    
    // 检查用户角色
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({ message: '没有创建产品的权限' });
    }
    
    // 创建产品
    const newProduct = await Product.create({
      name,
      description,
      price,
      stock,
      category,
      images: images || [],
      origin,
      harvestDate,
      isOrganic: isOrganic || false,
      featured: featured || false,
      farmerId: req.user.id
    });
    
    res.status(201).json({
      message: '产品创建成功',
      product: newProduct
    });
  } catch (error) {
    console.error('创建产品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新产品（需要认证）
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category, images, origin, harvestDate, isOrganic, featured } = req.body;
    
    // 查找产品
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }
    
    // 检查权限（只有产品创建者或管理员可以更新）
    if (product.farmerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有更新此产品的权限' });
    }
    
    // 更新产品
    await product.update({
      name: name || product.name,
      description: description || product.description,
      price: price || product.price,
      stock: stock !== undefined ? stock : product.stock,
      category: category || product.category,
      images: images || product.images,
      origin: origin || product.origin,
      harvestDate: harvestDate || product.harvestDate,
      isOrganic: isOrganic !== undefined ? isOrganic : product.isOrganic,
      featured: featured !== undefined ? featured : product.featured
    });
    
    res.status(200).json({
      message: '产品更新成功',
      product
    });
  } catch (error) {
    console.error('更新产品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除产品（需要认证）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找产品
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }
    
    // 检查权限（只有产品创建者或管理员可以删除）
    if (product.farmerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有删除此产品的权限' });
    }
    
    // 删除产品
    await product.destroy();
    
    res.status(200).json({ message: '产品删除成功' });
  } catch (error) {
    console.error('删除产品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 