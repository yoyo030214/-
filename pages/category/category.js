Page({
  data: {
    categories: [
      { id: 'vegetable', name: '蔬菜', icon: '/images/vegetable.png' },
      { id: 'fruit', name: '水果', icon: '/images/fruit.png' },
      { id: 'fresh', name: '生鲜', icon: '/images/fresh.png' },
      { id: 'other', name: '其他', icon: '/images/other.png' }
    ],
    currentCategory: 'vegetable',
    products: [],
    loading: false,
    page: 1,
    hasMore: true
  },

  onLoad: function() {
    this.loadProducts();
  },

  // 切换分类
  switchCategory: function(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      products: [],
      page: 1,
      hasMore: true
    });
    this.loadProducts();
  },

  // 加载商品数据
  loadProducts: async function() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    try {
      const res = await wx.request({
        url: 'http://175.178.80.222:3000/api/products',
        method: 'GET',
        data: {
          category: this.data.currentCategory,
          page: this.data.page,
          limit: 10
        }
      });
      
      if (res.data.success) {
        const newProducts = res.data.data;
        this.setData({
          products: [...this.data.products, ...newProducts],
          page: this.data.page + 1,
          hasMore: newProducts.length === 10
        });
      }
    } catch (error) {
      console.error('加载商品失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.setData({
      products: [],
      page: 1,
      hasMore: true
    });
    this.loadProducts().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  onReachBottom: function() {
    this.loadProducts();
  },

  // 点击分类项
  onCategoryTap(e) {
    try {
      const category = e.currentTarget.dataset.category;
      console.log('跳转到分类:', category);
      
      // 确保category正确传递
      wx.navigateTo({
        url: `/pages/more/more?category=${encodeURIComponent(category)}`,
        fail: (err) => {
          console.error('导航失败:', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    } catch (error) {
      console.error('分类跳转错误:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },
  
  // 返回首页
  goToHome() {
    try {
      wx.switchTab({
        url: '/pages/index/index',
        fail: (err) => {
          console.error('导航到首页失败:', err);
          wx.navigateTo({
            url: '/pages/index/index'
          });
        }
      });
    } catch (error) {
      console.error('返回首页错误:', error);
      wx.showToast({
        title: '返回首页失败',
        icon: 'none'
      });
    }
  },
  
  // 查看全部产品
  viewAllProducts() {
    try {
      wx.navigateTo({
        url: '/pages/more/more?category=' + encodeURIComponent('全部'),
        fail: (err) => {
          console.error('导航失败:', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    } catch (error) {
      console.error('查看全部产品错误:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },
  
  // 处理图标加载错误
  handleIconError(e) {
    const index = e.currentTarget.dataset.index;
    const defaultIcon = '/images/default_icon.png'; // 默认图标路径
    
    // 创建新的分类数组副本
    const updatedCategories = [...this.data.categories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      icon: defaultIcon
    };
    
    this.setData({
      categories: updatedCategories
    });
    
    console.warn(`分类图标加载失败，已替换为默认图标。索引: ${index}, 分类名: ${this.data.categories[index].name}`);
  }
}); 