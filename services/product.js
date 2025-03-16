const { request } = require('../utils/request');

const productApi = {
  async getCategories() {
    try {
      const res = await request({
        url: '/api/categories',
        method: 'GET'
      });
      return res.data;
    } catch (error) {
      console.error('获取商品分类失败:', error);
      throw error;
    }
  },

  async getProducts(params) {
    try {
      const res = await request({
        url: '/api/products',
        method: 'GET',
        data: params
      });
      return res.data;
    } catch (error) {
      console.error('获取商品列表失败:', error);
      throw error;
    }
  },

  async getProductDetail(id) {
    try {
      const res = await request({
        url: `/api/products/${id}`,
        method: 'GET'
      });
      return res.data;
    } catch (error) {
      console.error('获取商品详情失败:', error);
      throw error;
    }
  }
};

module.exports = productApi; 