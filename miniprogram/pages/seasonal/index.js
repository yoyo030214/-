const api = require('../../utils/api');

Page({
  data: {
    loading: true,
    season: '',
    seasonName: '',
    seasonDesc: '',
    seasonImage: '',
    products: []
  },

  onLoad() {
    this.loadSeasonalProducts();
  },

  // 加载季节性产品
  async loadSeasonalProducts() {
    try {
      this.setData({ loading: true });
      
      const res = await api.getSeasonalProducts();
      
      if (res.success) {
        // 设置季节信息
        const seasonInfo = this.getSeasonInfo(res.season);
        
        this.setData({
          season: res.season,
          seasonName: seasonInfo.name,
          seasonDesc: seasonInfo.desc,
          seasonImage: seasonInfo.image,
          products: res.products,
          loading: false
        });
      } else {
        wx.showToast({
          title: res.message || '加载失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    } catch (error) {
      console.error('加载季节性产品失败:', error);
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

  // 点击产品
  onProductTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/products/detail?id=${id}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadSeasonalProducts().then(() => {
      wx.stopPullDownRefresh();
    });
  }
}); 