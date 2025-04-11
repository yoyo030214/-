/**
 * 创建管理员账户脚本
 * 用于初始化系统管理员账户
 */
const sequelize = require('../config/database');
const Merchant = require('../models/Merchant');

// 默认管理员信息
const DEFAULT_ADMIN = {
  username: 'admin',
  password: '123456',
  name: '系统管理员',
  phone: '13800138000',
  email: 'admin@example.com',
  status: 'active'
};

// 连接数据库并创建/更新管理员账户
async function createAdmin() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 同步模型
    await sequelize.sync({ alter: true });
    console.log('数据库同步成功');
    
    // 检查管理员账户是否存在
    let admin = await Merchant.findOne({ where: { username: DEFAULT_ADMIN.username } });
    
    if (admin) {
      console.log('管理员账户已存在，更新密码...');
      
      // 更新管理员账户
      admin.password = DEFAULT_ADMIN.password;
      // 重置登录失败次数和锁定状态
      admin.loginAttempts = 0;
      admin.lockUntil = null;
      
      await admin.save();
      console.log('管理员账户更新成功');
    } else {
      console.log('创建新的管理员账户...');
      
      // 创建新的管理员账户
      admin = await Merchant.create(DEFAULT_ADMIN);
      console.log('管理员账户创建成功');
    }
    
    console.log('管理员信息:');
    console.log('---------------');
    console.log(`用户名: ${DEFAULT_ADMIN.username}`);
    console.log(`密码: ${DEFAULT_ADMIN.password}`);
    console.log(`状态: ${admin.status}`);
    console.log('---------------');
    console.log('请使用以上凭据登录系统，并尽快修改默认密码！');
    
  } catch (error) {
    console.error('创建管理员账户失败:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

// 执行创建管理员函数
createAdmin(); 