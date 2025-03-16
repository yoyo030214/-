const { request } = require('../utils/request');

const userApi = {
  async login(data) {
    try {
      const res = await request({
        url: '/api/user/login',
        method: 'POST',
        data
      });
      return res.data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },

  async getUserInfo() {
    try {
      const res = await request({
        url: '/api/user/info',
        method: 'GET'
      });
      return res.data;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  },

  async updateUserInfo(data) {
    try {
      const res = await request({
        url: '/api/user/info',
        method: 'PUT',
        data
      });
      return res.data;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  }
};

module.exports = userApi; 