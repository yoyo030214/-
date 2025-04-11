const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// 从环境变量获取数据库连接信息
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

// 创建Sequelize实例
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'mariadb',
  dialectOptions: {
    timezone: 'Asia/Shanghai',
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: console.log
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
};

// 尝试连接
testConnection();

module.exports = sequelize; 