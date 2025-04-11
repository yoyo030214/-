const BASE_URL = 'http://175.178.80.222:3000/api';

// 请求封装
const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      ...options,
      success: (res) => {
        if (res.statusCode === 200) {
          // 统一处理返回格式
          if (res.data.success !== undefined) {
            // 后端返回格式为 { success: true, ... }
            resolve({
              code: res.data.success ? 0 : 1,
              data: res.data.data || res.data,
              message: res.data.message
            });
          } else {
            // 后端返回格式为 { code: 0, ... }
            resolve(res.data);
          }
        } else {
          reject(res);
        }
      },
      fail: reject
    });
  });
};

// 商品相关接口
const api = {
  // 获取商品列表
  getProducts(params) {
    return request('/products', {
      method: 'GET',
      data: params
    });
  },

  // 获取商品详情
  getProductDetail(id) {
    return request(`/products/${id}`);
  },

  // 获取商品分类
  getCategories() {
    return request('/categories');
  },

  // 加入购物车
  addToCart(data) {
    return request('/cart', {
      method: 'POST',
      data
    });
  },

  // 获取购物车列表
  getCart() {
    return request('/cart');
  },

  // 更新购物车商品数量
  updateCartItem(id, data) {
    return request(`/cart/${id}`, {
      method: 'PUT',
      data
    });
  },

  // 删除购物车商品
  deleteCartItem(id) {
    return request(`/cart/${id}`, {
      method: 'DELETE'
    });
  },

  // 清空购物车
  clearCart() {
    return request('/cart/clear', {
      method: 'POST'
    });
  },

  // 创建订单
  createOrder(data) {
    return request('/orders', {
      method: 'POST',
      data
    });
  },

  // 获取订单列表
  getOrders(params) {
    return request('/orders', {
      method: 'GET',
      data: params
    });
  },

  // 获取订单详情
  getOrderDetail(id) {
    return request(`/orders/${id}`);
  },

  // 取消订单
  cancelOrder(id) {
    return request(`/orders/${id}/cancel`, {
      method: 'POST'
    });
  },

  // 确认收货
  confirmOrder(id) {
    return request(`/orders/${id}/confirm`, {
      method: 'POST'
    });
  },

  // 获取地图产品列表
  getMapProducts(params) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${BASE_URL}/api/wx/products/map-products`,
        method: 'GET',
        data: params,
        success: (res) => {
          if (res.data.success) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '获取地图产品列表失败'));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  },

  // 获取季节性产品推荐
  getSeasonalProducts(limit = 10) {
    return request('/wx/products/seasonal-products', {
      method: 'GET',
      data: { limit }
    });
  },

  // 更新产品季节性状态
  updateProductSeasonalStatus(id, data) {
    return request(`/wx/products/${id}/seasonal-status`, {
      method: 'PUT',
      data
    });
  }
};

module.exports = api; 