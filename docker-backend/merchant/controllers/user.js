const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 用户登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查询用户
    const [user] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 生成token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      code: 0,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      code: 500,
      message: '登录失败'
    });
  }
};

// 获取用户信息
exports.getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const [user] = await db.query(
      'SELECT id, username, nickname, avatar FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    res.json({
      code: 0,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败'
    });
  }
};

// 更新用户信息
exports.updateUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nickname, avatar } = req.body;

    await db.query(
      'UPDATE users SET nickname = ?, avatar = ? WHERE id = ?',
      [nickname, avatar, userId]
    );

    res.json({
      code: 0,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新用户信息失败'
    });
  }
}; 