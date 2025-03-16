const { request } = require('../utils/request');

const cartApi = {
  async getCartList() {
    try {
      const res = await request({
        url: '/api/cart',
        method: 'GET'
      });
      return res.data;
    } catch (error) {
      console.error('获取购物车列表失败:', error);
      throw error;
    }
  },

  async addToCart(data) {
    try {
      const res = await request({
        url: '/api/cart',
        method: 'POST',
        data
      });
      return res.data;
    } catch (error) {
      console.error('添加购物车失败:', error);
      throw error;
    }
  },

  async updateCartItem(id, data) {
    try {
      const res = await request({
        url: `/api/cart/${id}`,
        method: 'PUT',
        data
      });
      return res.data;
    } catch (error) {
      console.error('更新购物车商品失败:', error);
      throw error;
    }
  },

  async removeFromCart(id) {
    try {
      const res = await request({
        url: `/api/cart/${id}`,
        method: 'DELETE'
      });
      return res.data;
    } catch (error) {
      console.error('删除购物车商品失败:', error);
      throw error;
    }
  },

  async clearCart() {
    try {
      const res = await request({
        url: '/api/cart/clear',
        method: 'POST'
      });
      return res.data;
    } catch (error) {
      console.error('清空购物车失败:', error);
      throw error;
    }
  }
};

module.exports = cartApi; 