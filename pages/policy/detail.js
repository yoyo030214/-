Page({
  data: {
    policy: null,
    loading: true
  },

  onLoad(options) {
    const { id } = options;
    this.loadPolicyDetail(id);
  },

  async loadPolicyDetail(id) {
    try {
      const policyApi = require('../../services/policy');
      const policy = await policyApi.getPolicyDetail(id);
      this.setData({
        policy,
        loading: false
      });
    } catch (error) {
      console.error('加载政策详情失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 下载附件
  downloadAttachment: function(e) {
    const url = e.currentTarget.dataset.url;
    wx.downloadFile({
      url: url,
      success: function(res) {
        wx.openDocument({
          filePath: res.tempFilePath
        });
      }
    });
  },

  // 跳转到相关政策
  goToRelatedPolicy: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/policy/detail?id=${id}`
    });
  },

  // 分享
  onShareAppMessage() {
    if (!this.data.policy) return {
      title: '三农政策资讯',
      path: '/pages/policy/policy'
    };
    
    return {
      title: this.data.policy.title,
      path: `/pages/policy/detail?id=${this.data.policy.id}`
    };
  }
}); 