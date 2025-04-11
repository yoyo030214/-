const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth');

// 获取购物车列表
router.get('/', auth, cartController.getCart);

// 添加商品到购物车
router.post('/add', auth, cartController.addToCart);

// 更新购物车商品数量
router.post('/update', auth, cartController.updateQuantity);

// 选择/取消选择商品
router.post('/select', auth, cartController.selectItem);

// 全选/取消全选
router.post('/select-all', auth, cartController.selectAll);

// 删除购物车商品
router.post('/remove', auth, cartController.removeItem);

// 清空购物车
router.post('/clear', auth, cartController.clearCart);

module.exports = router; 