const pool = require('../config/database');

// 获取客户列表
async function getCustomers(req, res) {
    try {
        const { page = 1, limit = 12, status, level, search } = req.query;
        const offset = (page - 1) * limit;
        
        // 构建查询条件
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (status) {
            whereClause += ' AND c.status = ?';
            params.push(status);
        }
        
        if (level) {
            whereClause += ' AND c.level = ?';
            params.push(level);
        }
        
        if (search) {
            whereClause += ' AND (c.name LIKE ? OR c.phone LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        // 获取总记录数
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM customers c ${whereClause}`,
            params
        );
        
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);
        
        // 获取客户列表
        const [customers] = await pool.query(
            `SELECT 
                c.*,
                COUNT(DISTINCT o.id) as order_count,
                COALESCE(SUM(o.total_amount), 0) as total_spent,
                MAX(o.create_time) as last_order_time
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id
            ${whereClause}
            GROUP BY c.id
            ORDER BY c.create_time DESC
            LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );
        
        res.json({
            success: true,
            data: {
                customers,
                total,
                totalPages,
                currentPage: parseInt(page)
            }
        });
    } catch (error) {
        console.error('获取客户列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取客户列表失败'
        });
    }
}

// 获取客户详情
async function getCustomerDetail(req, res) {
    try {
        const { id } = req.params;
        
        // 获取客户基本信息
        const [customers] = await pool.query(
            `SELECT * FROM customers WHERE id = ?`,
            [id]
        );
        
        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: '客户不存在'
            });
        }
        
        const customer = customers[0];
        
        // 获取客户订单统计
        const [orderStats] = await pool.query(
            `SELECT 
                COUNT(*) as order_count,
                COALESCE(SUM(total_amount), 0) as total_spent,
                MAX(create_time) as last_order_time
            FROM orders 
            WHERE customer_id = ?`,
            [id]
        );
        
        // 获取客户常购产品类别
        const [categoryPreferences] = await pool.query(
            `SELECT 
                p.category_id,
                c.name,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (
                    SELECT COUNT(*) 
                    FROM order_items oi 
                    JOIN orders o ON oi.order_id = o.id 
                    WHERE o.customer_id = ?
                ), 2) as percentage
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            WHERE o.customer_id = ?
            GROUP BY p.category_id, c.name
            ORDER BY count DESC
            LIMIT 5`,
            [id, id]
        );
        
        // 获取客户最常购买的产品
        const [topProducts] = await pool.query(
            `SELECT 
                p.name,
                COUNT(*) as count
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.customer_id = ?
            GROUP BY p.id, p.name
            ORDER BY count DESC
            LIMIT 5`,
            [id]
        );
        
        res.json({
            success: true,
            data: {
                customer: {
                    ...customer,
                    ...orderStats[0]
                },
                category_preferences: categoryPreferences,
                top_products: topProducts
            }
        });
    } catch (error) {
        console.error('获取客户详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取客户详情失败'
        });
    }
}

// 创建客户
async function createCustomer(req, res) {
    try {
        const { name, phone, email, level, address, status } = req.body;
        
        // 验证必填字段
        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: '姓名和电话为必填项'
            });
        }
        
        // 检查手机号是否已存在
        const [existingCustomers] = await pool.query(
            'SELECT id FROM customers WHERE phone = ?',
            [phone]
        );
        
        if (existingCustomers.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该手机号已被注册'
            });
        }
        
        // 创建客户
        const [result] = await pool.query(
            `INSERT INTO customers (name, phone, email, level, address, status, create_time, update_time)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [name, phone, email, level || 'normal', address, status || 'active']
        );
        
        res.status(201).json({
            success: true,
            message: '客户创建成功',
            data: {
                id: result.insertId
            }
        });
    } catch (error) {
        console.error('创建客户错误:', error);
        res.status(500).json({
            success: false,
            message: '创建客户失败'
        });
    }
}

// 更新客户信息
async function updateCustomer(req, res) {
    try {
        const { id } = req.params;
        const { name, phone, email, level, address, status } = req.body;
        
        // 验证必填字段
        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: '姓名和电话为必填项'
            });
        }
        
        // 检查手机号是否已被其他客户使用
        const [existingCustomers] = await pool.query(
            'SELECT id FROM customers WHERE phone = ? AND id != ?',
            [phone, id]
        );
        
        if (existingCustomers.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该手机号已被其他客户使用'
            });
        }
        
        // 更新客户信息
        await pool.query(
            `UPDATE customers 
            SET name = ?, phone = ?, email = ?, level = ?, address = ?, status = ?, update_time = NOW()
            WHERE id = ?`,
            [name, phone, email, level, address, status, id]
        );
        
        res.json({
            success: true,
            message: '客户信息更新成功'
        });
    } catch (error) {
        console.error('更新客户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '更新客户信息失败'
        });
    }
}

// 更新客户状态
async function updateCustomerStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的状态值'
            });
        }
        
        await pool.query(
            'UPDATE customers SET status = ?, update_time = NOW() WHERE id = ?',
            [status, id]
        );
        
        res.json({
            success: true,
            message: '客户状态更新成功'
        });
    } catch (error) {
        console.error('更新客户状态错误:', error);
        res.status(500).json({
            success: false,
            message: '更新客户状态失败'
        });
    }
}

module.exports = {
    getCustomers,
    getCustomerDetail,
    createCustomer,
    updateCustomer,
    updateCustomerStatus
}; 