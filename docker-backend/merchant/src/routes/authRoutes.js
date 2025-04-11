const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Merchant = require('../models/Merchant');
const { auth } = require('../middleware/auth');

/**
 * @route   POST /api/merchant/auth/login
 * @desc    商家登录
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 参数验证
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空',
                code: 'MISSING_CREDENTIALS'
            });
        }

        // 查找商家
        const merchant = await Merchant.findOne({ where: { username } });
        if (!merchant) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // 检查账号状态
        if (merchant.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: '账号已被禁用',
                code: 'ACCOUNT_DISABLED'
            });
        }

        // 检查是否被锁定
        if (merchant.lockUntil && merchant.lockUntil > new Date()) {
            const remainingTime = Math.ceil((merchant.lockUntil - new Date()) / (60 * 1000));
            return res.status(403).json({
                success: false,
                message: `账号已被锁定，请${remainingTime}分钟后再试`,
                code: 'ACCOUNT_LOCKED',
                data: { remainingTime }
            });
        }

        // 验证密码
        const isValidPassword = await merchant.comparePassword(password);
        if (!isValidPassword) {
            // 增加登录失败次数
            merchant.loginAttempts += 1;
            
            // 如果失败次数过多，锁定账号(5次失败锁定30分钟)
            if (merchant.loginAttempts >= 5) {
                const lockTime = 30 * 60 * 1000; // 30分钟
                merchant.lockUntil = new Date(Date.now() + lockTime);
                
                await merchant.save();
                
                return res.status(403).json({
                    success: false,
                    message: '密码错误次数过多，账号已被锁定30分钟',
                    code: 'ACCOUNT_LOCKED',
                    data: { remainingTime: 30 }
                });
            }
            
            await merchant.save();
            
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误',
                code: 'INVALID_CREDENTIALS',
                data: { attemptsLeft: 5 - merchant.loginAttempts }
            });
        }

        // 登录成功，重置登录失败次数和锁定时间
        merchant.loginAttempts = 0;
        merchant.lockUntil = null;
        merchant.lastLoginAt = new Date();
        await merchant.save();

        // 生成JWT token
        const token = jwt.sign(
            { 
                id: merchant.id,
                username: merchant.username,
                role: 'merchant'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // 返回商家信息和token
        res.json({
            success: true,
            message: '登录成功',
            token,
            merchant: {
                id: merchant.id,
                username: merchant.username,
                name: merchant.name,
                status: merchant.status,
                lastLogin: merchant.lastLoginAt
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            code: 'SERVER_ERROR'
        });
    }
});

/**
 * @route   GET /api/merchant/auth/me
 * @desc    获取当前登录商家信息
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
    try {
        const merchant = await Merchant.findByPk(req.merchant.id, {
            attributes: { exclude: ['password', 'loginAttempts', 'lockUntil'] }
        });

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: '商家不存在',
                code: 'MERCHANT_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            merchant
        });
    } catch (error) {
        console.error('获取商家信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            code: 'SERVER_ERROR'
        });
    }
});

/**
 * @route   PUT /api/merchant/auth/change-password
 * @desc    修改密码
 * @access  Private
 */
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // 参数验证
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '当前密码和新密码不能为空',
                code: 'MISSING_FIELDS'
            });
        }
        
        // 新密码长度验证
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: '新密码长度不能少于6位',
                code: 'PASSWORD_TOO_SHORT'
            });
        }
        
        const merchant = await Merchant.findByPk(req.merchant.id);

        // 验证当前密码
        const isValidPassword = await merchant.comparePassword(currentPassword);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '当前密码错误',
                code: 'INVALID_CURRENT_PASSWORD'
            });
        }

        // 更新密码
        merchant.password = newPassword;
        await merchant.save();

        res.json({
            success: true,
            message: '密码修改成功'
        });
    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            code: 'SERVER_ERROR'
        });
    }
});

/**
 * @route   POST /api/merchant/auth/logout
 * @desc    商家登出
 * @access  Private
 */
router.post('/logout', auth, async (req, res) => {
    try {
        // 客户端应该删除token，服务端可以记录登出时间
        const merchant = await Merchant.findByPk(req.merchant.id);
        
        if (merchant) {
            merchant.lastLogoutAt = new Date();
            await merchant.save();
        }
        
        res.json({
            success: true,
            message: '登出成功'
        });
    } catch (error) {
        console.error('登出错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            code: 'SERVER_ERROR'
        });
    }
});

module.exports = router; 