const { request } = require('../utils/request');
const config = require('../utils/config');
const util = require('../utils/util');

// 参数验证函数
const validateOrderData = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('订单数据不能为空');
  }
  if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
    throw new Error('订单商品不能为空');
  }
  if (!data.address || typeof data.address !== 'object') {
    throw new Error('收货地址不能为空');
  }
  if (!data.address.name || !data.address.phone || !data.address.address) {
    throw new Error('收货信息不完整');
  }
  if (!util.checkPhone(data.address.phone)) {
    throw new Error('手机号格式不正确');
  }
  return true;
};

const orderApi = {
  // 创建订单
  createOrder(data) {
    try {
      validateOrderData(data);
      return request({
        url: '/orders',
        method: 'POST',
        data
      });
    } catch (error) {
      return Promise.reject(error);
    }
  },

  // 获取订单列表
  getOrderList(params) {
    return request({
      url: '/orders',
      method: 'GET',
      data: params
    });
  },

  // 获取订单详情
  getOrderDetail(orderId) {
    if (!orderId) {
      return Promise.reject(new Error('订单ID不能为空'));
    }
    return request({
      url: `/orders/${orderId}`,
      method: 'GET'
    });
  },

  // 取消订单
  cancelOrder(orderId) {
    if (!orderId) {
      return Promise.reject(new Error('订单ID不能为空'));
    }
    return request({
      url: `/orders/${orderId}/cancel`,
      method: 'POST'
    });
  },

  // 确认收货
  confirmOrder(orderId) {
    if (!orderId) {
      return Promise.reject(new Error('订单ID不能为空'));
    }
    return request({
      url: `/orders/${orderId}/confirm`,
      method: 'POST'
    });
  },

  // 删除订单
  deleteOrder(orderId) {
    if (!orderId) {
      return Promise.reject(new Error('订单ID不能为空'));
    }
    return request({
      url: `/orders/${orderId}`,
      method: 'DELETE'
    });
  },

  // 申请退款
  applyRefund(orderId, data) {
    if (!orderId) {
      return Promise.reject(new Error('订单ID不能为空'));
    }
    if (!data || typeof data !== 'object') {
      return Promise.reject(new Error('退款数据不能为空'));
    }
    if (!data.reason) {
      return Promise.reject(new Error('退款原因不能为空'));
    }
    return request({
      url: `/orders/${orderId}/refund`,
      method: 'POST',
      data
    });
  },

  // 获取退款详情
  getRefundDetail(orderId) {
    if (!orderId) {
      return Promise.reject(new Error('订单ID不能为空'));
    }
    return request({
      url: `/orders/${orderId}/refund`,
      method: 'GET'
    });
  }
};

module.exports = orderApi; 