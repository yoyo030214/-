const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Merchant } = require('../../../database/src/models');

// 中间件：验证JWT Token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '请先登录' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'merchant_secret_key');
    const merchant = await Merchant.findByPk(decoded.id);
    
    if (!merchant) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    req.merchant = merchant;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: '身份验证失败', error: error.message });
  }
};

// 商家注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, storeName, contactName, contactPhone, email, address } = req.body;
    
    // 验证必填字段
    if (!username || !password || !storeName || !contactName || !contactPhone) {
      return res.status(400).json({ message: '所有必填字段都需要填写' });
    }
    
    // 检查用户名是否已存在
    const existingMerchant = await Merchant.findOne({ where: { username } });
    if (existingMerchant) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建商家
    const merchant = await Merchant.create({
      username,
      password: hashedPassword,
      storeName,
      contactName,
      contactPhone,
      email,
      address,
      status: '待审核'
    });
    
    // 生成Token
    const token = jwt.sign(
      { id: merchant.id, username: merchant.username },
      process.env.JWT_SECRET || 'merchant_secret_key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: '注册成功',
      merchant: {
        id: merchant.id,
        username: merchant.username,
        storeName: merchant.storeName,
        status: merchant.status
      },
      token
    });
  } catch (error) {
    console.error('商家注册失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 商家登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证用户名和密码
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码是必填项' });
    }
    
    // 查找商家
    const merchant = await Merchant.findOne({ where: { username } });
    if (!merchant) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, merchant.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    // 检查账户状态
    if (merchant.status === '已冻结') {
      return res.status(403).json({ message: '账户已被冻结，请联系管理员' });
    }
    
    // 生成Token
    const token = jwt.sign(
      { id: merchant.id, username: merchant.username },
      process.env.JWT_SECRET || 'merchant_secret_key',
      { expiresIn: '7d' }
    );
    
    // 更新最后登录时间
    await merchant.update({ 
      lastLoginDate: new Date() 
    });
    
    res.status(200).json({
      message: '登录成功',
      merchant: {
        id: merchant.id,
        username: merchant.username,
        storeName: merchant.storeName,
        memberLevel: merchant.memberLevel,
        status: merchant.status
      },
      token
    });
  } catch (error) {
    console.error('商家登录失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取商家个人资料
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // req.merchant 已经在中间件中设置
    const merchant = req.merchant;
    
    res.status(200).json({
      id: merchant.id,
      username: merchant.username,
      storeName: merchant.storeName,
      contactName: merchant.contactName,
      contactPhone: merchant.contactPhone,
      email: merchant.email,
      address: merchant.address,
      logo: merchant.logo,
      description: merchant.description,
      memberLevel: merchant.memberLevel,
      status: merchant.status,
      balance: merchant.balance,
      createdAt: merchant.createdAt
    });
  } catch (error) {
    console.error('获取商家资料失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 更新商家资料
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { 
      storeName, contactName, contactPhone, email, 
      address, description, logo
    } = req.body;
    
    const merchant = req.merchant;
    
    // 更新商家资料
    await merchant.update({
      storeName: storeName || merchant.storeName,
      contactName: contactName || merchant.contactName,
      contactPhone: contactPhone || merchant.contactPhone,
      email: email || merchant.email,
      address: address || merchant.address,
      description: description || merchant.description,
      logo: logo || merchant.logo
    });
    
    res.status(200).json({
      message: '商家资料更新成功',
      merchant: {
        id: merchant.id,
        username: merchant.username,
        storeName: merchant.storeName,
        contactName: merchant.contactName,
        contactPhone: merchant.contactPhone,
        email: merchant.email,
        address: merchant.address,
        logo: merchant.logo,
        description: merchant.description
      }
    });
  } catch (error) {
    console.error('更新商家资料失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 修改密码
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '当前密码和新密码都是必填项' });
    }
    
    const merchant = req.merchant;
    
    // 验证当前密码
    const isPasswordValid = await bcrypt.compare(currentPassword, merchant.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '当前密码不正确' });
    }
    
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    await merchant.update({ password: hashedPassword });
    
    res.status(200).json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 验证token是否有效
router.get('/verify-token', authMiddleware, (req, res) => {
  res.status(200).json({ 
    valid: true,
    merchant: {
      id: req.merchant.id,
      username: req.merchant.username,
      storeName: req.merchant.storeName
    }
  });
});

// 登出
router.post('/logout', authMiddleware, (req, res) => {
  // 客户端应该删除token，服务器端无需特殊处理
  res.status(200).json({ message: '退出登录成功' });
});

module.exports = {
  router,
  authMiddleware
}; 