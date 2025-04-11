const app = getApp();
const { request } = require('../../utils/request');
const { showLoading, hideLoading, showError } = require('../../utils/util');

Page({
  data: {
    product: null,
    loading: true,
    currentImageIndex: 0,
    quantity: 1,
    isInCart: false,
    showShareMenu: false,
    showNutrition: false,
    showEnvironment: false,
    showProcess: false,
    showCulture: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadProductDetail(options.id);
    }
  },

  // 加载产品详情
  async loadProductDetail(id) {
    try {
      this.setData({ loading: true });
      
      const res = await request({
        url: `/api/products/${id}`
      });

      if (res.success) {
        const product = res.data;
        // 处理产品图片
        product.images = Array.isArray(product.images) ? product.images : [product.images];
        
        // 处理季节性标签
        product.seasonalTags = this.getSeasonalTags(product);
        
        this.setData({
          product,
          loading: false,
          isInCart: app.globalData.cart.some(item => item.id === product.id)
        });
      } else {
        showError(res.message || '加载失败');
        this.setData({ loading: false });
      }
    } catch (error) {
      showError('网络错误');
      this.setData({ loading: false });
    }
  },

  // 获取季节性标签
  getSeasonalTags(product) {
    const tags = [];
    if (product.isInSeason) {
      tags.push('当季');
    }
    if (product.seasons && product.seasons.length > 0) {
      tags.push(...product.seasons.map(season => {
        const seasonMap = {
          spring: '春季',
          summer: '夏季',
          autumn: '秋季',
          winter: '冬季'
        };
        return seasonMap[season] || season;
      }));
    }
    return tags;
  },

  // 切换图片
  onImageChange(e) {
    this.setData({
      currentImageIndex: e.detail.current
    });
  },

  // 调整数量
  adjustQuantity(e) {
    const { type } = e.currentTarget.dataset;
    let quantity = this.data.quantity;
    
    if (type === 'minus' && quantity > 1) {
      quantity--;
    } else if (type === 'plus' && quantity < this.data.product.stock) {
      quantity++;
    }
    
    this.setData({ quantity });
  },

  // 加入购物车
  async addToCart() {
    const { product, quantity } = this.data;
    
    try {
      showLoading('添加中...');
      
      const res = await request({
        url: '/api/cart/add',
        method: 'POST',
        data: {
          productId: product.id,
          quantity
        }
      });

      if (res.success) {
        app.globalData.cart = res.data.cart;
        this.setData({ isInCart: true });
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
      } else {
        showError(res.message || '添加失败');
      }
    } catch (error) {
      showError('网络错误');
    } finally {
      hideLoading();
    }
  },

  // 立即购买
  buyNow() {
    const { product, quantity } = this.data;
    wx.navigateTo({
      url: `/pages/order/confirm?productId=${product.id}&quantity=${quantity}`
    });
  },

  // 切换信息展示
  toggleInfo(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({
      [`show${type}`]: !this.data[`show${type}`]
    });
  },

  // 分享
  onShareAppMessage() {
    const { product } = this.data;
    return {
      title: product.name,
      path: `/pages/products/detail?id=${product.id}`,
      imageUrl: product.images[0]
    };
  },

  // 显示分享菜单
  showShareMenu() {
    this.setData({ showShareMenu: true });
  },

  // 隐藏分享菜单
  hideShareMenu() {
    this.setData({ showShareMenu: false });
  }
}); 