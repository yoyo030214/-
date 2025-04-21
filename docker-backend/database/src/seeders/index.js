const { User, Product, Policy } = require('../models');
const { initializeMerchantSeeds } = require('./merchantSeeder');

// 初始化种子数据
const initializeSeeds = async () => {
  try {
    // 检查是否已有数据
    const userCount = await User.count();
    const productCount = await Product.count();
    const policyCount = await Policy.count();

    // 如果已有数据，则不初始化
    if (userCount > 0 || productCount > 0 || policyCount > 0) {
      console.log('数据库中已有数据，跳过种子数据初始化');
      return;
    }

    // 创建默认管理员用户
    await User.create({
      username: 'admin',
      password: '123456',
      role: 'admin',
      name: '系统管理员',
      email: 'admin@example.com',
      isActive: true
    });

    // 创建默认农户用户
    await User.create({
      username: 'zhangsan',
      password: '123456',
      role: 'farmer',
      name: '张三',
      email: 'zhangsan@example.com',
      isActive: true
    });

    // 创建默认客户用户
    await User.create({
      username: 'lisi',
      password: '123456',
      role: 'user',
      name: '李四',
      email: 'lisi@example.com',
      isActive: true
    });

    console.log('种子数据初始化成功');
  } catch (error) {
    console.error('种子数据初始化失败:', error);
  }
};

const initializeAllSeeds = async () => {
  try {
    // 初始化基础种子数据
    await initializeSeeds();
    
    // 初始化商家模块种子数据
    await initializeMerchantSeeds();
    
    console.log('所有种子数据初始化成功');
  } catch (error) {
    console.error('种子数据初始化失败:', error);
    throw error;
  }
};

module.exports = {
  initializeSeeds,
  initializeAllSeeds
}; 