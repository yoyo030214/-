Page({
  data: {
    product: null,
    priceHistory: [], // 价格历史
    loading: true,
    currentTab: 0, // 0: 商品详情, 1: 价格走势
    specs: [], // 规格选择
    selectedSpec: null,
    quantity: 1,
    refreshInterval: null // 用于存储定时器ID
  },

  onLoad(options) {
    const { id } = options;
    this.loadProductDetail(id);
    // 启动实时价格更新，每5分钟更新一次
    this.startPriceUpdate(id);
  },

  onUnload: function() {
    // 页面卸载时清除定时器
    if (this.data.refreshInterval) {
      clearInterval(this.data.refreshInterval);
    }
  },

  // 开始价格更新
  startPriceUpdate: function(productId) {
    // 先立即更新一次价格
    this.updatePrice(productId);
    
    // 设置定时更新
    const refreshInterval = setInterval(() => {
      this.updatePrice(productId);
    }, 5 * 60 * 1000); // 5分钟更新一次
    
    this.setData({ refreshInterval });
  },

  // 更新价格
  updatePrice: function(productId) {
    // 这里模拟从服务器获取最新价格
    // 实际开发时需要对接后端API
    const newPrice = (Math.random() * 2 + 4).toFixed(2); // 模拟4-6元之间的随机价格
    const timestamp = new Date().toLocaleString();

    this.setData({
      ['product.price']: newPrice,
      ['product.updateTime']: timestamp,
      priceHistory: [
        {
          price: newPrice,
          time: timestamp
        },
        ...this.data.priceHistory.slice(0, 23) // 保留24小时的价格记录
      ]
    });
  },

  async loadProductDetail(id) {
    try {
      const productApi = require('../../services/product');
      const product = await productApi.getProductDetail(id);
      this.setData({
        product,
        specs: product.specs,
        selectedSpec: product.specs[1], // 默认选中中果
        loading: false
      });
    } catch (error) {
      console.error('加载商品详情失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 切换标签页
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  // 选择规格
  selectSpec: function(e) {
    const specId = e.currentTarget.dataset.id;
    const spec = this.data.specs.find(s => s.id === specId);
    this.setData({ selectedSpec: spec });
  },

  // 修改数量
  changeQuantity: function(e) {
    const type = e.currentTarget.dataset.type;
    let quantity = this.data.quantity;
    
    if (type === 'minus' && quantity > 1) {
      quantity--;
    } else if (type === 'plus' && quantity < this.data.product.stock) {
      quantity++;
    }
    
    this.setData({ quantity });
  },

  // 添加到购物车
  addToCart: function() {
    if (!this.data.selectedSpec) {
      wx.showToast({
        title: '请选择规格',
        icon: 'none'
      });
      return;
    }

    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    });
  },

  // 立即购买
  buyNow: function() {
    if (!this.data.selectedSpec) {
      wx.showToast({
        title: '请选择规格',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/order/confirm'
    });
  },

  // 增加数量
  increaseQuantity() {
    this.setData({
      quantity: this.data.quantity + 1
    });
  },

  // 减少数量
  decreaseQuantity() {
    if (this.data.quantity > 1) {
      this.setData({
        quantity: this.data.quantity - 1
      });
    }
  }
}); 