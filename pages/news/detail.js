Page({
  data: {
    newsDetail: null,
    loading: true
  },

  onLoad(options) {
    const { id } = options;
    this.loadNewsDetail(id);
  },

  async loadNewsDetail(id) {
    try {
      const policyApi = require('../../services/policy');
      const newsDetail = await policyApi.getPolicyDetail(id);
      this.setData({
        newsDetail,
        loading: false
      });
    } catch (error) {
      console.error('加载新闻详情失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  }
}); 