// app.js
const { request } = require('./utils/request');
const { showError } = require('./utils/util');
const config = require('./utils/config');

App({
  globalData: {
    userInfo: null,
    systemInfo: null,
    location: null,
    weather: null,
    // 购物车相关
    cartItems: [],
    cartCount: 0,
    needRefreshCart: false,
    // 收藏相关
    favoriteCount: 0,
    needRefreshFavorites: false
  },

  onLaunch() {
    // 获取系统信息
    this.getSystemInfo();
    // 检查登录状态
    this.checkLoginStatus();
    // 获取位置信息
    this.getLocation();
    // 设置环境变量 - 修复process.env引用
    wx.setStorageSync('env', 'production');
    // 初始化购物车数据
    this.initCartData();
  },

  // 获取系统信息
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;
    } catch (error) {
      console.error('获取系统信息失败:', error);
    }
  },

  // 检查登录状态
  async checkLoginStatus() {
    const token = wx.getStorageSync(config.storage.tokenKey);
    if (token) {
      try {
        const res = await request({
          url: '/api/user/info',
          method: 'GET'
        });
        this.globalData.userInfo = res.data;
        wx.setStorageSync(config.storage.userInfoKey, res.data);
      } catch (error) {
        console.error('获取用户信息失败:', error);
        wx.removeStorageSync(config.storage.tokenKey);
        wx.removeStorageSync(config.storage.userInfoKey);
      }
    }
  },

  // 初始化购物车数据
  initCartData() {
    try {
      // 从本地存储获取购物车数据
      const cartItems = wx.getStorageSync('cartItems') || [];
      const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
      
      this.globalData.cartItems = cartItems;
      this.globalData.cartCount = cartCount;
      
      // 获取收藏数量
      const favoriteCount = wx.getStorageSync('favoriteCount') || 0;
      this.globalData.favoriteCount = favoriteCount;
    } catch (error) {
      console.error('初始化购物车数据失败:', error);
    }
  },

  // 添加商品到购物车
  addToCart(product, quantity = 1) {
    try {
      const cartItems = [...this.globalData.cartItems];
      const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        // 商品已存在，增加数量
        cartItems[existingItemIndex].quantity += quantity;
      } else {
        // 添加新商品
        cartItems.push({
          ...product,
          quantity
        });
      }
      
      // 更新购物车数量
      const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
      
      // 更新全局数据
      this.globalData.cartItems = cartItems;
      this.globalData.cartCount = cartCount;
      
      // 保存到本地存储
      wx.setStorageSync('cartItems', cartItems);
      
      return true;
    } catch (error) {
      console.error('添加到购物车失败:', error);
      return false;
    }
  },

  // 获取位置信息
  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: async (res) => {
        this.globalData.location = res;
        // 获取天气信息
        this.getWeather(res.latitude, res.longitude);
      },
      fail: (error) => {
        console.error('获取位置信息失败:', error);
      }
    });
  },

  // 获取天气信息
  async getWeather(latitude, longitude) {
    try {
      const res = await request({
        url: '/api/weather',
        method: 'GET',
        data: {
          latitude,
          longitude
        }
      });
      this.globalData.weather = res.data;
    } catch (error) {
      console.error('获取天气信息失败:', error);
    }
  },

  // 登录方法
  async login() {
    try {
      const { code } = await wx.login();
      const res = await request({
        url: '/api/user/login',
        method: 'POST',
        data: { code }
      });

      const { token, userInfo } = res.data;
      wx.setStorageSync(config.storage.tokenKey, token);
      wx.setStorageSync(config.storage.userInfoKey, userInfo);
      this.globalData.userInfo = userInfo;

      return userInfo;
    } catch (error) {
      showError('登录失败');
      throw error;
    }
  },

  // 退出登录
  logout() {
    wx.removeStorageSync(config.storage.tokenKey);
    wx.removeStorageSync(config.storage.userInfoKey);
    this.globalData.userInfo = null;
  }
});


