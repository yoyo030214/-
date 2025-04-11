const express = require('express');
const router = express.Router();
const PolicyController = require('../controllers/policyController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// 公共路由 - 不需要权限
router.get('/policies', PolicyController.getAllPolicies);
router.get('/policies/:id', PolicyController.getPolicyById);

// 需要管理员权限的路由
router.post('/policies/fetch', verifyToken, isAdmin, PolicyController.fetchPolicies);
router.put('/policies/:id', verifyToken, isAdmin, PolicyController.updatePolicy);
router.delete('/policies/:id', verifyToken, isAdmin, PolicyController.deletePolicy);

module.exports = router; 