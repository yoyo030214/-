const express = require('express');
const router = express.Router();
const productController = require('../controllers/product');
const cartController = require('../controllers/cart');
const orderController = require('../controllers/order');
const userController = require('../controllers/user');
const auth = require('../middleware/auth');

// 商品相关路由
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductDetail);
router.get('/categories', productController.getCategories);

// 购物车相关路由
router.get('/cart', auth, cartController.getCartItems);
router.post('/cart', auth, cartController.addToCart);
router.put('/cart/:id', auth, cartController.updateCartItemQuantity);
router.delete('/cart/:id', auth, cartController.removeCartItem);

// 订单相关路由
router.post('/orders', auth, orderController.createOrder);
router.get('/orders', auth, orderController.getOrders);
router.get('/orders/:id', auth, orderController.getOrderDetail);
router.post('/orders/:id/cancel', auth, orderController.cancelOrder);
router.post('/orders/:id/confirm', auth, orderController.confirmOrder);
router.delete('/orders/:id', auth, orderController.deleteOrder);
router.get('/orders/:id/pay', auth, orderController.getOrderPayParams);
router.get('/orders/:id/logistics', auth, orderController.getOrderLogistics);

// 用户相关路由
router.post('/user/login', userController.login);
router.get('/user/info', auth, userController.getUserInfo);
router.put('/user/info', auth, userController.updateUserInfo);

module.exports = router; 