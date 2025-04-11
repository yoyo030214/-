const app = getApp();
const { request } = require('../../utils/request');
const { showLoading, hideLoading, showError } = require('../../utils/util');

Page({
  data: {
    products: [],
    seasonalProducts: [], // 当季产品
    loading: true,
    isLoadingMore: false,
    page: 1,
    hasMore: true,
    currentFilter: 'all',
    currentSeason: 'all',
    
    // 筛选选项
    filters: [
      { id: 'all', name: '全部' },
      { id: 'fruits', name: '水果' },
      { id: 'vegetables', name: '蔬菜' },
      { id: 'tea', name: '茶叶' },
      { id: 'aquatic', name: '水产' }
    ],
    
    // 季节标签
    seasons: [
      { id: 'all', name: '全年' },
      { id: 'spring', name: '春季' },
      { id: 'summer', name: '夏季' },
      { id: 'autumn', name: '秋季' },
      { id: 'winter', name: '冬季' }
    ]
  },

  onLoad() {
    this.loadProducts();
  },

  // 加载产品数据
  async loadProducts(isLoadMore = false) {
    if (this.data.isLoadingMore) return;
    
    try {
      if (!isLoadMore) {
        this.setData({ loading: true });
      } else {
        this.setData({ isLoadingMore: true });
      }
      
      const res = await request({
        url: '/api/products',
        data: {
          filter: this.data.currentFilter,
          season: this.data.currentSeason,
          page: isLoadMore ? this.data.page + 1 : 1,
          limit: 20
        }
      });

      if (res.success) {
        const products = isLoadMore 
          ? [...this.data.products, ...res.data.products]
          : res.data.products;
        
        // 处理产品图片
        const processedProducts = products.map(product => ({
          ...product,
          images: Array.isArray(product.images) ? product.images : [product.images]
        }));

        // 分离当季产品
        const seasonalProducts = processedProducts.filter(p => p.isInSeason);
        const otherProducts = processedProducts.filter(p => !p.isInSeason);

        this.setData({
          products: otherProducts,
          seasonalProducts: seasonalProducts,
          loading: false,
          isLoadingMore: false,
          page: isLoadMore ? this.data.page + 1 : 1,
          hasMore: res.data.currentPage < res.data.totalPages
        });
      } else {
        showError(res.message || '加载失败');
        this.setData({ 
          loading: false,
          isLoadingMore: false
        });
      }
    } catch (error) {
      showError('网络错误');
      this.setData({ 
        loading: false,
        isLoadingMore: false
      });
    }
  },

  // 处理筛选变化
  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter,
      page: 1,
      hasMore: true
    });
    this.loadProducts();
  },

  // 处理季节筛选变化
  onSeasonChange(e) {
    const season = e.currentTarget.dataset.season;
    this.setData({
      currentSeason: season,
      page: 1,
      hasMore: true
    });
    this.loadProducts();
  },

  // 跳转到产品详情
  navigateToProduct(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/products/detail?id=${id}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true
    });
    this.loadProducts().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoadingMore) {
      this.loadProducts(true);
    }
  }
}); 