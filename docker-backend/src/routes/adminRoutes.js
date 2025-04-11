const express = require('express');
const router = express.Router();
const path = require('path');
const authenticateToken = require('../middleware/auth');
const { User, Product, Order, Policy, Image } = require('../models');

// 中间件：检查是否为管理员
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: '需要管理员权限' });
  }
};

// 提供后台管理HTML页面
router.get('/', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/admin/index.html'));
});

// 图片管理界面
router.get('/images', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/admin/images.html'));
});

// API: 获取后台统计信息
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userCount = await User.count();
    const productCount = await Product.count();
    const orderCount = await Order.count();
    const policyCount = await Policy.count();
    const imageCount = await Image.count();

    // 获取最近注册的用户
    const recentUsers = await User.findAll({
      attributes: ['id', 'username', 'name', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // 获取最近的订单
    const recentOrders = await Order.findAll({
      attributes: ['id', 'orderNumber', 'totalAmount', 'status', 'createdAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      stats: {
        userCount,
        productCount,
        orderCount,
        policyCount,
        imageCount
      },
      recentUsers,
      recentOrders
    });
  } catch (error) {
    console.error('获取后台统计信息失败:', error);
    res.status(500).json({ message: '获取统计信息失败', error: error.message });
  }
});

module.exports = router; 