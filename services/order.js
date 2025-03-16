const { request } = require('../utils/request');

const orderApi = {
  async createOrder(data) {
    try {
      const res = await request({
        url: '/api/orders',
        method: 'POST',
        data
      });
      return res.data;
    } catch (error) {
      console.error('创建订单失败:', error);
      throw error;
    }
  },

  async getOrderList(params) {
    try {
      const res = await request({
        url: '/api/orders',
        method: 'GET',
        data: params
      });
      return res.data;
    } catch (error) {
      console.error('获取订单列表失败:', error);
      throw error;
    }
  },

  async getOrderDetail(id) {
    try {
      const res = await request({
        url: `/api/orders/${id}`,
        method: 'GET'
      });
      return res.data;
    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  },

  async cancelOrder(id) {
    try {
      const res = await request({
        url: `/api/orders/${id}/cancel`,
        method: 'POST'
      });
      return res.data;
    } catch (error) {
      console.error('取消订单失败:', error);
      throw error;
    }
  }
};

module.exports = orderApi; 