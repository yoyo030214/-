const pool = require('../config/database');

async function checkCustomerData() {
    try {
        const connection = await pool.getConnection();
        console.log('数据库连接成功');

        // 检查客户总数
        const [customerCount] = await connection.query('SELECT COUNT(*) as total FROM customers');
        console.log('\n=== 客户总数 ===');
        console.log(`总客户数: ${customerCount[0].total}`);

        // 检查会员等级分布
        const [levelStats] = await connection.query(`
            SELECT level, COUNT(*) as count
            FROM customers
            GROUP BY level
        `);
        console.log('\n=== 会员等级分布 ===');
        console.table(levelStats);

        // 检查客户状态分布
        const [statusStats] = await connection.query(`
            SELECT status, COUNT(*) as count
            FROM customers
            GROUP BY status
        `);
        console.log('\n=== 客户状态分布 ===');
        console.table(statusStats);

        // 检查订单统计
        const [orderStats] = await connection.query(`
            SELECT 
                COUNT(*) as total_customers,
                SUM(order_count) as total_orders,
                SUM(total_spent) as total_spent,
                AVG(order_count) as avg_orders,
                AVG(total_spent) as avg_spent
            FROM customer_order_stats
        `);
        console.log('\n=== 订单统计 ===');
        console.table(orderStats);

        // 检查客户偏好分析
        const [preferenceStats] = await connection.query(`
            SELECT 
                c.name as customer_name,
                cat.name as category_name,
                cp.order_count,
                cp.total_spent
            FROM customer_preferences cp
            JOIN customers c ON cp.customer_id = c.id
            JOIN categories cat ON cp.category_id = cat.id
            ORDER BY cp.order_count DESC
            LIMIT 10
        `);
        console.log('\n=== 客户偏好TOP10 ===');
        console.table(preferenceStats);

        // 检查访问记录
        const [visitStats] = await connection.query(`
            SELECT 
                c.name as customer_name,
                COUNT(*) as visit_count,
                MAX(visit_time) as last_visit
            FROM customer_visits cv
            JOIN customers c ON cv.customer_id = c.id
            GROUP BY c.id, c.name
            ORDER BY visit_count DESC
            LIMIT 10
        `);
        console.log('\n=== 访问记录TOP10 ===');
        console.table(visitStats);

        // 检查数据一致性
        const [consistencyCheck] = await connection.query(`
            SELECT 
                c.id,
                c.name,
                COALESCE(cos.order_count, 0) as stats_order_count,
                (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as actual_order_count
            FROM customers c
            LEFT JOIN customer_order_stats cos ON c.id = cos.customer_id
            WHERE COALESCE(cos.order_count, 0) != (SELECT COUNT(*) FROM orders WHERE customer_id = c.id)
        `);
        
        if (consistencyCheck.length > 0) {
            console.log('\n=== 数据不一致警告 ===');
            console.table(consistencyCheck);
        } else {
            console.log('\n数据一致性检查通过');
        }

        connection.release();
        console.log('\n数据检查完成');
    } catch (error) {
        console.error('数据检查失败:', error);
    }
}

// 执行检查
checkCustomerData(); 