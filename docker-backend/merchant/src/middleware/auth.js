const jwt = require('jsonwebtoken');
const Merchant = require('../models/Merchant');

/**
 * 商家身份验证中间件
 * 从请求头中获取Authorization Token，验证商家身份
 */
const auth = async (req, res, next) => {
    try {
        // 获取请求头中的token
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: '未提供授权令牌',
                code: 'AUTH_TOKEN_MISSING'
            });
        }
        
        // 处理Bearer Token或直接传递的token
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.replace('Bearer ', '')
            : authHeader;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '无效的授权令牌',
                code: 'AUTH_TOKEN_INVALID'
            });
        }

        try {
            // 验证token
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || 'your-secret-key'
            );
            
            // 查找商家
            const merchant = await Merchant.findOne({
                where: {
                    id: decoded.id
                }
            });

            if (!merchant) {
                return res.status(401).json({
                    success: false,
                    message: '商家不存在',
                    code: 'MERCHANT_NOT_FOUND'
                });
            }
            
            // 检查商家状态
            if (merchant.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: '商家账号已被禁用',
                    code: 'MERCHANT_INACTIVE'
                });
            }

            // 将商家信息附加到请求对象
            req.merchant = {
                id: merchant.id,
                username: merchant.username,
                name: merchant.name,
                status: merchant.status
            };
            
            next();
        } catch (tokenError) {
            // 处理token验证错误
            if (tokenError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: '授权令牌已过期',
                    code: 'AUTH_TOKEN_EXPIRED'
                });
            }
            
            return res.status(401).json({
                success: false,
                message: '无效的授权令牌',
                code: 'AUTH_TOKEN_INVALID'
            });
        }
    } catch (error) {
        console.error('认证中间件错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            code: 'SERVER_ERROR'
        });
    }
};

// 微信小程序用户验证中间件
const verifyToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '请先登录',
                code: 'AUTH_REQUIRED'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            req.customer = { id: decoded.id };
            next();
        } catch (tokenError) {
            return res.status(401).json({
                success: false,
                message: '登录已过期，请重新登录',
                code: 'AUTH_EXPIRED'
            });
        }
    } catch (error) {
        console.error('微信用户认证错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            code: 'SERVER_ERROR'
        });
    }
};

module.exports = {
    auth,
    verifyToken
}; 