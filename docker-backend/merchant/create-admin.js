const bcrypt = require('bcryptjs');
const sequelize = require('./src/config/database');
const Merchant = require('./src/models/Merchant');

// 密码加密
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function createAdmin() {
  try {
    // 同步数据库
    await sequelize.sync({ alter: true });
    console.log('数据库同步完成');
    
    // 检查是否已有admin用户
    const existingAdmin = await Merchant.findOne({ where: { username: 'admin' } });
    if (existingAdmin) {
      console.log('admin用户已存在，正在更新密码并重置锁定状态');
      existingAdmin.password = await hashPassword('123456');
      existingAdmin.loginAttempts = 0;  // 重置登录尝试次数
      existingAdmin.lockUntil = null;   // 解除账号锁定
      await existingAdmin.save();
      console.log('admin用户密码已更新，锁定状态已重置');
    } else {
      // 创建admin用户
      const hashedPassword = await hashPassword('123456');
      const admin = await Merchant.create({
        username: 'admin',
        password: hashedPassword,
        name: '测试商家',
        phone: '13800138000',
        email: 'test@example.com',
        status: 'active',
        loginAttempts: 0,
        lockUntil: null
      });
      console.log('创建admin用户成功:', admin.username);
    }
    
    // 检查用户是否创建成功
    const admins = await Merchant.findAll();
    console.log('所有用户:', JSON.stringify(admins, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('创建admin用户失败:', error);
    process.exit(1);
  }
}

// 执行创建
createAdmin(); 