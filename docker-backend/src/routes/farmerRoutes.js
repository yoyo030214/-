const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const farmerStoryController = require('../controllers/farmerStoryController');
const farmerProductController = require('../controllers/farmerProductController');

// 农户故事路由
router.post('/stories', authenticateToken, checkRole(['merchant']), farmerStoryController.createStory);
router.put('/stories/:id', authenticateToken, checkRole(['merchant']), farmerStoryController.updateStory);
router.get('/stories', farmerStoryController.getStories);
router.get('/stories/:id', farmerStoryController.getStory);
router.delete('/stories/:id', authenticateToken, checkRole(['merchant']), farmerStoryController.deleteStory);

// 农户产品路由
router.post('/products', authenticateToken, checkRole(['merchant']), farmerProductController.createProduct);
router.put('/products/:id', authenticateToken, checkRole(['merchant']), farmerProductController.updateProduct);
router.get('/products', farmerProductController.getProducts);
router.get('/products/:id', farmerProductController.getProduct);
router.delete('/products/:id', authenticateToken, checkRole(['merchant']), farmerProductController.deleteProduct);
router.put('/products/:id/recommend', authenticateToken, checkRole(['merchant']), farmerProductController.updateRecommendation);

// 新增路由
router.get('/products/category', farmerProductController.getProductsByCategory);
router.get('/products/recommended', farmerProductController.getRecommendedProducts);
router.get('/merchants/:farmerId/products', farmerProductController.getMerchantProducts);

module.exports = router; 