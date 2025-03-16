Page({
  data: {
    products: [],
    categories: [],
    currentCategory: 'all',
    loading: true
  },

  onLoad() {
    this.loadCategories();
    this.loadProducts();
  },

  async loadCategories() {
    try {
      const productApi = require('../../services/product');
      const categories = await productApi.getCategories();
      this.setData({ categories });
    } catch (error) {
      console.error('加载分类失败:', error);
      wx.showToast({
        title: '加载分类失败',
        icon: 'none'
      });
    }
  },

  async loadProducts() {
    try {
      const productApi = require('../../services/product');
      const products = await productApi.getProducts({
        category: this.data.currentCategory === 'all' ? undefined : this.data.currentCategory
      });
      this.setData({
        products,
        loading: false
      });
    } catch (error) {
      console.error('加载商品失败:', error);
      wx.showToast({
        title: '加载商品失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  filterByCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      loading: true
    }, () => {
      this.loadProducts();
    });
  },

  goToProductDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    });
  }
}); 