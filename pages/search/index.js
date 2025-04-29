const productApi = require('../../services/product');
const util = require('../../utils/util');

Page({
  data: {
    keyword: '',
    historyKeywords: [],
    hotKeywords: ['有机蔬菜', '脐橙', '大米', '草莓', '咸安特产', '柑橘'],
    products: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    searching: false,
    emptyResult: false,
    searchPlaceholder: '搜索农产品'
  },

  onLoad() {
    // 获取历史搜索记录
    this.loadSearchHistory();
  },

  // 加载历史搜索记录
  loadSearchHistory() {
    const historyKeywords = wx.getStorageSync('searchHistory') || [];
    this.setData({
      historyKeywords: historyKeywords.slice(0, 10) // 只显示最近10条
    });
  },

  // 保存搜索记录
  saveSearchHistory(keyword) {
    if (!keyword.trim()) return;
    
    let historyKeywords = wx.getStorageSync('searchHistory') || [];
    
    // 如果已存在，则删除旧记录
    historyKeywords = historyKeywords.filter(item => item !== keyword);
    
    // 添加到数组开头
    historyKeywords.unshift(keyword);
    
    // 限制历史记录数量
    if (historyKeywords.length > 20) {
      historyKeywords = historyKeywords.slice(0, 20);
    }
    
    // 保存到本地存储
    wx.setStorageSync('searchHistory', historyKeywords);
    
    // 更新页面数据
    this.setData({
      historyKeywords: historyKeywords.slice(0, 10)
    });
  },

  // 清空搜索历史
  clearSearchHistory() {
    wx.showModal({
      title: '提示',
      content: '确定要清空搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory');
          this.setData({
            historyKeywords: []
          });
        }
      }
    });
  },

  // 点击搜索按钮
  handleSearch() {
    const { keyword } = this.data;
    if (!keyword.trim()) {
      util.showToast('请输入搜索关键词');
      return;
    }
    
    // 保存搜索记录
    this.saveSearchHistory(keyword);
    
    // 开始搜索
    this.setData({
      page: 1,
      products: [],
      hasMore: true,
      searching: true,
      emptyResult: false
    }, () => {
      this.searchProducts();
    });
  },

  // 输入框值变化
  onInputChange(e) {
    this.setData({
      keyword: e.detail.value
    });
  },

  // 清空输入框
  clearInput() {
    this.setData({
      keyword: '',
      products: [],
      searching: false,
      emptyResult: false
    });
  },

  // 点击历史记录或热门搜索项
  onTagTap(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      keyword
    }, () => {
      this.handleSearch();
    });
  },

  // 搜索商品
  async searchProducts() {
    const { keyword, page, pageSize, products, loading } = this.data;
    
    if (loading) return;
    
    this.setData({ loading: true });
    
    try {
      const res = await productApi.searchProducts(keyword, {
        page,
        pageSize
      });
      
      const newProducts = res.data || [];
      
      // 更新列表和分页信息
      this.setData({
        products: page === 1 ? newProducts : [...products, ...newProducts],
        hasMore: newProducts.length === pageSize,
        loading: false,
        emptyResult: page === 1 && newProducts.length === 0
      });
    } catch (error) {
      console.error('搜索商品失败:', error);
      this.setData({
        loading: false,
        hasMore: false
      });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    if (!this.data.searching) return;
    
    this.setData({
      page: 1,
      hasMore: true
    }, () => {
      this.searchProducts();
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.searching || !this.data.hasMore || this.data.loading) return;
    
    this.setData({
      page: this.data.page + 1
    }, () => {
      this.searchProducts();
    });
  },

  // 查看商品详情
  viewProduct(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product/detail?id=${productId}`
    });
  },

  // 返回上一页
  navigateBack() {
    wx.navigateBack();
  }
}); 