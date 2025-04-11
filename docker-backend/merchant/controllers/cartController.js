const db = require('../models');
const { Cart, Product, ProductImage } = db;
const { SeasonalUtil } = require('../utils/seasonalUtil');

// 获取购物车列表
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取购物车商品
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{
        model: Product,
        include: [{
          model: ProductImage,
          attributes: ['url']
        }]
      }]
    });

    // 处理商品数据
    const items = cartItems.map(item => {
      const product = item.Product;
      const images = product.ProductImages.map(img => img.url);
      
      // 获取季节性信息
      const isInSeason = SeasonalUtil.isInSeason(product);
      const seasonalTags = SeasonalUtil.getSeasonalTags(product);

      return {
        id: item.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        images,
        quantity: item.quantity,
        stock: product.stock,
        selected: item.selected,
        isInSeason,
        seasonalTags,
        seasons: product.seasons
      };
    });

    res.json({
      success: true,
      data: { items }
    });
  } catch (error) {
    console.error('获取购物车失败:', error);
    res.status(500).json({
      success: false,
      message: '获取购物车失败'
    });
  }
};

// 添加商品到购物车
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    // 检查商品是否存在
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    // 检查库存
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: '商品库存不足'
      });
    }

    // 检查购物车是否已存在该商品
    let cartItem = await Cart.findOne({
      where: {
        userId,
        productId
      }
    });

    if (cartItem) {
      // 更新数量
      const newQuantity = cartItem.quantity + quantity;
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: '商品库存不足'
        });
      }
      await cartItem.update({ quantity: newQuantity });
    } else {
      // 创建新购物车项
      await Cart.create({
        userId,
        productId,
        quantity,
        selected: true
      });
    }

    res.json({
      success: true,
      message: '添加成功'
    });
  } catch (error) {
    console.error('添加购物车失败:', error);
    res.status(500).json({
      success: false,
      message: '添加购物车失败'
    });
  }
};

// 更新购物车商品数量
exports.updateQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    // 检查商品是否存在
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    // 检查库存
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: '商品库存不足'
      });
    }

    // 更新购物车商品数量
    await Cart.update(
      { quantity },
      {
        where: {
          userId,
          productId
        }
      }
    );

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新购物车失败:', error);
    res.status(500).json({
      success: false,
      message: '更新购物车失败'
    });
  }
};

// 选择/取消选择商品
exports.selectItem = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // 获取当前选中状态
    const cartItem = await Cart.findOne({
      where: {
        userId,
        productId
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    // 更新选中状态
    await cartItem.update({
      selected: !cartItem.selected
    });

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新选中状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新选中状态失败'
    });
  }
};

// 全选/取消全选
exports.selectAll = async (req, res) => {
  try {
    const { selected } = req.body;
    const userId = req.user.id;

    // 更新所有商品的选中状态
    await Cart.update(
      { selected },
      {
        where: { userId }
      }
    );

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新全选状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新全选状态失败'
    });
  }
};

// 删除购物车商品
exports.removeItem = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // 删除购物车商品
    await Cart.destroy({
      where: {
        userId,
        productId
      }
    });

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除购物车商品失败:', error);
    res.status(500).json({
      success: false,
      message: '删除购物车商品失败'
    });
  }
};

// 清空购物车
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // 清空购物车
    await Cart.destroy({
      where: { userId }
    });

    res.json({
      success: true,
      message: '清空成功'
    });
  } catch (error) {
    console.error('清空购物车失败:', error);
    res.status(500).json({
      success: false,
      message: '清空购物车失败'
    });
  }
}; 