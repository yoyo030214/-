const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// 聊天接口
router.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: '消息格式不正确' });
        }

        const response = await axios.post(process.env.DEEPSEEK_API_URL, {
            messages: messages,
            model: "deepseek-chat",
            temperature: 0.7,
            max_tokens: 2000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('AI请求错误:', error);
        res.status(500).json({ 
            error: 'AI服务请求失败',
            details: error.message 
        });
    }
});

module.exports = router; 