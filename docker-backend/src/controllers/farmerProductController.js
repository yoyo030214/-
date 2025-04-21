const { FarmerProduct, User } = require('../models');

// 创建农户产品
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      unit,
      images,
      category,
      subCategory,
      origin,
      shelfLife,
      storageMethod,
      stock
    } = req.body;

    // 验证分类是否有效
    const validCategories = ['vegetable', 'fruit', 'meat', 'seafood'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        message: '无效的产品分类'
      });
    }

    const product = await FarmerProduct.create({
      name,
      description,
      price,
      unit,
      images,
      category,
      subCategory,
      origin,
      shelfLife,
      storageMethod,
      stock,
      farmerId: req.user.id,
      status: 'available'
    });

    res.status(201).json({
      message: '产品创建成功',
      product
    });
  } catch (error) {
    res.status(500).json({
      message: '创建产品失败',
      error: error.message
    });
  }
};

// 更新农户产品
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      unit,
      images,
      category,
      subCategory,
      origin,
      shelfLife,
      storageMethod,
      stock,
      status
    } = req.body;

    const product = await FarmerProduct.findOne({
      where: {
        id,
        farmerId: req.user.id
      }
    });

    if (!product) {
      return res.status(404).json({
        message: '产品不存在或无权修改'
      });
    }

    await product.update({
      name: name || product.name,
      description: description || product.description,
      price: price || product.price,
      unit: unit || product.unit,
      images: images || product.images,
      category: category || product.category,
      subCategory: subCategory || product.subCategory,
      origin: origin || product.origin,
      shelfLife: shelfLife || product.shelfLife,
      storageMethod: storageMethod || product.storageMethod,
      stock: stock || product.stock,
      status: status || product.status
    });

    res.json({
      message: '产品更新成功',
      product
    });
  } catch (error) {
    res.status(500).json({
      message: '更新产品失败',
      error: error.message
    });
  }
};

// 获取产品列表
const getProducts = async (req, res) => {
  try {
    const { farmerId, category, status, isRecommended } = req.query;
    const where = {};

    if (farmerId) {
      where.farmerId = farmerId;
    }
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }
    if (isRecommended !== undefined) {
      where.isRecommended = isRecommended;
    }

    const products = await FarmerProduct.findAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'username', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: '获取产品列表失败',
      error: error.message
    });
  }
};

// 获取单个产品
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await FarmerProduct.findOne({
      where: { id },
      include: [{
        model: User,
        attributes: ['id', 'username', 'avatar']
      }]
    });

    if (!product) {
      return res.status(404).json({
        message: '产品不存在'
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: '获取产品失败',
      error: error.message
    });
  }
};

// 删除产品
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await FarmerProduct.findOne({
      where: {
        id,
        farmerId: req.user.id
      }
    });

    if (!product) {
      return res.status(404).json({
        message: '产品不存在或无权删除'
      });
    }

    await product.destroy();

    res.json({
      message: '产品删除成功'
    });
  } catch (error) {
    res.status(500).json({
      message: '删除产品失败',
      error: error.message
    });
  }
};

// 更新产品推荐状态
const updateRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRecommended } = req.body;

    const product = await FarmerProduct.findOne({
      where: {
        id,
        farmerId: req.user.id
      }
    });

    if (!product) {
      return res.status(404).json({
        message: '产品不存在或无权修改'
      });
    }

    await product.update({ isRecommended });

    res.json({
      message: '推荐状态更新成功',
      product
    });
  } catch (error) {
    res.status(500).json({
      message: '更新推荐状态失败',
      error: error.message
    });
  }
};

// 获取分类产品列表
const getProductsByCategory = async (req, res) => {
  try {
    const { category, subCategory } = req.query;
    const where = { status: 'available' };

    if (category) {
      where.category = category;
    }
    if (subCategory) {
      where.subCategory = subCategory;
    }

    const products = await FarmerProduct.findAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'username', 'avatar']
      }],
      order: [
        ['isRecommended', 'DESC'],
        ['sales', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: '获取产品列表失败',
      error: error.message
    });
  }
};

// 获取推荐产品
const getRecommendedProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const where = {
      isRecommended: true,
      status: 'available'
    };

    if (category) {
      where.category = category;
    }

    const products = await FarmerProduct.findAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'username', 'avatar']
      }],
      order: [['sales', 'DESC']],
      limit: 10
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: '获取推荐产品失败',
      error: error.message
    });
  }
};

// 获取商家产品列表
const getMerchantProducts = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { category, status } = req.query;
    const where = { farmerId };

    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }

    const products = await FarmerProduct.findAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'username', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: '获取商家产品列表失败',
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateRecommendation,
  getProductsByCategory,
  getRecommendedProducts,
  getMerchantProducts
}; 