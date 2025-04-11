const request = require('../utils/request');
const config = require('../utils/config');

const productApi = {
  // 获取商品列表
  getProductList(params) {
    return request({
      url: '/products',
      method: 'GET',
      data: params
    });
  },

  // 获取商品详情
  getProductDetail(id) {
    return request({
      url: `/products/${id}`,
      method: 'GET'
    });
  },

  // 获取商品分类列表
  getCategoryList() {
    return request({
      url: '/categories',
      method: 'GET'
    });
  },

  // 获取商品评论列表
  getProductComments(productId, params) {
    return request({
      url: `/products/${productId}/comments`,
      method: 'GET',
      data: params
    });
  },

  // 添加商品评论
  addProductComment(productId, data) {
    return request({
      url: `/products/${productId}/comments`,
      method: 'POST',
      data
    });
  },

  // 获取商品推荐列表
  getRecommendList() {
    return request({
      url: '/products/recommend',
      method: 'GET'
    });
  },

  // 获取商品搜索列表
  searchProducts(keyword, params) {
    return request({
      url: '/products/search',
      method: 'GET',
      data: {
        keyword,
        ...params
      }
    });
  }
};

module.exports = productApi; 