const api = require('../../utils/api');

Page({
  data: {
    order: null,
    logistics: null,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.loadOrderLogistics(options.id);
    }
  },

  // 加载订单物流信息
  async loadOrderLogistics(id) {
    try {
      this.setData({ loading: true });
      const [order, logistics] = await Promise.all([
        api.getOrderDetail(id),
        api.getOrderLogistics(id)
      ]);
      
      this.setData({ 
        order,
        logistics,
        loading: false
      });
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 复制运单号
  copyTrackingNo() {
    const { trackingNo } = this.data.logistics;
    wx.setClipboardData({
      data: trackingNo,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        });
      }
    });
  }
}); 