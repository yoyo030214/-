const jwt = require('jsonwebtoken');
const config = require('../config');

const verifyToken = (req, res, next) => {
  console.log('验证令牌...');
  console.log('请求头:', req.headers);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('未提供令牌');
    return res.status(403).json({ 
      success: false,
      message: '未提供令牌'
    });
  }

  try {
    console.log('正在验证令牌:', token.substring(0, 10) + '...');
    const decoded = jwt.verify(token, config.jwtSecret);
    console.log('令牌验证成功, 用户:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('令牌验证失败:', err.message);
    return res.status(401).json({ 
      success: false,
      message: '无效的令牌',
      error: err.message
    });
  }
};

const isAdmin = (req, res, next) => {
  console.log('检查管理员权限...');
  console.log('用户信息:', req.user);
  
  // 由于当前系统只有单一管理员，所以这里简化处理
  // 对于商家后台，如果用户已经登录并通过了verifyToken验证，即视为管理员
  if (!req.user) {
    console.log('未找到用户信息');
    return res.status(403).json({ 
      success: false,
      message: '需要管理员权限'
    });
  }
  
  // 这里可以后续添加更细粒度的权限控制
  console.log('管理员验证通过');
  next();
};

module.exports = {
  verifyToken,
  isAdmin
}; 