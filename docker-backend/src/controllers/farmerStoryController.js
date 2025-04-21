const { FarmerStory, User } = require('../models');

// 创建农户故事
const createStory = async (req, res) => {
  try {
    const { title, content, images, type, relatedProductId, location } = req.body;
    const farmerId = req.user.id;

    // 验证故事类型
    const validTypes = ['farm', 'product', 'merchant', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: '无效的故事类型'
      });
    }

    const story = await FarmerStory.create({
      title,
      content,
      images,
      type,
      relatedProductId,
      location,
      farmerId,
      status: 'draft'
    });

    res.status(201).json({
      message: '故事创建成功',
      story
    });
  } catch (error) {
    res.status(500).json({
      message: '创建故事失败',
      error: error.message
    });
  }
};

// 更新农户故事
const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, images, type, relatedProductId, location, status } = req.body;

    const story = await FarmerStory.findOne({
      where: {
        id,
        farmerId: req.user.id
      }
    });

    if (!story) {
      return res.status(404).json({
        message: '故事不存在或无权修改'
      });
    }

    await story.update({
      title: title || story.title,
      content: content || story.content,
      images: images || story.images,
      type: type || story.type,
      relatedProductId: relatedProductId || story.relatedProductId,
      location: location || story.location,
      status: status || story.status
    });

    res.json({
      message: '故事更新成功',
      story
    });
  } catch (error) {
    res.status(500).json({
      message: '更新故事失败',
      error: error.message
    });
  }
};

// 获取故事列表
const getStories = async (req, res) => {
  try {
    const { farmerId, type, status } = req.query;
    const where = {};

    if (farmerId) {
      where.farmerId = farmerId;
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const stories = await FarmerStory.findAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'username', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(stories);
  } catch (error) {
    res.status(500).json({
      message: '获取故事列表失败',
      error: error.message
    });
  }
};

// 获取单个故事
const getStory = async (req, res) => {
  try {
    const { id } = req.params;

    const story = await FarmerStory.findOne({
      where: { id },
      include: [{
        model: User,
        attributes: ['id', 'username', 'avatar']
      }]
    });

    if (!story) {
      return res.status(404).json({
        message: '故事不存在'
      });
    }

    // 增加浏览量
    await story.increment('views');

    res.json(story);
  } catch (error) {
    res.status(500).json({
      message: '获取故事失败',
      error: error.message
    });
  }
};

// 删除故事
const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;

    const story = await FarmerStory.findOne({
      where: {
        id,
        farmerId: req.user.id
      }
    });

    if (!story) {
      return res.status(404).json({
        message: '故事不存在或无权删除'
      });
    }

    await story.destroy();

    res.json({
      message: '故事删除成功'
    });
  } catch (error) {
    res.status(500).json({
      message: '删除故事失败',
      error: error.message
    });
  }
};

module.exports = {
  createStory,
  updateStory,
  getStories,
  getStory,
  deleteStory
}; 