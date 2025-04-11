const db = require('../config/database');

// 获取购物车列表
exports.getCartItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const sql = `
      SELECT c.*, p.name, p.price, p.images, p.stock 
      FROM cart_items c
      LEFT JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.create_time DESC
    `;
    const cartItems = await db.query(sql, [userId]);
    res.json({
      code: 0,
      data: cartItems
    });
  } catch (error) {
    console.error('获取购物车列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取购物车列表失败'
    });
  }
};

// 添加商品到购物车
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    // 检查商品是否存在
    const [product] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({
        code: 404,
        message: '商品不存在'
      });
    }

    // 检查库存
    if (product.stock < quantity) {
      return res.status(400).json({
        code: 400,
        message: '商品库存不足'
      });
    }

    // 检查购物车是否已存在该商品
    const [existingItem] = await db.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existingItem) {
      // 更新数量
      await db.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
        [quantity, existingItem.id]
      );
    } else {
      // 新增购物车项
      await db.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
      );
    }

    res.json({
      code: 0,
      message: '添加成功'
    });
  } catch (error) {
    console.error('添加购物车失败:', error);
    res.status(500).json({
      code: 500,
      message: '添加购物车失败'
    });
  }
};

// 更新购物车商品数量
exports.updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    // 检查购物车项是否存在
    const [cartItem] = await db.query(
      'SELECT * FROM cart_items WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!cartItem) {
      return res.status(404).json({
        code: 404,
        message: '购物车项不存在'
      });
    }

    // 检查库存
    const [product] = await db.query('SELECT * FROM products WHERE id = ?', [cartItem.product_id]);
    if (product.stock < quantity) {
      return res.status(400).json({
        code: 400,
        message: '商品库存不足'
      });
    }

    // 更新数量
    await db.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, id]
    );

    res.json({
      code: 0,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新购物车失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新购物车失败'
    });
  }
};

// 删除购物车商品
exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '购物车项不存在'
      });
    }

    res.json({
      code: 0,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除购物车失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除购物车失败'
    });
  }
}; 