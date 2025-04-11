const express = require('express');
const router = express.Router();
const { MerchantProduct, Merchant } = require('../../../database/src/models');
const { verifyToken } = require('../middlewares/authMiddleware');
const { Op } = require('sequelize');

// 获取商品列表
router.get('/products', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            category = '', 
            sort = 'createdAt',
            order = 'DESC',
            merchantId
        } = req.query;

        const offset = (page - 1) * limit;
        
        const whereClause = {
            ...(search && {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } },
                ]
            }),
            ...(category && { category }),
            ...(merchantId && { merchantId })
        };

        // 添加过滤条件，只获取上架的商品
        whereClause.isOnSale = true;
        
        const { count, rows: products } = await MerchantProduct.findAndCountAll({
            where: whereClause,
            order: [[sort, order]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        const totalPages = Math.ceil(count / limit);
        
        res.json({
            success: true,
            products,
            pagination: {
                total: count,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('获取商品列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理获取商品列表时出错'
        });
    }
});

// 获取商品详情
router.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await MerchantProduct.findByPk(id, {
            include: [
                {
                    model: Merchant,
                    attributes: ['id', 'storeName', 'contactPhone', 'address']
                }
            ]
        });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }
        
        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('获取商品详情错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理获取商品详情时出错'
        });
    }
});

// 获取推荐商品
router.get('/recommended-products', async (req, res) => {
    try {
        const { limit = 5, merchantId } = req.query;
        
        const whereClause = {
            isRecommended: true,
            isOnSale: true,
            ...(merchantId && { merchantId })
        };
        
        const products = await MerchantProduct.findAll({
            where: whereClause,
            limit: parseInt(limit),
            order: [['salesCount', 'DESC']]
        });
        
        res.json({
            success: true,
            products
        });
    } catch (error) {
        console.error('获取推荐商品错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理获取推荐商品时出错'
        });
    }
});

// 获取商品分类
router.get('/product-categories', async (req, res) => {
    try {
        const { merchantId } = req.query;
        
        const whereClause = merchantId ? { merchantId } : {};
        
        // 获取所有商品的分类
        const products = await MerchantProduct.findAll({
            attributes: ['category'],
            where: whereClause,
            group: ['category']
        });
        
        const categories = products.map(product => product.category).filter(Boolean);
        
        res.json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('获取商品分类错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理获取商品分类时出错'
        });
    }
});

// 获取地图产品列表
router.get('/map-products', async (req, res) => {
    try {
        const { 
            longitude, 
            latitude, 
            radius = 5000, // 默认5公里半径
            filter = 'all',
            page = 1,
            limit = 20
        } = req.query;

        const offset = (page - 1) * limit;
        
        // 构建查询条件
        const whereClause = {
            isOnSale: true,
            latitude: {
                [Op.between]: [parseFloat(latitude) - 0.05, parseFloat(latitude) + 0.05]
            },
            longitude: {
                [Op.between]: [parseFloat(longitude) - 0.05, parseFloat(longitude) + 0.05]
            }
        };

        // 添加筛选条件
        if (filter === 'seasonal') {
            whereClause.isSeasonal = true;
        } else if (filter === 'local') {
            whereClause.isLocal = true;
        }

        // 查询产品
        const { count, rows: products } = await MerchantProduct.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Merchant,
                    attributes: ['id', 'storeName', 'contactPhone', 'address']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // 计算距离并过滤
        const filteredProducts = products.filter(product => {
            const distance = calculateDistance(
                parseFloat(latitude),
                parseFloat(longitude),
                parseFloat(product.latitude),
                parseFloat(product.longitude)
            );
            return distance <= radius;
        });

        // 处理产品数据
        const processedProducts = filteredProducts.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            images: product.images || [],
            latitude: product.latitude,
            longitude: product.longitude,
            location: product.Merchant.address,
            isSeasonal: product.isSeasonal,
            isLocal: product.isLocal,
            merchant: {
                id: product.Merchant.id,
                name: product.Merchant.storeName,
                phone: product.Merchant.contactPhone
            }
        }));

        res.json({
            success: true,
            products: processedProducts,
            pagination: {
                total: count,
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('获取地图产品列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理获取地图产品列表时出错'
        });
    }
});

// 计算两点之间的距离（单位：米）
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 地球半径（米）
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degree) {
    return degree * Math.PI / 180;
}

// 获取季节性产品推荐
router.get('/seasonal-products', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        // 获取当前月份
        const currentMonth = new Date().getMonth() + 1;
        
        // 根据月份确定季节
        let season;
        if (currentMonth >= 3 && currentMonth <= 5) {
            season = 'spring';
        } else if (currentMonth >= 6 && currentMonth <= 8) {
            season = 'summer';
        } else if (currentMonth >= 9 && currentMonth <= 11) {
            season = 'autumn';
        } else {
            season = 'winter';
        }
        
        // 查询当季产品
        const products = await MerchantProduct.findAll({
            where: {
                isOnSale: true,
                isSeasonal: true,
                season: season
            },
            include: [
                {
                    model: Merchant,
                    attributes: ['id', 'storeName', 'contactPhone', 'address']
                }
            ],
            limit: parseInt(limit),
            order: [['salesCount', 'DESC']]
        });
        
        // 处理产品数据
        const processedProducts = products.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            images: product.images || [],
            description: product.description,
            season: product.season,
            merchant: {
                id: product.Merchant.id,
                name: product.Merchant.storeName,
                phone: product.Merchant.contactPhone,
                address: product.Merchant.address
            }
        }));
        
        res.json({
            success: true,
            season,
            products: processedProducts
        });
    } catch (error) {
        console.error('获取季节性产品推荐错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理获取季节性产品推荐时出错'
        });
    }
});

// 更新产品季节性状态
router.put('/products/:id/seasonal-status', async (req, res) => {
    try {
        const { id } = req.params;
        const { isSeasonal, season } = req.body;
        
        const product = await MerchantProduct.findByPk(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: '产品不存在'
            });
        }
        
        await product.update({
            isSeasonal,
            season
        });
        
        res.json({
            success: true,
            message: '更新成功'
        });
    } catch (error) {
        console.error('更新产品季节性状态错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理更新产品季节性状态时出错'
        });
    }
});

module.exports = router; 