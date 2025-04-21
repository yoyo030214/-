const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// 用户注册
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户名和邮箱是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: '用户名或邮箱已被使用' 
      });
    }

    // 创建新用户
    const user = await User.create({
      username,
      email,
      password,
      role: 'user',
      status: 'active'
    });

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: '注册失败',
      error: error.message 
    });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ 
        message: '用户名或密码错误' 
      });
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: '用户名或密码错误' 
      });
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(403).json({ 
        message: '账户已被禁用' 
      });
    }

    // 更新最后登录时间
    await user.update({ lastLogin: new Date() });

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: '登录失败',
      error: error.message 
    });
  }
};

// 获取用户信息
const getUserInfo = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ 
        message: '用户不存在' 
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ 
      message: '获取用户信息失败',
      error: error.message 
    });
  }
};

// 更新用户信息
const updateUserInfo = async (req, res) => {
  try {
    const { email, phone, avatar } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        message: '用户不存在' 
      });
    }

    // 更新用户信息
    await user.update({
      email: email || user.email,
      phone: phone || user.phone,
      avatar: avatar || user.avatar
    });

    res.json({
      message: '更新成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: '更新失败',
      error: error.message 
    });
  }
};

// 修改密码
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        message: '用户不存在' 
      });
    }

    // 验证旧密码
    const isValidPassword = await user.validatePassword(oldPassword);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: '旧密码错误' 
      });
    }

    // 更新密码
    await user.update({ password: newPassword });

    res.json({ 
      message: '密码修改成功' 
    });
  } catch (error) {
    res.status(500).json({ 
      message: '密码修改失败',
      error: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  getUserInfo,
  updateUserInfo,
  changePassword
}; 