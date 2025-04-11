const cron = require('node-cron');
const PolicyService = require('../services/policyService');
const { sequelize } = require('../models');

// 确保数据库连接
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
}

// 政策抓取任务
async function fetchPoliciesTask() {
  console.log('开始抓取政策...');
  try {
    const result = await PolicyService.fetchPolicies();
    console.log('政策抓取结果:', result);
  } catch (error) {
    console.error('政策抓取出错:', error);
  }
}

// 初始化定时任务
async function initializeCronJob() {
  await initializeDatabase();
  
  // 每天凌晨2点执行抓取
  cron.schedule('0 2 * * *', fetchPoliciesTask, {
    timezone: 'Asia/Shanghai'
  });
  
  console.log('政策抓取定时任务已启动');
}

// 立即执行一次抓取（用于测试）
if (process.env.FETCH_NOW === 'true') {
  initializeDatabase().then(() => {
    fetchPoliciesTask().finally(() => {
      process.exit(0);
    });
  });
} else {
  // 启动定时任务
  initializeCronJob();
}

module.exports = {
  fetchPoliciesTask,
  initializeCronJob
}; 