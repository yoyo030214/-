const request = require('../utils/request');
const config = require('../utils/config');

const userApi = {
  // 用户登录
  login(data) {
    return request({
      url: '/user/login',
      method: 'POST',
      data
    });
  },

  // 获取用户信息
  getUserInfo() {
    return request({
      url: '/user/info',
      method: 'GET'
    });
  },

  // 更新用户信息
  updateUserInfo(data) {
    return request({
      url: '/user/info',
      method: 'PUT',
      data
    });
  },

  // 获取用户订单列表
  getOrderList(params) {
    return request({
      url: '/user/orders',
      method: 'GET',
      data: params
    });
  },

  // 获取用户收藏列表
  getFavoriteList(params) {
    return request({
      url: '/user/favorites',
      method: 'GET',
      data: params
    });
  },

  // 添加收藏
  addFavorite(productId) {
    return request({
      url: '/user/favorites',
      method: 'POST',
      data: { productId }
    });
  },

  // 取消收藏
  removeFavorite(productId) {
    return request({
      url: `/user/favorites/${productId}`,
      method: 'DELETE'
    });
  }
};

module.exports = userApi; 