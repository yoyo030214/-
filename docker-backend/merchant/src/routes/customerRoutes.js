const express = require('express');
const router = express.Router();
const { Customer, MerchantOrder } = require('../../../database/src/models');
const { authMiddleware } = require('./merchantAuthRoutes');
const { Op } = require('sequelize');

// 获取商家的所有客户
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, level, status, sort } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    // 构建查询条件
    const where = {
      merchantId: req.merchant.id
    };
    
    // 搜索条件
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 会员等级筛选
    if (level) {
      where.memberLevel = level;
    }
    
    // 客户状态筛选
    if (status) {
      where.status = status;
    }
    
    // 排序条件
    let order = [['createdAt', 'DESC']];
    if (sort) {
      const [field, direction] = sort.split(':');
      if (field && direction) {
        order = [[field, direction.toUpperCase()]];
      }
    }
    
    // 查询客户并分页
    const { count, rows: customers } = await Customer.findAndCountAll({
      where,
      order,
      limit: Number(limit),
      offset
    });
    
    // 获取会员等级统计
    const memberLevelStats = await Customer.findAll({
      attributes: ['memberLevel', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: { merchantId: req.merchant.id },
      group: ['memberLevel'],
      raw: true
    });
    
    // 统计结果转换为对象
    const stats = {
      total: count,
      regularMembers: 0,
      vipMembers: 0,
      premiumMembers: 0
    };
    
    memberLevelStats.forEach(stat => {
      if (stat.memberLevel === '普通会员') stats.regularMembers = Number(stat.count);
      if (stat.memberLevel === 'VIP会员') stats.vipMembers = Number(stat.count);
      if (stat.memberLevel === '高级会员') stats.premiumMembers = Number(stat.count);
    });
    
    res.status(200).json({
      total: count,
      pages: Math.ceil(count / Number(limit)),
      currentPage: Number(page),
      customers,
      stats
    });
  } catch (error) {
    console.error('获取客户列表失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取客户详情
router.get('/:customerId', authMiddleware, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // 查询客户信息
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        merchantId: req.merchant.id
      }
    });
    
    if (!customer) {
      return res.status(404).json({ message: '客户不存在' });
    }
    
    // 查询客户的订单统计
    const orders = await MerchantOrder.findAll({
      where: {
        customerId,
        merchantId: req.merchant.id
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSpent'],
        [sequelize.fn('MAX', sequelize.col('orderDate')), 'lastOrderDate']
      ],
      raw: true
    });
    
    // 计算平均订单金额
    const stats = orders[0] || { totalOrders: 0, totalSpent: 0, lastOrderDate: null };
    stats.averageOrderValue = stats.totalOrders > 0 
      ? Number(stats.totalSpent) / Number(stats.totalOrders) 
      : 0;
    
    // 查询最常购买的产品
    const topProducts = await sequelize.query(`
      SELECT mp.name, COUNT(moi.id) as orderCount
      FROM merchant_order_items moi
      JOIN merchant_products mp ON moi.productId = mp.id
      JOIN merchant_orders mo ON moi.orderId = mo.id
      WHERE mo.customerId = :customerId AND mo.merchantId = :merchantId
      GROUP BY mp.id, mp.name
      ORDER BY orderCount DESC
      LIMIT 3
    `, {
      replacements: { customerId, merchantId: req.merchant.id },
      type: sequelize.QueryTypes.SELECT
    });
    
    // 构建客户消费习惯分析
    const customerAnalysis = {
      orderStats: stats,
      topProducts
    };
    
    res.status(200).json({
      customer,
      analysis: customerAnalysis
    });
  } catch (error) {
    console.error('获取客户详情失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 创建新客户
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name, phone, email, address, memberLevel, notes
    } = req.body;
    
    // 验证必填字段
    if (!name || !phone) {
      return res.status(400).json({ message: '客户姓名和联系电话是必填项' });
    }
    
    // 检查是否已存在相同电话的客户
    const existingCustomer = await Customer.findOne({
      where: {
        phone,
        merchantId: req.merchant.id
      }
    });
    
    if (existingCustomer) {
      return res.status(400).json({ message: '该联系电话已经注册过客户' });
    }
    
    // 创建新客户
    const customer = await Customer.create({
      merchantId: req.merchant.id,
      name,
      phone,
      email,
      address,
      memberLevel: memberLevel || '普通会员',
      notes,
      status: '新客户',
      registerDate: new Date()
    });
    
    res.status(201).json({
      message: '新增客户成功',
      customer
    });
  } catch (error) {
    console.error('创建客户失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 更新客户信息
router.put('/:customerId', authMiddleware, async (req, res) => {
  try {
    const { customerId } = req.params;
    const {
      name, phone, email, address, memberLevel, notes
    } = req.body;
    
    // 查找客户
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        merchantId: req.merchant.id
      }
    });
    
    if (!customer) {
      return res.status(404).json({ message: '客户不存在' });
    }
    
    // 如果更新手机号，检查是否已存在
    if (phone && phone !== customer.phone) {
      const existingCustomer = await Customer.findOne({
        where: {
          phone,
          merchantId: req.merchant.id,
          id: { [Op.ne]: customerId }
        }
      });
      
      if (existingCustomer) {
        return res.status(400).json({ message: '该联系电话已被其他客户使用' });
      }
    }
    
    // 更新客户信息
    await customer.update({
      name: name || customer.name,
      phone: phone || customer.phone,
      email: email || customer.email,
      address: address || customer.address,
      memberLevel: memberLevel || customer.memberLevel,
      notes: notes || customer.notes
    });
    
    res.status(200).json({
      message: '客户信息更新成功',
      customer
    });
  } catch (error) {
    console.error('更新客户信息失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 删除客户
router.delete('/:customerId', authMiddleware, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // 检查客户是否存在
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        merchantId: req.merchant.id
      }
    });
    
    if (!customer) {
      return res.status(404).json({ message: '客户不存在' });
    }
    
    // 检查客户是否有订单
    const orderCount = await MerchantOrder.count({
      where: {
        customerId,
        merchantId: req.merchant.id
      }
    });
    
    if (orderCount > 0) {
      return res.status(400).json({ 
        message: '该客户有关联订单，不能删除',
        orderCount 
      });
    }
    
    // 删除客户
    await customer.destroy();
    
    res.status(200).json({
      message: '客户删除成功'
    });
  } catch (error) {
    console.error('删除客户失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 更新客户等级
router.put('/:customerId/level', authMiddleware, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { memberLevel } = req.body;
    
    // 验证会员等级
    if (!memberLevel || !['普通会员', 'VIP会员', '高级会员'].includes(memberLevel)) {
      return res.status(400).json({ message: '无效的会员等级' });
    }
    
    // 查找客户
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        merchantId: req.merchant.id
      }
    });
    
    if (!customer) {
      return res.status(404).json({ message: '客户不存在' });
    }
    
    // 更新会员等级
    await customer.update({ memberLevel });
    
    res.status(200).json({
      message: '客户等级更新成功',
      customer: {
        id: customer.id,
        name: customer.name,
        memberLevel: customer.memberLevel
      }
    });
  } catch (error) {
    console.error('更新客户等级失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 发送消息给客户
router.post('/send-message', authMiddleware, async (req, res) => {
  try {
    const { title, content, customerIds } = req.body;
    
    // 验证消息内容
    if (!title || !content) {
      return res.status(400).json({ message: '消息标题和内容不能为空' });
    }
    
    // 验证客户ID列表
    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ message: '请选择至少一个客户' });
    }
    
    // 检查客户是否都属于当前商家
    const customers = await Customer.findAll({
      where: {
        id: { [Op.in]: customerIds },
        merchantId: req.merchant.id
      }
    });
    
    if (customers.length !== customerIds.length) {
      return res.status(400).json({ message: '部分客户不存在或不属于当前商家' });
    }
    
    // 这里应该调用消息发送服务，简化处理，仅返回成功
    
    res.status(200).json({
      message: '消息发送成功',
      sentTo: customers.length
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router; 