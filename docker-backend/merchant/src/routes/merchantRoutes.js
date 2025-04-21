const express = require('express');
const router = express.Router();
const path = require('path');
const authenticateToken = require('../middleware/auth');

// 商家管理界面首页
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/admin/index.html'));
});

// 商品管理页面
router.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/admin/products.html'));
});

// 订单管理页面
router.get('/orders', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/admin/orders.html'));
});

// 图片管理页面
router.get('/images', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/admin/images.html'));
});

// 用户管理页面
router.get('/users', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/admin/users.html'));
});

module.exports = router; 