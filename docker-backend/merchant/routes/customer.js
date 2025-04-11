const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer');

// 获取客户列表
router.get('/list', customerController.getCustomers);

// 获取客户详情
router.get('/detail/:id', customerController.getCustomerDetail);

// 创建客户
router.post('/create', customerController.createCustomer);

// 更新客户信息
router.put('/update/:id', customerController.updateCustomer);

// 更新客户状态
router.put('/status/:id', customerController.updateCustomerStatus);

module.exports = router; 