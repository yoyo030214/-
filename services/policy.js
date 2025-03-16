const { request } = require('../utils/request');

const policyApi = {
  async getLatestPolicies() {
    try {
      const res = await request({
        url: '/api/policies',
        method: 'GET'
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
  }
};

module.exports = policyApi; 