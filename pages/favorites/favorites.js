// pages/favorites/favorites.js
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    favoritesList: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    selectAll: false,
    selectedItems: [],
    touchStartX: 0,
    touchEndX: 0,
    showCartAnimation: false,
    cartAnimationStart: { x: 0, y: 0 },
    cartAnimationEnd: { x: 0, y: 0 }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadFavorites();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 获取购物车图标位置，用于动画
    this.getTabBarPosition();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时刷新收藏列表
    this.setData({
      page: 1,
      favoritesList: [],
      hasMore: true
    });
    this.loadFavorites();
    
    // 获取购物车图标位置，用于动画
    this.getTabBarPosition();
  },

  /**
   * 获取TabBar中购物车图标的位置
   */
  getTabBarPosition() {
    // 这里需要根据实际TabBar布局计算购物车图标位置
    // 简化处理，使用屏幕右下角位置
    const systemInfo = wx.getSystemInfoSync();
    const cartIconPosition = {
      x: systemInfo.windowWidth - 40,
      y: systemInfo.windowHeight - 30
    };
    
    this.setData({
      cartAnimationEnd: cartIconPosition
    });
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
   * 加载收藏列表
   */
  loadFavorites() {
    if (!this.data.hasMore || this.data.loading) return;
    
    this.setData({ loading: true });
    
    // 模拟数据加载，实际项目中应该调用API
    setTimeout(() => {
      // 模拟数据
      const mockData = [
        {
          id: '1',
          productId: '101',
          name: '有机红富士苹果',
          spec: '5kg/箱',
          price: '59.90',
          originalPrice: '79.90',
          image: '/images/products/orange.webp',
          origin: '陕西洛川',
          isOrganic: true,
          showDelete: false
        },
        {
          id: '2',
          productId: '102',
          name: '新鲜西红柿',
          spec: '2.5kg/箱',
          price: '29.90',
          originalPrice: '39.90',
          image: '/images/products/vegbox.webp',
          origin: '山东寿光',
          isFresh: true,
          showDelete: false
        },
        {
          id: '3',
          productId: '103',
          name: '有机胡萝卜',
          spec: '2kg/袋',
          price: '15.90',
          image: '/images/products/corn.webp',
          origin: '河北唐山',
          isOrganic: true,
          showDelete: false
        }
      ];
      
      // 模拟分页
      const hasMore = this.data.page < 3; // 假设只有3页数据
      
      this.setData({
        favoritesList: this.data.page === 1 ? mockData : this.data.favoritesList.concat(mockData),
        loading: false,
        hasMore: hasMore,
        page: this.data.page + 1
      });
      
      // 更新全局收藏数量
      app.globalData.favoriteCount = this.data.favoritesList.length;
      wx.setStorageSync('favoriteCount', this.data.favoritesList.length);
    }, 1000);
  },

  /**
   * 查看商品详情
   */
  onViewProduct(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product/detail/detail?id=${productId}`
    });
  },

  /**
   * 取消收藏
   */
  onCancelFavorite(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '提示',
      content: '确定要取消收藏该商品吗？',
      success: (res) => {
        if (res.confirm) {
          // 过滤掉要取消的收藏项
          const newList = this.data.favoritesList.filter(item => item.id !== id);
          // 同时从已选择列表中移除
          const newSelectedItems = this.data.selectedItems.filter(itemId => itemId !== id);
          
          this.setData({
            favoritesList: newList,
            selectedItems: newSelectedItems,
            selectAll: newSelectedItems.length === newList.length && newList.length > 0
          });
          
          // 更新全局收藏数量
          app.globalData.favoriteCount = newList.length;
          wx.setStorageSync('favoriteCount', newList.length);
          
          wx.showToast({
            title: '已取消收藏',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 加入购物车
   */
  onAddToCart(e) {
    const productId = e.currentTarget.dataset.id;
    const item = e.currentTarget.dataset.item;
    const index = e.currentTarget.dataset.index;
    
    // 获取按钮位置，作为动画起点
    const query = wx.createSelectorQuery();
    query.selectAll('.btn-cart').boundingClientRect();
    query.exec((res) => {
      if (res[0] && res[0][index]) {
        const buttonRect = res[0][index];
        const buttonCenter = {
          x: buttonRect.left + buttonRect.width / 2,
          y: buttonRect.top + buttonRect.height / 2
        };
        
        // 设置动画起点
        this.setData({
          cartAnimationStart: buttonCenter,
          showCartAnimation: true
        });
        
        // 添加按钮点击效果
        const btnClass = `.btn-cart:nth-child(${index + 1})`;
        const btn = wx.createSelectorQuery().select(btnClass);
        if (btn) {
          btn.addClass('active');
          setTimeout(() => {
            btn.removeClass('active');
          }, 500);
        }
      }
    });
    
    // 构建商品对象
    const product = {
      id: productId,
      name: item.name,
      price: item.price,
      image: item.image || '/images/default_product.webp',
      spec: item.spec,
      origin: item.origin
    };
    
    // 使用全局方法添加到购物车
    const success = app.addToCart(product, 1);
    
    if (success) {
      wx.showToast({
        title: '已加入购物车',
        icon: 'success'
      });
      
      // 设置需要刷新购物车标志
      app.globalData.needRefreshCart = true;
    } else {
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      });
    }
  },

  /**
   * 购物车动画结束回调
   */
  onCartAnimationEnd() {
    this.setData({
      showCartAnimation: false
    });
  },

  /**
   * 清空收藏
   */
  onClearFavorites() {
    if (this.data.favoritesList.length === 0) return;
    
    wx.showModal({
      title: '提示',
      content: '确定要清空所有收藏吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            favoritesList: [],
            selectedItems: [],
            selectAll: false
          });
          
          // 更新全局收藏数量
          app.globalData.favoriteCount = 0;
          wx.setStorageSync('favoriteCount', 0);
          
          wx.showToast({
            title: '已清空收藏',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 去购物
   */
  onGoShopping() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  /**
   * 全选/取消全选
   */
  onSelectAll() {
    const selectAll = !this.data.selectAll;
    let selectedItems = [];
    
    if (selectAll) {
      // 全选
      selectedItems = this.data.favoritesList.map(item => item.id);
    }
    
    this.setData({
      selectAll,
      selectedItems
    });
  },

  /**
   * 选择/取消选择单个商品
   */
  onSelectItem(e) {
    const id = e.currentTarget.dataset.id;
    let selectedItems = [...this.data.selectedItems];
    
    if (selectedItems.includes(id)) {
      // 取消选择
      selectedItems = selectedItems.filter(item => item !== id);
    } else {
      // 选择
      selectedItems.push(id);
    }
    
    this.setData({
      selectedItems,
      selectAll: selectedItems.length === this.data.favoritesList.length
    });
  },

  /**
   * 批量加入购物车
   */
  onBatchAddToCart() {
    if (this.data.selectedItems.length === 0) {
      wx.showToast({
        title: '请先选择商品',
        icon: 'none'
      });
      return;
    }
    
    // 获取底部批量添加按钮位置，作为动画起点
    const query = wx.createSelectorQuery();
    query.select('.btn-batch-add').boundingClientRect();
    query.exec((res) => {
      if (res[0]) {
        const buttonRect = res[0];
        const buttonCenter = {
          x: buttonRect.left + buttonRect.width / 2,
          y: buttonRect.top + buttonRect.height / 2
        };
        
        // 设置动画起点
        this.setData({
          cartAnimationStart: buttonCenter,
          showCartAnimation: true
        });
      }
    });
    
    // 批量添加到购物车
    let successCount = 0;
    
    this.data.selectedItems.forEach(id => {
      const item = this.data.favoritesList.find(item => item.id === id);
      if (item) {
        const product = {
          id: item.productId,
          name: item.name,
          price: item.price,
          image: item.image || '/images/default_product.webp',
          spec: item.spec,
          origin: item.origin
        };
        
        if (app.addToCart(product, 1)) {
          successCount++;
        }
      }
    });
    
    if (successCount > 0) {
      wx.showToast({
        title: `已加入${successCount}件商品`,
        icon: 'success'
      });
      
      // 设置需要刷新购物车标志
      app.globalData.needRefreshCart = true;
    } else {
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      });
    }
  },

  /**
   * 触摸开始事件
   */
  touchStart(e) {
    this.setData({
      touchStartX: e.touches[0].clientX
    });
  },

  /**
   * 触摸结束事件
   */
  touchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = this.data.touchStartX - touchEndX;
    const id = e.currentTarget.dataset.id;
    
    // 左滑显示删除按钮（滑动距离大于50）
    if (diff > 50) {
      const favoritesList = this.data.favoritesList.map(item => {
        if (item.id === id) {
          return { ...item, showDelete: true };
        } else {
          return { ...item, showDelete: false };
        }
      });
      
      this.setData({
        favoritesList
      });
    } else if (diff < -50) {
      // 右滑隐藏删除按钮
      const favoritesList = this.data.favoritesList.map(item => {
        return { ...item, showDelete: false };
      });
      
      this.setData({
        favoritesList
      });
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.setData({
      page: 1,
      favoritesList: [],
      hasMore: true,
      selectedItems: [],
      selectAll: false
    });
    this.loadFavorites();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    this.loadFavorites();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的收藏 - 楚农电商',
      path: '/pages/favorites/favorites'
    };
  }
})