const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Image, User } = require('../models');
const { Op } = require('sequelize');
const authenticateToken = require('../middleware/auth');

// 配置文件存储
const uploadDir = path.join(__dirname, '../../uploads');

// 确保上传目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 为不同类型的图片创建子目录
const categoryDirs = ['product', 'policy', 'avatar', 'temp'];
categoryDirs.forEach(dir => {
  const categoryDir = path.join(uploadDir, dir);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }
});

// 配置multer存储
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // 根据请求确定保存目录
    const category = req.body.category || 'temp';
    const dir = path.join(uploadDir, categoryDirs.includes(category) ? category : 'temp');
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器，只允许图片
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型。只允许上传JPG, PNG, GIF和WEBP图片'), false);
  }
};

// 配置上传
const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制5MB
  }
});

// 上传图片
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    // 获取文件信息
    const { filename, originalname, path: filePath, mimetype, size } = req.file;
    const { category = 'temp', relatedId = null, isPublic = true } = req.body;

    // 创建数据库记录
    const image = await Image.create({
      filename,
      originalname,
      path: filePath.replace(/\\/g, '/'),  // 统一路径分隔符
      mimetype,
      size,
      category,
      relatedId: relatedId ? parseInt(relatedId, 10) : null,
      uploadedBy: req.user.id,
      isPublic: isPublic === 'true' || isPublic === true
    });

    res.status(201).json({
      message: '图片上传成功',
      image: {
        id: image.id,
        filename,
        originalname,
        url: `/api/images/${image.id}`,
        mimetype,
        size,
        category,
        relatedId: image.relatedId,
        uploadedAt: image.createdAt
      }
    });
  } catch (error) {
    console.error('图片上传失败:', error);
    res.status(500).json({ message: '图片上传失败', error: error.message });
  }
});

// 获取图片
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findByPk(id);
    
    if (!image) {
      return res.status(404).json({ message: '图片不存在' });
    }

    // 检查权限（如果不是公开图片）
    if (!image.isPublic) {
      // 非公开图片需要登录
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        return res.status(401).json({ message: '需要认证才能访问此图片' });
      }
      
      try {
        const token = authHeader.split(' ')[1];
        const user = jwt.verify(token, process.env.JWT_SECRET);
        // 只有上传者和管理员可以访问非公开图片
        if (user.id !== image.uploadedBy && user.role !== 'admin') {
          return res.status(403).json({ message: '无权访问此图片' });
        }
      } catch (error) {
        return res.status(401).json({ message: '无效的认证' });
      }
    }

    // 发送文件
    res.sendFile(image.path);
  } catch (error) {
    console.error('获取图片失败:', error);
    res.status(500).json({ message: '获取图片失败', error: error.message });
  }
});

// 获取图片列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    // 过滤条件
    const { 
      category, 
      relatedId, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // 添加过滤条件
    if (category) where.category = category;
    if (relatedId) where.relatedId = relatedId;

    // 非管理员只能看到自己上传的和公开的图片
    if (req.user.role !== 'admin') {
      where[Op.or] = [
        { uploadedBy: req.user.id },
        { isPublic: true }
      ];
    }

    // 获取图片列表
    const { count, rows } = await Image.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'username', 'name']
        }
      ]
    });

    // 格式化结果
    const images = rows.map(img => ({
      id: img.id,
      filename: img.filename,
      originalname: img.originalname,
      url: `/api/images/${img.id}`,
      mimetype: img.mimetype,
      size: img.size,
      category: img.category,
      relatedId: img.relatedId,
      uploader: img.uploader ? {
        id: img.uploader.id,
        username: img.uploader.username,
        name: img.uploader.name
      } : null,
      isPublic: img.isPublic,
      createdAt: img.createdAt,
      updatedAt: img.updatedAt
    }));

    res.status(200).json({
      images,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取图片列表失败:', error);
    res.status(500).json({ message: '获取图片列表失败', error: error.message });
  }
});

// 删除图片
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findByPk(id);
    
    if (!image) {
      return res.status(404).json({ message: '图片不存在' });
    }

    // 权限检查：只有上传者或管理员可以删除
    if (image.uploadedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权删除此图片' });
    }

    // 删除文件
    if (fs.existsSync(image.path)) {
      fs.unlinkSync(image.path);
    }

    // 删除数据库记录
    await image.destroy();

    res.status(200).json({ message: '图片删除成功' });
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({ message: '删除图片失败', error: error.message });
  }
});

// 更新图片信息
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, relatedId, isPublic } = req.body;
    
    const image = await Image.findByPk(id);
    
    if (!image) {
      return res.status(404).json({ message: '图片不存在' });
    }

    // 权限检查：只有上传者或管理员可以更新
    if (image.uploadedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权更新此图片' });
    }

    // 更新信息
    const updates = {};
    if (category !== undefined) updates.category = category;
    if (relatedId !== undefined) updates.relatedId = relatedId ? parseInt(relatedId, 10) : null;
    if (isPublic !== undefined) updates.isPublic = isPublic === 'true' || isPublic === true;

    await image.update(updates);

    res.status(200).json({ 
      message: '图片信息更新成功',
      image: {
        id: image.id,
        filename: image.filename,
        originalname: image.originalname,
        url: `/api/images/${image.id}`,
        mimetype: image.mimetype,
        size: image.size,
        category: image.category,
        relatedId: image.relatedId,
        isPublic: image.isPublic,
        uploadedAt: image.createdAt,
        updatedAt: image.updatedAt
      }
    });
  } catch (error) {
    console.error('更新图片信息失败:', error);
    res.status(500).json({ message: '更新图片信息失败', error: error.message });
  }
});

// 获取特定类别的图片
router.get('/by-category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const where = { 
      category,
      isPublic: true  // 只返回公开图片
    };

    const { count, rows } = await Image.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    // 格式化结果
    const images = rows.map(img => ({
      id: img.id,
      filename: img.filename,
      originalname: img.originalname,
      url: `/api/images/${img.id}`,
      mimetype: img.mimetype,
      size: img.size,
      relatedId: img.relatedId,
      createdAt: img.createdAt
    }));

    res.status(200).json({
      images,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error(`获取${req.params.category}类别图片失败:`, error);
    res.status(500).json({ message: '获取图片失败', error: error.message });
  }
});

// 错误处理中间件
router.use((err, req, res, next) => {
  console.error('图片处理错误:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小超过限制(最大5MB)' });
    }
    return res.status(400).json({ message: `文件上传错误: ${err.message}` });
  }
  
  res.status(500).json({ message: err.message || '图片处理过程中发生错误' });
});

module.exports = router; 