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
      // 这里替换为实际的API调用
      const newStories = [
        {
          id: 1,
          image: '/images/farmers/farmer-1.jpg',
          farmerName: '张大叔',
          title: '30年老果农的红心柚种植经验',
          views: 1234,
          date: '2024-03-05'
        },
        {
          id: 2,
          image: '/images/farmers/farmer-2.jpg',
          farmerName: '李阿姨',
          title: '绿色有机蔬菜的种植之路',
          views: 2345,
          date: '2024-03-04'
        }
      ];

      this.setData({
        stories: [...this.data.stories, ...newStories],
        page: this.data.page + 1,
        noMore: newStories.length < this.data.pageSize
      });
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
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