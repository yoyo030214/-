const { request } = require('../utils/request');

// 用户相关接口
const userApi = {
  // 登录
  login: (data) => {
    return request({
      url: '/api/user/login',
      method: 'POST',
      data
    });
  },
  
  // 获取用户信息
  getUserInfo: () => {
    return request({
      url: '/api/user/info',
      method: 'GET'
    });
  },
  
  // 更新用户信息
  updateUserInfo: (data) => {
    return request({
      url: '/api/user/info',
      method: 'PUT',
      data
    });
  }
};

// 商品相关接口
const productApi = {
  // 获取商品列表
  getProductList: (params) => {
    return request({
      url: '/api/products',
      method: 'GET',
      data: params
    });
  },
  
  // 获取商品详情
  getProductDetail: (id) => {
    return request({
      url: `/api/products/${id}`,
      method: 'GET'
    });
  }
};

module.exports = {
  userApi,
  productApi
}; 