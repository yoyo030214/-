const express = require('express');
const router = express.Router();
const { Policy, PolicyFavorite, User, sequelize } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

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

// 获取所有农业政策
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      keyword, 
      page = 1, 
      limit = 10,
      sort = 'publishDate',
      order = 'DESC'
    } = req.query;
    
    // 构建查询条件
    const whereCondition = { isActive: true };
    if (category) whereCondition.category = category;
    if (keyword) {
      whereCondition[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { summary: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    // 分页
    const offset = (page - 1) * limit;
    
    // 排序
    let orderOption = [[sort, order]];
    
    // 查询政策
    const policies = await Policy.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: orderOption,
      attributes: { exclude: ['content'] } // 列表不需要返回完整内容
    });
    
    // 计算总页数
    const totalPages = Math.ceil(policies.count / limit);
    
    res.status(200).json({
      policies: policies.rows,
      totalCount: policies.count,
      totalPages,
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('获取政策列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取政策详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询政策
    const policy = await Policy.findByPk(id);
    
    if (!policy) {
      return res.status(404).json({ message: '政策不存在' });
    }
    
    // 如果政策不活跃且不是管理员请求，则拒绝访问
    if (!policy.isActive) {
      // 检查是否是管理员
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(403).json({ message: '该政策不可访问' });
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
          return res.status(403).json({ message: '该政策不可访问' });
        }
      } catch (err) {
        return res.status(403).json({ message: '该政策不可访问' });
      }
    }
    
    // 更新浏览次数
    await policy.update({ viewCount: policy.viewCount + 1 });
    
    res.status(200).json({ policy });
  } catch (error) {
    console.error('获取政策详情失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取政策分类
router.get('/categories/list', async (req, res) => {
  try {
    // 从数据库获取分类统计
    const categories = await Policy.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['category'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });
    
    // 格式化结果
    const formattedCategories = categories.map((item, index) => ({
      id: index + 1,
      name: item.category,
      count: parseInt(item.get('count'))
    }));
    
    res.status(200).json({ categories: formattedCategories });
  } catch (error) {
    console.error('获取政策分类失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 收藏政策（需要认证）
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 检查政策是否存在
    const policy = await Policy.findByPk(id);
    if (!policy) {
      return res.status(404).json({ message: '政策不存在' });
    }
    
    // 检查是否已经收藏
    const existingFavorite = await PolicyFavorite.findOne({
      where: {
        userId,
        policyId: id
      }
    });
    
    if (existingFavorite) {
      return res.status(400).json({ message: '已经收藏过该政策' });
    }
    
    // 创建收藏记录
    await PolicyFavorite.create({
      userId,
      policyId: parseInt(id)
    });
    
    res.status(200).json({
      message: '政策收藏成功',
      policyId: parseInt(id),
      userId
    });
  } catch (error) {
    console.error('收藏政策失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 取消收藏政策（需要认证）
router.delete('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 查找收藏记录
    const favorite = await PolicyFavorite.findOne({
      where: {
        userId,
        policyId: id
      }
    });
    
    if (!favorite) {
      return res.status(404).json({ message: '未找到收藏记录' });
    }
    
    // 删除收藏记录
    await favorite.destroy();
    
    res.status(200).json({
      message: '取消收藏成功',
      policyId: parseInt(id),
      userId
    });
  } catch (error) {
    console.error('取消收藏政策失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户收藏的政策（需要认证）
router.get('/favorites/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 查询用户收藏的政策
    const favorites = await PolicyFavorite.findAll({
      where: { userId },
      include: [
        {
          model: Policy,
          as: 'policy',
          where: { isActive: true },
          attributes: ['id', 'title', 'summary', 'category', 'publishDate', 'source']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // 格式化结果
    const formattedFavorites = favorites.map(favorite => ({
      id: favorite.policy.id,
      title: favorite.policy.title,
      summary: favorite.policy.summary,
      category: favorite.policy.category,
      publishDate: favorite.policy.publishDate,
      source: favorite.policy.source,
      favoriteDate: favorite.createdAt
    }));
    
    res.status(200).json({ favorites: formattedFavorites });
  } catch (error) {
    console.error('获取收藏政策失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户是否收藏了某政策（需要认证）
router.get('/:id/favorite/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 查找收藏记录
    const favorite = await PolicyFavorite.findOne({
      where: {
        userId,
        policyId: id
      }
    });
    
    res.status(200).json({
      isFavorite: !!favorite,
      policyId: parseInt(id)
    });
  } catch (error) {
    console.error('获取收藏状态失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 