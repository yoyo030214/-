const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Customer, MerchantProduct, MerchantOrder, Merchant } = require('../../../database/src/models');
const axios = require('axios');
const { verifyToken } = require('../middlewares/authMiddleware');

// 微信小程序登录
router.post('/wx-login', async (req, res) => {
    try {
        const { code, userInfo } = req.body;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                message: '缺少微信登录code'
            });
        }

        // 获取微信小程序的配置信息（实际使用时需从环境变量或配置文件获取）
        const APPID = process.env.WX_APPID || 'your_appid';
        const SECRET = process.env.WX_SECRET || 'your_secret';
        
        // 向微信服务器请求登录
        const wxLoginUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`;
        
        const wxResponse = await axios.get(wxLoginUrl);
        
        if (wxResponse.data.errcode) {
            return res.status(400).json({
                success: false,
                message: `微信登录失败: ${wxResponse.data.errmsg}`
            });
        }
        
        const { openid, session_key } = wxResponse.data;
        
        // 查找或创建客户记录
        let customer = await Customer.findOne({ where: { wxOpenId: openid } });
        
        if (!customer && userInfo) {
            // 如果客户不存在且有用户信息，创建新客户
            const { nickName, avatarUrl, gender, city, province, country } = userInfo;
            
            // 查找默认商家(可以根据实际业务逻辑调整)
            const merchant = await Merchant.findOne();
            
            if (!merchant) {
                return res.status(500).json({
                    success: false,
                    message: '系统错误：未找到商家信息'
                });
            }
            
            customer = await Customer.create({
                name: nickName,
                wxOpenId: openid,
                wxSessionKey: session_key,
                avatar: avatarUrl,
                gender: gender === 1 ? '男' : gender === 2 ? '女' : '未知',
                address: `${province} ${city}`,
                memberLevel: 'regular',
                status: 'active',
                merchantId: merchant.id,
                lastLoginDate: new Date()
            });
        } else if (customer) {
            // 更新会话密钥和登录时间
            await customer.update({
                wxSessionKey: session_key,
                lastLoginDate: new Date()
            });
        }
        
        // 生成JWT令牌
        const token = jwt.sign(
            { 
                id: customer.id, 
                wxOpenId: openid,
                type: 'customer'
            },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token,
            userInfo: {
                id: customer.id,
                name: customer.name,
                avatar: customer.avatar,
                memberLevel: customer.memberLevel
            }
        });
        
    } catch (error) {
        console.error('微信登录处理错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理微信登录时出错'
        });
    }
});

// 获取用户信息
router.get('/user-info', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        
        const customer = await Customer.findByPk(customerId);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: '未找到用户信息'
            });
        }
        
        res.json({
            success: true,
            userInfo: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                avatar: customer.avatar,
                address: customer.address,
                memberLevel: customer.memberLevel,
                totalOrders: customer.totalOrders,
                totalSpent: customer.totalSpent,
                status: customer.status
            }
        });
        
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理获取用户信息时出错'
        });
    }
});

// 更新用户信息
router.put('/user-info', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { name, phone, email, address } = req.body;
        
        const customer = await Customer.findByPk(customerId);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: '未找到用户信息'
            });
        }
        
        // 更新客户信息
        await customer.update({
            name: name || customer.name,
            phone: phone || customer.phone,
            email: email || customer.email,
            address: address || customer.address
        });
        
        res.json({
            success: true,
            message: '用户信息更新成功',
            userInfo: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                address: customer.address
            }
        });
        
    } catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理更新用户信息时出错'
        });
    }
});

module.exports = router; 