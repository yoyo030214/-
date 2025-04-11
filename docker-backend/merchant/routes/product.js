const express = require('express');
const router = express.Router();
const productController = require('../controllers/product');

// 获取商品列表
router.get('/list', productController.getProducts);

// 获取商品详情
router.get('/detail/:id', productController.getProductDetail);

// 创建商品
router.post('/create', productController.createProduct);

// 更新商品
router.put('/update/:id', productController.updateProduct);

// 删除商品
router.delete('/delete/:id', productController.deleteProduct);

// 批量更新商品状态
router.post('/batch/status', productController.batchUpdateStatus);

module.exports = router; 