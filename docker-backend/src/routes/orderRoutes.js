const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product, User, sequelize } = require('../models');
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

// 生成订单号
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().replace(/[-:TZ.]/g, '');
  const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `ORD${dateStr.slice(0, 12)}${randomStr}`;
};

// 创建新订单
router.post('/', authenticateToken, async (req, res) => {
  // 使用事务保证订单和订单项的创建是原子操作
  const transaction = await sequelize.transaction();
  
  try {
    const { items, shippingAddress, paymentMethod, shippingMethod, notes } = req.body;
    
    // 验证购物项
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: '订单必须包含至少一个商品' });
    }
    
    // 验证收货地址
    if (!shippingAddress) {
      await transaction.rollback();
      return res.status(400).json({ message: '必须提供收货地址' });
    }
    
    // 查询所有产品以获取最新价格和库存
    const productIds = items.map(item => item.productId);
    const products = await Product.findAll({
      where: { id: productIds },
      transaction
    });
    
    // 检查产品是否存在和库存是否充足
    const productMap = {};
    for (const product of products) {
      productMap[product.id] = product;
    }
    
    for (const item of items) {
      const product = productMap[item.productId];
      
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({ message: `产品ID ${item.productId} 不存在` });
      }
      
      if (product.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({ message: `产品 ${product.name} 库存不足` });
      }
    }
    
    // 计算总价和准备订单项
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = productMap[item.productId];
      const subtotal = product.price * item.quantity;
      
      totalAmount += subtotal;
      
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        subtotal
      });
    }
    
    // 创建订单
    const order = await Order.create({
      userId: req.user.id,
      orderNumber: generateOrderNumber(),
      totalAmount,
      status: 'pending',
      paymentMethod: paymentMethod || 'online',
      paymentStatus: 'pending',
      shippingAddress,
      shippingMethod: shippingMethod || 'standard',
      notes
    }, { transaction });
    
    // 创建订单项
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: order.id,
        ...item
      }, { transaction });
      
      // 更新库存
      const product = productMap[item.productId];
      await product.update({
        stock: product.stock - item.quantity
      }, { transaction });
    }
    
    // 提交事务
    await transaction.commit();
    
    // 返回订单信息
    res.status(201).json({
      message: '订单创建成功',
      order: {
        ...order.get(),
        items: orderItems
      }
    });
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    console.error('创建订单失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户订单列表
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    
    // 构建查询条件
    const whereCondition = { userId: req.user.id };
    if (status) whereCondition.status = status;
    
    // 分页
    const offset = (page - 1) * limit;
    
    // 查询订单
    const orders = await Order.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'images']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // 计算总页数
    const totalPages = Math.ceil(orders.count / limit);
    
    res.status(200).json({
      orders: orders.rows,
      totalCount: orders.count,
      totalPages,
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('获取用户订单列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取订单详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询订单
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'phone']
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    // 检查权限（只有订单所有者或管理员可以查看）
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有查看此订单的权限' });
    }
    
    res.status(200).json({ order });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新订单状态（只有管理员可操作）
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    
    // 检查用户权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有更新订单状态的权限' });
    }
    
    // 查找订单
    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    // 更新订单状态
    const updates = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    
    await order.update(updates);
    
    res.status(200).json({
      message: '订单状态更新成功',
      order
    });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 取消订单
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  // 使用事务保证订单取消和库存更新是原子操作
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // 查找订单
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ],
      transaction
    });
    
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: '订单不存在' });
    }
    
    // 检查权限（只有订单所有者或管理员可以取消）
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({ message: '没有取消此订单的权限' });
    }
    
    // 检查订单状态
    if (order.status === 'cancelled') {
      await transaction.rollback();
      return res.status(400).json({ message: '订单已经被取消' });
    }
    
    if (['shipped', 'delivered'].includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({ message: '订单已经发货或交付，无法取消' });
    }
    
    // 更新订单状态
    await order.update({
      status: 'cancelled',
      paymentStatus: order.paymentStatus === 'completed' ? 'refunded' : 'cancelled'
    }, { transaction });
    
    // 恢复库存
    for (const item of order.items) {
      const product = await Product.findByPk(item.productId, { transaction });
      await product.update({
        stock: product.stock + item.quantity
      }, { transaction });
    }
    
    // 提交事务
    await transaction.commit();
    
    res.status(200).json({
      message: '订单取消成功',
      order
    });
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    console.error('取消订单失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 