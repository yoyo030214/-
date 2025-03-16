const { request } = require('../../utils/request');
const { showError, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    orderId: '',
    logisticsInfo: null,
    loading: false
  },

  onLoad(options) {
    if (options.orderId) {
      this.setData({ orderId: options.orderId });
      this.loadLogisticsInfo();
    }
  },

  // 加载物流信息
  async loadLogisticsInfo() {
    try {
      showLoading('加载中...');
      const res = await request({
        url: `/api/orders/${this.data.orderId}/logistics`,
        method: 'GET'
      });
      this.setData({
        logisticsInfo: res.data
      });
    } catch (error) {
      showError('加载物流信息失败');
    } finally {
      hideLoading();
    }
  },

  // 复制运单号
  onCopyNumber() {
    wx.setClipboardData({
      data: this.data.logisticsInfo.number,
      success: () => {
        wx.showToast({
          title: '运单号已复制',
          icon: 'success'
        });
      }
    });
  },

  // 刷新物流信息
  onRefresh() {
    this.loadLogisticsInfo();
  }
}); 