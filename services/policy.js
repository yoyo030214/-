const { request } = require('../utils/request');

// 政策抓取配置
const POLICY_CRAWLER_CONFIG = {
  enabled: false, // 默认关闭自动抓取
  sources: [
    {
      name: '农业农村部',
      url: 'http://www.moa.gov.cn/govpublic/ZCYS/index.htm',
      type: 'government',
      enabled: true
    },
    {
      name: '地方农业政策',
      url: 'http://www.farmer.com.cn/zcfg/',
      type: 'local',
      enabled: true
    }
  ],
  updateInterval: 3600000, // 每小时更新一次
  lastUpdateTime: null,
  todayNewCount: 0
};

const policyApi = {
  async getLatestPolicies() {
    try {
      const res = await request({
        url: '/api/policies',
        method: 'GET',
        data: {
          includeAutoFetched: true // 包含自动抓取的政策
        }
      });
      return res.data;
    } catch (error) {
      console.error('获取政策数据失败:', error);
      throw error;
    }
  },

  async getPolicyDetail(id) {
    try {
      const res = await request({
        url: `/api/policies/${id}`,
        method: 'GET'
      });
      return res.data;
    } catch (error) {
      console.error('获取政策详情失败:', error);
      throw error;
    }
  },

  // 获取爬虫配置
  async getCrawlerConfig() {
    try {
      const res = await request({
        url: '/api/policies/crawler/config',
        method: 'GET'
      });
      return res.data;
    } catch (error) {
      console.error('获取爬虫配置失败:', error);
      return POLICY_CRAWLER_CONFIG;
    }
  },

  // 更新爬虫配置
  async updateCrawlerConfig(config) {
    try {
      const res = await request({
        url: '/api/policies/crawler/config',
        method: 'PUT',
        data: config
      });
      return res.data;
    } catch (error) {
      console.error('更新爬虫配置失败:', error);
      throw error;
    }
  },

  // 手动触发政策抓取
  async triggerPolicyCrawler() {
    try {
      const res = await request({
        url: '/api/policies/crawler/trigger',
        method: 'POST'
      });
      return res.data;
    } catch (error) {
      console.error('触发政策抓取失败:', error);
      throw error;
    }
  },

  // 获取最新抓取的政策
  async getCrawledPolicies() {
    try {
      const res = await request({
        url: '/api/policies/crawler/latest',
        method: 'GET'
      });
      return res.data;
    } catch (error) {
      console.error('获取抓取政策失败:', error);
      throw error;
    }
  },

  // 获取政策统计数据
  async getPolicyStats() {
    try {
      const res = await request({
        url: '/api/policies/stats',
        method: 'GET'
      });
      return res.data;
    } catch (error) {
      console.error('获取政策统计失败:', error);
      throw error;
    }
  }
};

module.exports = policyApi; 