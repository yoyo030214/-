const api = require('../../utils/api');

Page({
  data: {
    loading: true,
    banners: [],
    categories: [],
    hotProducts: [],
    seasonalTitle: '',
    seasonalDesc: '',
    seasonalImage: ''
  },

  onLoad() {
    this.loadPageData();
  },

  // 加载页面数据
  async loadPageData() {
    try {
      this.setData({ loading: true });
      
      // 并行加载数据
      const [bannersRes, categoriesRes, hotProductsRes, seasonalRes] = await Promise.all([
        api.getBanners(),
        api.getCategories(),
        api.getHotProducts(),
        api.getSeasonalProducts(1)
      ]);

      // 处理轮播图数据
      if (bannersRes.success) {
        this.setData({ banners: bannersRes.banners });
      }

      // 处理分类数据
      if (categoriesRes.success) {
        this.setData({ categories: categoriesRes.categories });
      }

      // 处理热门商品数据
      if (hotProductsRes.success) {
        this.setData({ hotProducts: hotProductsRes.products });
      }

      // 处理季节性数据
      if (seasonalRes.success) {
        const seasonInfo = this.getSeasonInfo(seasonalRes.season);
        this.setData({
          seasonalTitle: seasonInfo.name,
          seasonalDesc: seasonInfo.desc,
          seasonalImage: seasonInfo.image
        });
      }

      this.setData({ loading: false });
    } catch (error) {
      console.error('加载页面数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 获取季节信息
  getSeasonInfo(season) {
    const seasonMap = {
      spring: {
        name: '春季',
        desc: '春暖花开，万物复苏',
        image: '/images/seasons/spring.jpg'
      },
      summer: {
        name: '夏季',
        desc: '夏日炎炎，瓜果飘香',
        image: '/images/seasons/summer.jpg'
      },
      autumn: {
        name: '秋季',
        desc: '秋高气爽，硕果累累',
        image: '/images/seasons/autumn.jpg'
      },
      winter: {
        name: '冬季',
        desc: '冬寒料峭，温暖相伴',
        image: '/images/seasons/winter.jpg'
      }
    };
    
    return seasonMap[season] || {
      name: '当季',
      desc: '应季产品推荐',
      image: '/images/seasons/default.jpg'
    };
  },

  // 页面跳转方法
  navigateToCategory(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/products/index?categoryId=${id}`
    });
  },

  navigateToProducts() {
    wx.switchTab({
      url: '/pages/products/index'
    });
  },

  navigateToProductDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/products/detail?id=${id}`
    });
  },

  navigateToSeasonal() {
    wx.navigateTo({
      url: '/pages/seasonal/index'
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadPageData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
}); 