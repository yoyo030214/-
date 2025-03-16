// pages/index/home.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    banners: [
      { id: 1, image: '/images/banners/banner1.jpg', title: '新鲜时令水果' },
      { id: 2, image: '/images/banners/banner2.jpg', title: '绿色有机蔬菜' },
      { id: 3, image: '/images/banners/banner3.jpg', title: '特色农产品' }
    ],
    categories: [
      { id: 1, name: '时令水果', icon: '/images/icons/fruits.png' },
      { id: 2, name: '新鲜蔬菜', icon: '/images/icons/vegetables.png' },
      { id: 3, name: '地方特产', icon: '/images/icons/specialty.png' },
      { id: 4, name: '农家腌制', icon: '/images/icons/pickles.png' }
    ],
    products: [
      {
        id: 1,
        category: '时令水果',
        name: '咸宁蜜桔',
        price: 5.8,
        unit: '斤',
        image: '/images/products/orange.jpg',
        description: '咸宁特产蜜桔，皮薄多汁，清甜可口'
      },
      {
        id: 2,
        category: '新鲜蔬菜',
        name: '潜江藕带',
        price: 12.8,
        unit: '斤',
        image: '/images/products/lotus.jpg',
        description: '潜江特产藕带，鲜嫩爽口，营养丰富'
      },
      {
        id: 3,
        category: '新鲜蔬菜',
        name: '洪湖莲藕',
        price: 6.5,
        unit: '斤',
        image: '/images/products/lotus_root.jpg',
        description: '洪湖特产莲藕，肉质细嫩，清甜可口'
      },
      {
        id: 4,
        category: '地方特产',
        name: '随州香菇',
        price: 28.8,
        unit: '斤',
        image: '/images/products/mushroom.jpg',
        description: '随州特产香菇，肉厚味美，营养丰富'
      },
      {
        id: 5,
        category: '新鲜蔬菜',
        name: '宜昌青菜',
        price: 3.5,
        unit: '斤',
        image: '/images/products/vegetables.jpg',
        description: '宜昌本地青菜，新鲜翠绿，清脆可口'
      },
      {
        id: 6,
        category: '农家腌制',
        name: '咸宁酱菜',
        price: 15.8,
        unit: '斤',
        image: '/images/products/pickles.jpg',
        description: '咸宁特色酱菜，开胃下饭，美味可口'
      }
    ],
    featuredProducts: [
      {
        id: 1,
        name: '红富士苹果',
        price: '5.99',
        unit: '斤',
        image: '/images/products/apple.jpg',
        description: '新鲜采摘，产地直供'
      },
      {
        id: 2,
        name: '有机生菜',
        price: '3.99',
        unit: '斤',
        image: '/images/products/lettuce.jpg',
        description: '无农药，绿色种植'
      }
    ],
    agriculturalNews: [
      {
        id: 1,
        title: '2024年农业补贴政策解读',
        date: '2024-03-05',
        summary: '最新农业补贴政策详细解读...'
      },
      {
        id: 2,
        title: '春季农作物种植指南',
        date: '2024-03-04',
        summary: '专家为您详细讲解春季种植要点...'
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadWeatherData();
    this.loadPolicyData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 下拉刷新
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 加载天气数据
  async loadWeatherData() {
    try {
      const weatherApi = require('../../services/weather');
      const weatherData = await weatherApi.getWeather();
      this.setData({
        weather: weatherData
      });
    } catch (error) {
      console.error('加载天气数据失败:', error);
      wx.showToast({
        title: '加载天气数据失败',
        icon: 'none'
      });
    }
  },

  // 加载政策数据
  async loadPolicyData() {
    try {
      const policyApi = require('../../services/policy');
      const policyData = await policyApi.getLatestPolicies();
      this.setData({
        agriculturalNews: policyData
      });
    } catch (error) {
      console.error('加载政策数据失败:', error);
      wx.showToast({
        title: '加载政策数据失败',
        icon: 'none'
      });
    }
  },

  // 跳转到商品详情
  goToProductDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    });
  },

  // 跳转到新闻详情
  goToNewsDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/news/detail?id=${id}`
    });
  },

  // 加入购物车
  addToCart(e) {
    const { id } = e.currentTarget.dataset;
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    });
  },

  // 按分类筛选商品
  filterByCategory(e) {
    const category = e.currentTarget.dataset.category;
    // 实现分类筛选逻辑
  }
})