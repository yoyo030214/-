const express = require('express');
const router = express.Router();
const { User } = require('../models');
const jwt = require('jsonwebtoken');

// 私钥，实际应用中应该放在环境变量中
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// 注册新用户
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }

    // 创建新用户
    const newUser = await User.create({
      username,
      email,
      password, // 密码会在模型的hook中自动加密
      phone
    });

    // 返回用户信息，不包含密码
    const userData = { ...newUser.get(), password: undefined };
    
    res.status(201).json({
      message: '注册成功',
      user: userData
    });
  } catch (error) {
    console.error('注册用户失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '密码错误' });
    }

    // 更新登录时间
    await user.update({ lastLogin: new Date() });

    // 生成JWT令牌
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '24h'
    });

    // 返回用户信息和token，不包含密码
    const userData = { ...user.get(), password: undefined };

    res.status(200).json({
      message: '登录成功',
      user: userData,
      token
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前用户信息
router.get('/profile', async (req, res) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未登录，请先登录' });
    }

    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 查找用户
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 返回用户信息，不包含密码
    const userData = { ...user.get(), password: undefined };
    
    res.status(200).json({
      user: userData
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的令牌' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '令牌已过期，请重新登录' });
    }
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户信息
router.put('/profile', async (req, res) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未登录，请先登录' });
    }

    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 查找用户
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 允许更新的字段
    const { username, phone, avatar } = req.body;
    
    // 更新用户信息
    await user.update({
      username: username || user.username,
      phone: phone || user.phone,
      avatar: avatar || user.avatar
    });

    // 返回更新后的用户信息，不包含密码
    const userData = { ...user.get(), password: undefined };
    
    res.status(200).json({
      message: '用户信息更新成功',
      user: userData
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的令牌' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '令牌已过期，请重新登录' });
    }
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更改密码
router.put('/change-password', async (req, res) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未登录，请先登录' });
    }

    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 查找用户
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const { currentPassword, newPassword } = req.body;
    
    // 验证当前密码
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '当前密码错误' });
    }
    
    // 更新密码
    await user.update({ password: newPassword });
    
    res.status(200).json({
      message: '密码更新成功'
    });
  } catch (error) {
    console.error('更改密码失败:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的令牌' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '令牌已过期，请重新登录' });
    }
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 