const { Policy } = require('../models');

// 创建政策
const createPolicy = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      publishDate,
      effectiveDate,
      expiryDate,
      version
    } = req.body;

    const policy = await Policy.create({
      title,
      content,
      type,
      publishDate,
      effectiveDate,
      expiryDate,
      version,
      status: 'draft'
    });

    res.status(201).json({
      message: '政策创建成功',
      policy
    });
  } catch (error) {
    res.status(500).json({
      message: '创建政策失败',
      error: error.message
    });
  }
};

// 更新政策
const updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      type,
      status,
      publishDate,
      effectiveDate,
      expiryDate,
      version
    } = req.body;

    const policy = await Policy.findByPk(id);

    if (!policy) {
      return res.status(404).json({
        message: '政策不存在'
      });
    }

    await policy.update({
      title: title || policy.title,
      content: content || policy.content,
      type: type || policy.type,
      status: status || policy.status,
      publishDate: publishDate || policy.publishDate,
      effectiveDate: effectiveDate || policy.effectiveDate,
      expiryDate: expiryDate || policy.expiryDate,
      version: version || policy.version
    });

    res.json({
      message: '政策更新成功',
      policy
    });
  } catch (error) {
    res.status(500).json({
      message: '更新政策失败',
      error: error.message
    });
  }
};

// 获取政策列表
const getPolicies = async (req, res) => {
  try {
    const { type, status } = req.query;
    const where = {};

    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const policies = await Policy.findAll({
      where,
      order: [['publishDate', 'DESC']]
    });

    res.json(policies);
  } catch (error) {
    res.status(500).json({
      message: '获取政策列表失败',
      error: error.message
    });
  }
};

// 获取单个政策
const getPolicy = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await Policy.findByPk(id);

    if (!policy) {
      return res.status(404).json({
        message: '政策不存在'
      });
    }

    // 增加浏览量
    await policy.increment('views');

    res.json(policy);
  } catch (error) {
    res.status(500).json({
      message: '获取政策失败',
      error: error.message
    });
  }
};

// 删除政策
const deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await Policy.findByPk(id);

    if (!policy) {
      return res.status(404).json({
        message: '政策不存在'
      });
    }

    await policy.destroy();

    res.json({
      message: '政策删除成功'
    });
  } catch (error) {
    res.status(500).json({
      message: '删除政策失败',
      error: error.message
    });
  }
};

// 获取最新政策
const getLatestPolicies = async (req, res) => {
  try {
    const { type, limit = 5 } = req.query;
    const where = {
      status: 'published'
    };

    if (type) {
      where.type = type;
    }

    const policies = await Policy.findAll({
      where,
      order: [['publishDate', 'DESC']],
      limit: parseInt(limit)
    });

    res.json(policies);
  } catch (error) {
    res.status(500).json({
      message: '获取最新政策失败',
      error: error.message
    });
  }
};

module.exports = {
  createPolicy,
  updatePolicy,
  getPolicies,
  getPolicy,
  deletePolicy,
  getLatestPolicies
}; 