const express = require('express');
const router = express.Router();
const { Merchant, MerchantProduct } = require('../../../database/src/models');
const { verifyToken } = require('../middlewares/authMiddleware');
const { Op } = require('sequelize');

// 获取商家列表
router.get('/merchants', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            sort = 'createdAt',
            order = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        
        const whereClause = {
            status: 'active', // 只获取激活状态的商家
            ...(search && {
                [Op.or]: [
                    { storeName: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } },
                ]
            })
        };
        
        const { count, rows: merchants } = await Merchant.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'storeName', 'contactPhone', 'address', 'description', 'logoImage'],
            order: [[sort, order]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        const totalPages = Math.ceil(count / limit);
        
        res.json({
            success: true,
            merchants,
            pagination: {
                total: count,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('获取商家列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理获取商家列表时出错'
        });
    }
});

// 获取商家详情
router.get('/merchants/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const merchant = await Merchant.findOne({
            where: { id, status: 'active' },
            attributes: [
                'id', 'storeName', 'contactName', 'contactPhone', 
                'email', 'address', 'description', 'logoImage', 
                'businessHours', 'memberLevel'
            ]
        });
        
        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: '商家不存在或已停业'
            });
        }
        
        // 获取商家的商品数量
        const productCount = await MerchantProduct.count({
            where: { 
                merchantId: id,
                isOnSale: true
            }
        });
        
        // 获取推荐商品
        const recommendedProducts = await MerchantProduct.findAll({
            where: { 
                merchantId: id, 
                isOnSale: true,
                isRecommended: true
            },
            limit: 5,
            order: [['salesCount', 'DESC']]
        });
        
        res.json({
            success: true,
            merchant: {
                ...merchant.toJSON(),
                productCount,
                recommendedProducts
            }
        });
    } catch (error) {
        console.error('获取商家详情错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理获取商家详情时出错'
        });
    }
});

// 获取商家的商品分类
router.get('/merchants/:id/categories', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 检查商家是否存在
        const merchant = await Merchant.findOne({
            where: { id, status: 'active' }
        });
        
        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: '商家不存在或已停业'
            });
        }
        
        // 获取所有分类
        const products = await MerchantProduct.findAll({
            attributes: ['category'],
            where: { 
                merchantId: id,
                isOnSale: true
            },
            group: ['category']
        });
        
        const categories = products.map(product => product.category).filter(Boolean);
        
        res.json({
            success: true,
            merchantId: id,
            categories
        });
    } catch (error) {
        console.error('获取商家商品分类错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理获取商家商品分类时出错'
        });
    }
});

module.exports = router; 