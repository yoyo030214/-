const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// 从环境变量获取数据库连接信息
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 3306;
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || 'root';
const dbName = process.env.DB_NAME || 'agricultural_app';
const dbDialect = process.env.DB_DIALECT || 'mysql';
const dbTimeout = parseInt(process.env.DB_TIMEOUT || '10000', 10);
const dbPoolMax = parseInt(process.env.DB_POOL_MAX || '5', 10);
const dbPoolMin = parseInt(process.env.DB_POOL_MIN || '0', 10);

// 创建Sequelize实例
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: dbDialect, // 使用环境变量中指定的数据库类型（mysql 或 mariadb）
  dialectOptions: {
    timezone: 'Asia/Shanghai',
    connectTimeout: dbTimeout, // 增加连接超时时间
  },
  pool: {
    max: dbPoolMax,
    min: dbPoolMin,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    max: 3, // 最大重试次数
    match: [/Deadlock/i, /SequelizeConnectionError/]
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功:', `${dbDialect}://${dbUser}@${dbHost}:${dbPort}/${dbName}`);
  } catch (error) {
    console.error('数据库连接失败:', error);
    
    if (dbHost !== 'localhost' && process.env.NODE_ENV === 'development') {
      console.log('尝试连接到本地数据库...');
      // 在连接远程失败时，尝试连接本地数据库（仅在开发环境）
      const localSequelize = new Sequelize(dbName, 'root', 'root', {
        host: 'localhost',
        port: 3306,
        dialect: 'mysql',
        logging: false
      });
      
      try {
        await localSequelize.authenticate();
        console.log('本地数据库连接成功! 您可能需要配置本地数据库作为替代。');
      } catch (localError) {
        console.error('本地数据库连接也失败:', localError);
        console.log('提示: 您可能需要安装并配置一个本地数据库，或者修改.env文件中的数据库配置。');
      }
    }
  }
};

// 尝试连接
testConnection();

// 导出Sequelize实例
module.exports = sequelize; 