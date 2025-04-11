const pool = require('../config/database');

async function checkCustomerTables() {
    try {
        const connection = await pool.getConnection();
        console.log('数据库连接成功');

        // 检查customers表
        const [customersTable] = await connection.query('DESCRIBE customers');
        console.log('\n=== customers表结构 ===');
        console.table(customersTable);

        // 检查customer_order_stats表
        const [orderStatsTable] = await connection.query('DESCRIBE customer_order_stats');
        console.log('\n=== customer_order_stats表结构 ===');
        console.table(orderStatsTable);

        // 检查customer_preferences表
        const [preferencesTable] = await connection.query('DESCRIBE customer_preferences');
        console.log('\n=== customer_preferences表结构 ===');
        console.table(preferencesTable);

        // 检查customer_visits表
        const [visitsTable] = await connection.query('DESCRIBE customer_visits');
        console.log('\n=== customer_visits表结构 ===');
        console.table(visitsTable);

        // 检查触发器
        const [triggers] = await connection.query(`
            SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_STATEMENT
            FROM information_schema.TRIGGERS
            WHERE TRIGGER_SCHEMA = DATABASE()
            AND TRIGGER_NAME IN ('after_order_insert', 'after_order_item_insert')
        `);
        console.log('\n=== 触发器信息 ===');
        console.table(triggers);

        // 检查外键约束
        const [foreignKeys] = await connection.query(`
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME IS NOT NULL
            AND TABLE_NAME LIKE 'customer%'
        `);
        console.log('\n=== 外键约束 ===');
        console.table(foreignKeys);

        // 检查索引
        const [indexes] = await connection.query(`
            SELECT 
                TABLE_NAME,
                INDEX_NAME,
                COLUMN_NAME,
                SEQ_IN_INDEX
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME LIKE 'customer%'
            ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
        `);
        console.log('\n=== 索引信息 ===');
        console.table(indexes);

        connection.release();
        console.log('\n数据库检查完成');
    } catch (error) {
        console.error('数据库检查失败:', error);
    }
}

// 执行检查
checkCustomerTables(); 