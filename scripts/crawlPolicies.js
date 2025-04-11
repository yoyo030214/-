const PolicyCrawler = require('../utils/policyCrawler');
const { request } = require('../utils/request');

// 配置
const CONFIG = {
  crawlInterval: 24 * 60 * 60 * 1000, // 24小时执行一次
  retryTimes: 3, // 失败重试次数
  retryDelay: 300000, // 重试延迟5分钟
  executionTime: '00:00' // 每天0点执行
};

// 保存抓取结果到数据库
async function savePolicies(policies) {
  try {
    const response = await request({
      url: '/api/policies/batch',
      method: 'POST',
      data: { policies }
    });
    return response.data;
  } catch (error) {
    console.error('保存政策失败:', error);
    throw error;
  }
}

// 检查政策是否已存在
async function checkPolicyExists(title, date) {
  try {
    const response = await request({
      url: '/api/policies/check',
      method: 'GET',
      data: { title, date }
    });
    return response.data.exists;
  } catch (error) {
    console.error('检查政策是否存在失败:', error);
    return true; // 如果检查失败，默认认为存在，避免重复
  }
}

// 执行爬虫任务
async function runCrawler(retryCount = 0) {
  try {
    console.log('开始执行政策抓取任务...');
    
    // 创建爬虫实例
    const crawler = new PolicyCrawler();
    
    // 执行抓取
    const policies = await crawler.crawl();
    
    // 过滤已存在的政策
    const newPolicies = [];
    for (const policy of policies) {
      const exists = await checkPolicyExists(policy.title, policy.date);
      if (!exists) {
        newPolicies.push(policy);
      }
    }
    
    // 保存新政策
    if (newPolicies.length > 0) {
      await savePolicies(newPolicies);
      console.log(`成功保存 ${newPolicies.length} 条新政策`);
    } else {
      console.log('没有发现新政策');
    }
    
    // 更新统计信息
    await request({
      url: '/api/policies/stats/update',
      method: 'POST',
      data: {
        lastUpdateTime: new Date().toISOString(),
        newPoliciesCount: newPolicies.length
      }
    });
    
  } catch (error) {
    console.error('政策抓取任务失败:', error);
    
    // 重试机制
    if (retryCount < CONFIG.retryTimes) {
      console.log(`${CONFIG.retryDelay / 60000}分钟后进行第${retryCount + 1}次重试...`);
      setTimeout(() => runCrawler(retryCount + 1), CONFIG.retryDelay);
    }
  }
}

// 获取下一次执行的时间（毫秒）
function getNextExecutionDelay() {
  const now = new Date();
  const [hour, minute] = CONFIG.executionTime.split(':').map(Number);
  const nextExecution = new Date(now);
  
  nextExecution.setHours(hour);
  nextExecution.setMinutes(minute);
  nextExecution.setSeconds(0);
  nextExecution.setMilliseconds(0);
  
  if (nextExecution <= now) {
    nextExecution.setDate(nextExecution.getDate() + 1);
  }
  
  return nextExecution.getTime() - now.getTime();
}

// 启动定时任务
function startCrawlTask() {
  // 计算首次执行延迟
  const initialDelay = getNextExecutionDelay();
  console.log(`首次执行将在 ${new Date(Date.now() + initialDelay).toLocaleString()} 进行`);
  
  // 设置首次执行
  setTimeout(() => {
    // 执行爬虫任务
    runCrawler();
    
    // 设置每24小时执行一次
    setInterval(runCrawler, CONFIG.crawlInterval);
  }, initialDelay);
}

// 检查是否启用了自动抓取
async function checkCrawlerEnabled() {
  try {
    const response = await request({
      url: '/api/policies/crawler/config',
      method: 'GET'
    });
    return response.data.enabled;
  } catch (error) {
    console.error('获取爬虫配置失败:', error);
    return false;
  }
}

// 主函数
async function main() {
  const enabled = await checkCrawlerEnabled();
  if (enabled) {
    console.log('政策自动抓取已启用，开始执行定时任务...');
    startCrawlTask();
  } else {
    console.log('政策自动抓取未启用');
  }
}

// 运行主函数
main().catch(console.error); 