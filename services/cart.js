const request = require('../utils/request');
const config = require('../utils/config');

const cartApi = {
  // 获取购物车列表
  getCartList() {
    return request({
      url: '/cart',
      method: 'GET'
    });
  },

  // 添加商品到购物车
  addToCart(data) {
    return request({
      url: '/cart/add',
      method: 'POST',
      data
    });
  },

  // 更新购物车商品数量
  updateCartQuantity(data) {
    return request({
      url: '/cart/update',
      method: 'PUT',
      data
    });
  },

  // 删除购物车商品
  removeFromCart(productId) {
    return request({
      url: `/cart/remove/${productId}`,
      method: 'DELETE'
    });
  },

  // 清空购物车
  clearCart() {
    return request({
      url: '/cart/clear',
      method: 'DELETE'
    });
  },

  // 选择/取消选择购物车商品
  toggleSelect(productId) {
    return request({
      url: `/cart/select/${productId}`,
      method: 'PUT'
    });
  },

  // 全选/取消全选购物车商品
  toggleSelectAll(selected) {
    return request({
      url: '/cart/select-all',
      method: 'PUT',
      data: { selected }
    });
  }
};

module.exports = cartApi; 