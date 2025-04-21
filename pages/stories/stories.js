Page({
  data: {
    currentCategory: 'all',
    stories: [],
    loading: false,
    noMore: false,
    page: 1,
    pageSize: 10
  },

  onLoad() {
    this.loadStories();
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      stories: [],
      page: 1,
      noMore: false
    });
    this.loadStories();
  },

  // 加载故事列表
  async loadStories() {
    if (this.data.loading || this.data.noMore) return;

    this.setData({ loading: true });

    try {
      wx.request({
        url: 'http://175.178.80.222:3000/api/farmer-stories',
        method: 'GET',
        success: (res) => {
          const newStories = res.data.stories;
          this.setData({
            stories: [...this.data.stories, ...newStories],
            page: this.data.page + 1,
            noMore: newStories.length < this.data.pageSize
          });
        },
        fail: () => {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
        },
        complete: () => {
          this.setData({ loading: false });
        }
      });
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 搜索故事
  onSearch(e) {
    const keyword = e.detail.value;
    this.setData({
      stories: [],
      page: 1,
      noMore: false
    });
    // 实现搜索逻辑
    console.log('搜索关键词:', keyword);
    this.loadStories();
  },

  // 查看故事详情
  viewStory(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/story/story?id=${id}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      stories: [],
      page: 1,
      noMore: false
    });
    this.loadStories().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadStories();
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '农户故事',
      path: '/pages/stories/stories'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '农户故事'
    };
  }
}); 