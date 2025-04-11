const app = getApp();
const { request } = require('../../utils/request');
const { showLoading, hideLoading, showError } = require('../../utils/util');

// 缓存键名
const CART_CACHE_KEY = 'cart_data_cache';
const CART_CACHE_EXPIRE = 5 * 60 * 1000; // 5分钟缓存

Page({
  data: {
    cartItems: [],
    loading: true,
    totalPrice: 0,
    selectedAll: false,
    showEmpty: false,
    showDeleteConfirm: false,
    deleteItemId: null,
    refreshing: false
  },

  onLoad() {
    this.loadCartItems();
  },

  onShow() {
    // 每次显示页面时刷新购物车数据
    this.loadCartItems();
  },

  // 加载购物车数据
  async loadCartItems(useCache = true) {
    try {
      this.setData({ loading: true });
      
      // 尝试从缓存获取数据
      if (useCache) {
        const cacheData = this.getCartCache();
        if (cacheData) {
          this.setData({
            cartItems: cacheData.items,
            loading: false,
            showEmpty: cacheData.items.length === 0,
            selectedAll: cacheData.items.length > 0 && cacheData.items.every(item => item.selected)
          });
          this.calculateTotal();
          return;
        }
      }

      // 从服务器获取数据
      const res = await request({
        url: '/api/cart'
      });

      if (res.success) {
        const cartItems = res.data.items.map(item => ({
          ...item,
          // 处理产品图片
          images: Array.isArray(item.images) ? item.images : [item.images],
          // 处理季节性标签
          seasonalTags: this.getSeasonalTags(item)
        }));

        this.setData({
          cartItems,
          loading: false,
          showEmpty: cartItems.length === 0,
          selectedAll: cartItems.length > 0 && cartItems.every(item => item.selected)
        });

        this.calculateTotal();
        
        // 更新缓存
        this.updateCartCache(cartItems);
      } else {
        showError(res.message || '加载失败');
        this.setData({ loading: false });
      }
    } catch (error) {
      showError('网络错误');
      this.setData({ loading: false });
    }
  },

  // 获取购物车缓存
  getCartCache() {
    try {
      const cache = wx.getStorageSync(CART_CACHE_KEY);
      if (cache) {
        const { data, timestamp } = cache;
        if (Date.now() - timestamp < CART_CACHE_EXPIRE) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('获取购物车缓存失败:', error);
      return null;
    }
  },

  // 更新购物车缓存
  updateCartCache(cartItems) {
    try {
      wx.setStorageSync(CART_CACHE_KEY, {
        data: { items: cartItems },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('更新购物车缓存失败:', error);
    }
  },

  // 清除购物车缓存
  clearCartCache() {
    try {
      wx.removeStorageSync(CART_CACHE_KEY);
    } catch (error) {
      console.error('清除购物车缓存失败:', error);
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

  // 选择商品
  async selectItem(e) {
    const { id } = e.currentTarget.dataset;
    const { cartItems } = this.data;
    
    try {
      showLoading('更新中...');
      
      const res = await request({
        url: '/api/cart/select',
        method: 'POST',
        data: { productId: id }
      });

      if (res.success) {
        const updatedItems = cartItems.map(item => 
          item.id === id ? { ...item, selected: !item.selected } : item
        );

        this.setData({
          cartItems: updatedItems,
          selectedAll: updatedItems.every(item => item.selected)
        });

        this.calculateTotal();
        
        // 更新缓存
        this.updateCartCache(updatedItems);
      } else {
        showError(res.message || '更新失败');
      }
    } catch (error) {
      showError('网络错误');
    } finally {
      hideLoading();
    }
  },

  // 全选/取消全选
  async selectAll() {
    const { cartItems, selectedAll } = this.data;
    
    try {
      showLoading('更新中...');
      
      const res = await request({
        url: '/api/cart/select-all',
        method: 'POST',
        data: { selected: !selectedAll }
      });

      if (res.success) {
        const updatedItems = cartItems.map(item => ({
          ...item,
          selected: !selectedAll
        }));

        this.setData({
          cartItems: updatedItems,
          selectedAll: !selectedAll
        });

        this.calculateTotal();
        
        // 更新缓存
        this.updateCartCache(updatedItems);
      } else {
        showError(res.message || '更新失败');
      }
    } catch (error) {
      showError('网络错误');
    } finally {
      hideLoading();
    }
  },

  // 调整数量
  async adjustQuantity(e) {
    const { id, type } = e.currentTarget.dataset;
    const { cartItems } = this.data;
    const item = cartItems.find(item => item.id === id);
    
    if (!item) return;

    let quantity = item.quantity;
    if (type === 'minus' && quantity > 1) {
      quantity--;
    } else if (type === 'plus' && quantity < item.stock) {
      quantity++;
    } else {
      return;
    }

    try {
      showLoading('更新中...');
      
      const res = await request({
        url: '/api/cart/update',
        method: 'POST',
        data: {
          productId: id,
          quantity
        }
      });

      if (res.success) {
        const updatedItems = cartItems.map(item => 
          item.id === id ? { ...item, quantity } : item
        );

        this.setData({ cartItems: updatedItems });
        this.calculateTotal();
        
        // 更新缓存
        this.updateCartCache(updatedItems);
      } else {
        showError(res.message || '更新失败');
      }
    } catch (error) {
      showError('网络错误');
    } finally {
      hideLoading();
    }
  },

  // 删除商品
  showDeleteConfirm(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({
      showDeleteConfirm: true,
      deleteItemId: id
    });
  },

  // 取消删除
  cancelDelete() {
    this.setData({
      showDeleteConfirm: false,
      deleteItemId: null
    });
  },

  // 确认删除
  async confirmDelete() {
    const { deleteItemId, cartItems } = this.data;
    
    try {
      showLoading('删除中...');
      
      const res = await request({
        url: '/api/cart/remove',
        method: 'POST',
        data: { productId: deleteItemId }
      });

      if (res.success) {
        const updatedItems = cartItems.filter(item => item.id !== deleteItemId);
        
        this.setData({
          cartItems: updatedItems,
          showDeleteConfirm: false,
          deleteItemId: null,
          showEmpty: updatedItems.length === 0,
          selectedAll: updatedItems.length > 0 && updatedItems.every(item => item.selected)
        });

        this.calculateTotal();
        
        // 更新缓存
        this.updateCartCache(updatedItems);
      } else {
        showError(res.message || '删除失败');
      }
    } catch (error) {
      showError('网络错误');
    } finally {
      hideLoading();
    }
  },

  // 计算总价
  calculateTotal() {
    const { cartItems } = this.data;
    const totalPrice = cartItems
      .filter(item => item.selected)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    this.setData({ totalPrice });
  },

  // 检查商品库存
  async checkStock() {
    const { cartItems } = this.data;
    try {
      const res = await request({
        url: '/api/cart/check-stock',
        method: 'POST',
        data: { items: cartItems.map(item => ({ id: item.id, quantity: item.quantity })) }
      });

      if (res.success) {
        const { outOfStock, updatedItems } = res.data;
        if (outOfStock.length > 0) {
          wx.showModal({
            title: '库存不足',
            content: '部分商品库存不足,已自动调整数量',
            showCancel: false
          });
        }
        
        this.setData({ cartItems: updatedItems });
        this.calculateTotal();
        this.updateCartCache(updatedItems);
      }
    } catch (error) {
      console.error('检查库存失败:', error);
    }
  },

  // 结算前检查
  async checkout() {
    const { cartItems } = this.data;
    const selectedItems = cartItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      });
      return;
    }

    try {
      showLoading('检查中...');
      await this.checkStock();
      
      // 跳转到订单确认页
      wx.navigateTo({
        url: '/pages/order/confirm'
      });
    } catch (error) {
      showError('检查失败');
    } finally {
      hideLoading();
    }
  },

  // 继续购物
  continueShopping() {
    wx.switchTab({
      url: '/pages/products/index'
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    if (this.data.refreshing) return;
    
    this.setData({ refreshing: true });
    await this.loadCartItems(false); // 不使用缓存
    this.setData({ refreshing: false });
    wx.stopPullDownRefresh();
  }
}); 