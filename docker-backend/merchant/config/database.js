const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
    host: '175.178.80.222',
    port: 3306,
    user: 'Administrator',
    password: 'lol110606YY.',
    database: 'merchant_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4',
    timezone: '+08:00',
    debug: false,
    multipleStatements: true
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('数据库连接成功');
        connection.release();
        return true;
    } catch (error) {
        console.error('数据库连接失败:', error);
        return false;
    }
}

module.exports = {
    pool,
    testConnection
}; 