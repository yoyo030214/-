const express = require('express');
const router = express.Router();
const { Customer, MerchantProduct } = require('../../../database/src/models');
const { verifyToken } = require('../middlewares/authMiddleware');
const { Op } = require('sequelize');

// 获取购物车
router.get('/cart', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        
        const customer = await Customer.findByPk(customerId);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: '未找到用户信息'
            });
        }
        
        // 获取购物车数据（假设购物车数据存储在customer表的cartItems字段中，实际中可能需要单独的购物车表）
        let cartItems = [];
        
        if (customer.cartItems) {
            try {
                cartItems = JSON.parse(customer.cartItems);
            } catch (err) {
                console.error('解析购物车数据错误:', err);
            }
        }
        
        // 如果购物车不为空，获取最新的商品信息
        if (cartItems.length > 0) {
            const productIds = cartItems.map(item => item.productId);
            
            const products = await MerchantProduct.findAll({
                where: {
                    id: { [Op.in]: productIds }
                }
            });
            
            // 更新购物车项的最新商品信息
            cartItems = cartItems.map(item => {
                const product = products.find(p => p.id === item.productId);
                
                if (!product) {
                    // 商品不存在或已下架
                    return {
                        ...item,
                        productExists: false
                    };
                }
                
                return {
                    ...item,
                    productName: product.name,
                    price: product.price,
                    image: product.images && product.images.length > 0 ? product.images[0] : null,
                    stock: product.stock,
                    totalPrice: product.price * item.quantity,
                    productExists: true,
                    isOnSale: product.isOnSale
                };
            });
            
            // 过滤掉不存在或已下架的商品
            const validItems = cartItems.filter(item => item.productExists && item.isOnSale);
            const invalidItems = cartItems.filter(item => !item.productExists || !item.isOnSale);
            
            // 如果有不存在或已下架的商品，更新购物车
            if (invalidItems.length > 0) {
                await customer.update({
                    cartItems: JSON.stringify(validItems)
                });
                
                cartItems = validItems;
            }
        }
        
        // 计算总价和商品总数
        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        
        res.json({
            success: true,
            cart: {
                items: cartItems,
                totalAmount,
                totalItems
            }
        });
    } catch (error) {
        console.error('获取购物车错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理获取购物车时出错'
        });
    }
});

// 添加商品到购物车
router.post('/cart', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { productId, quantity = 1, merchantId } = req.body;
        
        if (!productId || !merchantId) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }
        
        // 检查商品是否存在
        const product = await MerchantProduct.findOne({
            where: {
                id: productId,
                merchantId,
                isOnSale: true
            }
        });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: '商品不存在或已下架'
            });
        }
        
        // 检查库存
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: '商品库存不足'
            });
        }
        
        const customer = await Customer.findByPk(customerId);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: '未找到用户信息'
            });
        }
        
        // 获取当前购物车
        let cartItems = [];
        
        if (customer.cartItems) {
            try {
                cartItems = JSON.parse(customer.cartItems);
            } catch (err) {
                console.error('解析购物车数据错误:', err);
            }
        }
        
        // 检查商品是否已在购物车中
        const existingItemIndex = cartItems.findIndex(item => item.productId === productId);
        
        if (existingItemIndex !== -1) {
            // 更新数量
            cartItems[existingItemIndex].quantity += quantity;
            
            // 检查更新后数量是否超过库存
            if (cartItems[existingItemIndex].quantity > product.stock) {
                cartItems[existingItemIndex].quantity = product.stock;
            }
        } else {
            // 添加新商品
            cartItems.push({
                productId,
                merchantId,
                quantity,
                addedAt: new Date().toISOString()
            });
        }
        
        // 更新购物车
        await customer.update({
            cartItems: JSON.stringify(cartItems)
        });
        
        res.json({
            success: true,
            message: '商品已添加到购物车',
            cartItemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
        });
    } catch (error) {
        console.error('添加商品到购物车错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理添加商品到购物车时出错'
        });
    }
});

// 更新购物车商品数量
router.put('/cart/:productId', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { productId } = req.params;
        const { quantity } = req.body;
        
        if (!productId || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }
        
        // 检查商品是否存在
        const product = await MerchantProduct.findByPk(productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }
        
        // 检查库存
        if (quantity > 0 && product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: '商品库存不足'
            });
        }
        
        const customer = await Customer.findByPk(customerId);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: '未找到用户信息'
            });
        }
        
        // 获取当前购物车
        let cartItems = [];
        
        if (customer.cartItems) {
            try {
                cartItems = JSON.parse(customer.cartItems);
            } catch (err) {
                console.error('解析购物车数据错误:', err);
            }
        }
        
        // 查找商品在购物车中的位置
        const itemIndex = cartItems.findIndex(item => item.productId === productId);
        
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '购物车中找不到该商品'
            });
        }
        
        if (quantity <= 0) {
            // 如果数量为0或负数，移除该商品
            cartItems.splice(itemIndex, 1);
        } else {
            // 更新数量
            cartItems[itemIndex].quantity = quantity;
        }
        
        // 更新购物车
        await customer.update({
            cartItems: JSON.stringify(cartItems)
        });
        
        // 计算总价和商品总数
        let totalAmount = 0;
        let totalItems = 0;
        
        if (cartItems.length > 0) {
            const productIds = cartItems.map(item => item.productId);
            
            const products = await MerchantProduct.findAll({
                where: {
                    id: { [Op.in]: productIds }
                }
            });
            
            cartItems = cartItems.map(item => {
                const product = products.find(p => p.id === item.productId);
                
                if (product) {
                    totalAmount += product.price * item.quantity;
                    totalItems += item.quantity;
                }
                
                return {
                    ...item,
                    productName: product ? product.name : '未知商品',
                    price: product ? product.price : 0,
                    image: product && product.images && product.images.length > 0 ? product.images[0] : null,
                    totalPrice: product ? product.price * item.quantity : 0
                };
            });
        }
        
        res.json({
            success: true,
            message: '购物车已更新',
            cart: {
                items: cartItems,
                totalAmount,
                totalItems
            }
        });
    } catch (error) {
        console.error('更新购物车错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理更新购物车时出错'
        });
    }
});

// 删除购物车商品
router.delete('/cart/:productId', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { productId } = req.params;
        
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }
        
        const customer = await Customer.findByPk(customerId);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: '未找到用户信息'
            });
        }
        
        // 获取当前购物车
        let cartItems = [];
        
        if (customer.cartItems) {
            try {
                cartItems = JSON.parse(customer.cartItems);
            } catch (err) {
                console.error('解析购物车数据错误:', err);
            }
        }
        
        // 查找商品在购物车中的位置
        const itemIndex = cartItems.findIndex(item => item.productId === productId);
        
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '购物车中找不到该商品'
            });
        }
        
        // 移除商品
        cartItems.splice(itemIndex, 1);
        
        // 更新购物车
        await customer.update({
            cartItems: JSON.stringify(cartItems)
        });
        
        res.json({
            success: true,
            message: '商品已从购物车中移除',
            cartItemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
        });
    } catch (error) {
        console.error('删除购物车商品错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理删除购物车商品时出错'
        });
    }
});

// 清空购物车
router.delete('/cart', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        
        const customer = await Customer.findByPk(customerId);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: '未找到用户信息'
            });
        }
        
        // 清空购物车
        await customer.update({
            cartItems: JSON.stringify([])
        });
        
        res.json({
            success: true,
            message: '购物车已清空'
        });
    } catch (error) {
        console.error('清空购物车错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理清空购物车时出错'
        });
    }
});

module.exports = router; 