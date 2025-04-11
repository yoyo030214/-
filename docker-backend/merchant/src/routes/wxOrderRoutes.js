const express = require('express');
const router = express.Router();
const { MerchantOrder, MerchantOrderItem, MerchantProduct, Customer } = require('../../../database/src/models');
const { verifyToken } = require('../middlewares/authMiddleware');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// 创建订单
router.post('/orders', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { 
            merchantId, 
            items, 
            shippingAddress, 
            paymentMethod, 
            shippingMethod,
            note
        } = req.body;
        
        if (!merchantId || !items || !items.length || !shippingAddress || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: '订单信息不完整'
            });
        }
        
        // 生成订单号
        const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        // 计算订单总金额
        let totalAmount = 0;
        const productIds = items.map(item => item.productId);
        
        // 获取商品信息
        const products = await MerchantProduct.findAll({
            where: {
                id: { [Op.in]: productIds },
                merchantId
            }
        });
        
        if (products.length !== productIds.length) {
            return res.status(400).json({
                success: false,
                message: '部分商品不存在或不属于该商家'
            });
        }
        
        // 检查库存并计算总金额
        const orderItems = [];
        const productsToUpdate = [];
        
        for (const item of items) {
            const product = products.find(p => p.id === item.productId);
            
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `商品ID ${item.productId} 不存在`
                });
            }
            
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `商品 ${product.name} 库存不足`
                });
            }
            
            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;
            
            orderItems.push({
                id: uuidv4(),
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: product.price,
                totalPrice: itemTotal
            });
            
            // 减少库存，增加销量
            product.stock -= item.quantity;
            product.salesCount += item.quantity;
            productsToUpdate.push(product);
        }
        
        // 计算运费
        const shippingFee = 0; // 可以根据实际业务调整运费计算逻辑
        totalAmount += shippingFee;
        
        // 创建订单
        const order = await MerchantOrder.create({
            orderNumber,
            merchantId,
            customerId,
            totalAmount,
            status: '待付款',
            paymentStatus: '未支付',
            paymentMethod,
            shippingAddress,
            shippingFee,
            shippingMethod: shippingMethod || '普通快递',
            note,
            orderDate: new Date()
        });
        
        // 创建订单项
        for (const item of orderItems) {
            await MerchantOrderItem.create({
                ...item,
                orderId: order.id
            });
        }
        
        // 更新商品库存和销量
        for (const product of productsToUpdate) {
            await product.save();
        }
        
        // 更新客户订单统计
        const customer = await Customer.findByPk(customerId);
        if (customer) {
            await customer.update({
                totalOrders: (customer.totalOrders || 0) + 1,
                totalSpent: (customer.totalSpent || 0) + totalAmount,
                lastOrderDate: new Date()
            });
        }
        
        res.json({
            success: true,
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount,
                status: order.status
            },
            message: '订单创建成功'
        });
        
    } catch (error) {
        console.error('创建订单错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理创建订单时出错'
        });
    }
});

// 获取订单列表
router.get('/orders', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { 
            page = 1, 
            limit = 10, 
            status = '',
            sort = 'orderDate',
            order = 'DESC'
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        const whereClause = { customerId };
        if (status) whereClause.status = status;
        
        const { count, rows: orders } = await MerchantOrder.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: MerchantOrderItem,
                    as: 'items'
                }
            ],
            order: [[sort, order]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        const totalPages = Math.ceil(count / limit);
        
        res.json({
            success: true,
            orders,
            pagination: {
                total: count,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('获取订单列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理获取订单列表时出错'
        });
    }
});

// 获取订单详情
router.get('/orders/:id', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { id } = req.params;
        
        const order = await MerchantOrder.findOne({
            where: { id, customerId },
            include: [
                {
                    model: MerchantOrderItem,
                    as: 'items'
                }
            ]
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: '订单不存在或无权查看'
            });
        }
        
        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('获取订单详情错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理获取订单详情时出错'
        });
    }
});

// 取消订单
router.post('/orders/:id/cancel', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { id } = req.params;
        
        const order = await MerchantOrder.findOne({
            where: { id, customerId },
            include: [
                {
                    model: MerchantOrderItem,
                    as: 'items'
                }
            ]
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: '订单不存在或无权操作'
            });
        }
        
        if (order.status !== '待付款') {
            return res.status(400).json({
                success: false,
                message: '只有待付款订单可以取消'
            });
        }
        
        // 恢复商品库存
        for (const item of order.items) {
            const product = await MerchantProduct.findByPk(item.productId);
            if (product) {
                await product.update({
                    stock: product.stock + item.quantity,
                    salesCount: product.salesCount - item.quantity
                });
            }
        }
        
        // 更新订单状态
        await order.update({
            status: '已取消',
            cancelDate: new Date()
        });
        
        res.json({
            success: true,
            message: '订单已取消'
        });
    } catch (error) {
        console.error('取消订单错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理取消订单时出错'
        });
    }
});

// 确认收货
router.post('/orders/:id/confirm', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { id } = req.params;
        
        const order = await MerchantOrder.findOne({
            where: { id, customerId }
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: '订单不存在或无权操作'
            });
        }
        
        if (order.status !== '已发货') {
            return res.status(400).json({
                success: false,
                message: '只有已发货订单可以确认收货'
            });
        }
        
        // 更新订单状态
        await order.update({
            status: '已完成',
            completionDate: new Date()
        });
        
        res.json({
            success: true,
            message: '订单已确认收货'
        });
    } catch (error) {
        console.error('确认收货错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理确认收货时出错'
        });
    }
});

module.exports = router; 