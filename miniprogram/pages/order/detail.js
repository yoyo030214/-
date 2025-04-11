const app = getApp();
const { request } = require('../../utils/request');
const { showLoading, hideLoading, showError } = require('../../utils/util');

Page({
  data: {
    orderId: '',
    orderInfo: null,
    loading: true,
    logisticsInfo: null,
    // 添加缓存相关数据
    cacheKey: '',
    cacheExpire: 5 * 60 * 1000 // 5分钟缓存
  },

  onLoad(options) {
    if (options.orderId) {
      this.setData({ 
        orderId: options.orderId,
        cacheKey: `order_detail_${options.orderId}`
      });
      this.loadOrderDetail();
    }
  },

  // 加载订单详情
  async loadOrderDetail() {
    try {
      // 先尝试从缓存加载
      const cachedData = this.getOrderCache();
      if (cachedData) {
        this.setData({
          orderInfo: cachedData,
          loading: false
        });
        // 后台刷新数据
        this.refreshOrderDetail();
        return;
      }

      showLoading('加载中...');
      const res = await request({
        url: `/api/order/detail/${this.data.orderId}`
      });

      if (res.success) {
        this.setData({
          orderInfo: res.data,
          loading: false
        });
        // 更新缓存
        this.updateOrderCache(res.data);
      } else {
        showError(res.message || '加载失败');
        this.setData({ loading: false });
      }
    } catch (error) {
      showError('网络错误');
      this.setData({ loading: false });
    } finally {
      hideLoading();
    }
  },

  // 后台刷新订单详情
  async refreshOrderDetail() {
    try {
      const res = await request({
        url: `/api/order/detail/${this.data.orderId}`
      });

      if (res.success) {
        this.setData({ orderInfo: res.data });
        this.updateOrderCache(res.data);
      }
    } catch (error) {
      console.error('刷新订单详情失败:', error);
    }
  },

  // 获取订单缓存
  getOrderCache() {
    try {
      const cache = wx.getStorageSync(this.data.cacheKey);
      if (cache) {
        const { data, timestamp } = JSON.parse(cache);
        if (Date.now() - timestamp < this.data.cacheExpire) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('获取订单缓存失败:', error);
      return null;
    }
  },

  // 更新订单缓存
  updateOrderCache(data) {
    try {
      const cache = {
        data,
        timestamp: Date.now()
      };
      wx.setStorageSync(this.data.cacheKey, JSON.stringify(cache));
    } catch (error) {
      console.error('更新订单缓存失败:', error);
    }
  },

  // 清除订单缓存
  clearOrderCache() {
    try {
      wx.removeStorageSync(this.data.cacheKey);
    } catch (error) {
      console.error('清除订单缓存失败:', error);
    }
  },

  // 取消订单
  async cancelOrder() {
    try {
      const res = await wx.showModal({
        title: '提示',
        content: '确定要取消该订单吗？',
        confirmText: '确定',
        cancelText: '取消'
      });

      if (res.confirm) {
        showLoading('取消中...');
        const res = await request({
          url: '/api/order/cancel',
          method: 'POST',
          data: { orderId: this.data.orderId }
        });

        if (res.success) {
          wx.showToast({
            title: '取消成功',
            icon: 'success'
          });
          // 清除缓存并重新加载
          this.clearOrderCache();
          this.loadOrderDetail();
        } else {
          showError(res.message || '取消失败');
        }
      }
    } catch (error) {
      showError('网络错误');
    } finally {
      hideLoading();
    }
  },

  // 确认收货
  async confirmReceive() {
    try {
      const res = await wx.showModal({
        title: '提示',
        content: '确认已收到商品？',
        confirmText: '确定',
        cancelText: '取消'
      });

      if (res.confirm) {
        showLoading('确认中...');
        const res = await request({
          url: '/api/order/confirm-receive',
          method: 'POST',
          data: { orderId: this.data.orderId }
        });

        if (res.success) {
          wx.showToast({
            title: '确认成功',
            icon: 'success'
          });
          // 清除缓存并重新加载
          this.clearOrderCache();
          this.loadOrderDetail();
        } else {
          showError(res.message || '确认失败');
        }
      }
    } catch (error) {
      showError('网络错误');
    } finally {
      hideLoading();
    }
  },

  // 查看物流
  viewLogistics() {
    wx.navigateTo({
      url: `/pages/order/logistics?orderId=${this.data.orderId}`
    });
  },

  // 评价商品
  evaluateProduct(e) {
    const { productId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/order/evaluate?orderId=${this.data.orderId}&productId=${productId}`
    });
  },

  // 删除订单
  async deleteOrder() {
    try {
      const res = await wx.showModal({
        title: '提示',
        content: '确定要删除该订单吗？',
        confirmText: '确定',
        cancelText: '取消'
      });

      if (res.confirm) {
        showLoading('删除中...');
        const res = await request({
          url: '/api/order/delete',
          method: 'POST',
          data: { orderId: this.data.orderId }
        });

        if (res.success) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          // 清除缓存
          this.clearOrderCache();
          // 返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          showError(res.message || '删除失败');
        }
      }
    } catch (error) {
      showError('网络错误');
    } finally {
      hideLoading();
    }
  },

  // 复制订单号
  copyOrderNo() {
    wx.setClipboardData({
      data: this.data.orderInfo.orderNo,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        });
      }
    });
  },

  // 联系客服
  contactService() {
    wx.makePhoneCall({
      phoneNumber: this.data.orderInfo.servicePhone
    });
  },

  // 页面卸载时清除缓存
  onUnload() {
    this.clearOrderCache();
  }
}); 