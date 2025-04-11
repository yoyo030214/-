const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '175.178.80.222',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'Administrator',
  password: process.env.DB_PASSWORD || 'lol110606YY.',
  database: process.env.DB_NAME || 'merchant_db'
};

async function initDatabase() {
  let connection;
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });

    // 创建数据库(如果不存在)
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.query(`USE ${dbConfig.database}`);

    // 读取SQL文件
    const sqlFile = path.join(__dirname, '../sql/init.sql');
    const sqlContent = await fs.readFile(sqlFile, 'utf8');

    // 分割SQL语句
    const statements = sqlContent
      .split(';')
      .filter(statement => statement.trim());

    // 执行每条SQL语句
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
        console.log('执行SQL语句成功');
      }
    }

    console.log('数据库初始化完成!');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行初始化
initDatabase(); 