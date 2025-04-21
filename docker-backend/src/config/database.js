const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// 从环境变量获取数据库连接信息
const dbHost = process.env.DB_HOST || '175.178.80.222';
const dbPort = process.env.DB_PORT || 3306;
const dbUser = process.env.DB_USER || 'Administrator';
const dbPassword = process.env.DB_PASSWORD || 'lol110606YY.';
const dbName = process.env.DB_NAME || 'merchant_db';

// 创建Sequelize实例
const sequelize = new Sequelize({
  database: dbName,
  username: dbUser,
  password: dbPassword,
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  dialectOptions: {
    timezone: '+08:00',
    charset: 'utf8mb4'
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功:', `mysql://${dbUser}@${dbHost}:${dbPort}/${dbName}`);
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
};

// 导出Sequelize实例
module.exports = {
  sequelize,
  Sequelize,
  testConnection
}; 