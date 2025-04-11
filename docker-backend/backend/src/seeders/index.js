const seedPolicies = require('./policySeeder');

// 定义初始化所有种子数据的函数
const initializeSeeds = async () => {
  try {
    // 按顺序执行各个种子数据函数
    await seedPolicies();
    
    console.log('所有种子数据初始化完成！');
  } catch (error) {
    console.error('初始化种子数据失败:', error);
  }
};

module.exports = {
  initializeSeeds
}; 