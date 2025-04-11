const app = getApp();
const { request } = require('../../utils/request');
const { showLoading, hideLoading, showError } = require('../../utils/util');

Page({
  data: {
    tabs: ['全部', '待付款', '待发货', '待收货', '已完成', '已取消'],
    currentTab: 0,
    orderList: [],
    loading: true,
    page: 1,
    hasMore: true,
    refreshing: false
  },

  onLoad() {
    this.loadOrders();
  },

  // 切换标签
  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    if (index === this.data.currentTab) return;
    
    this.setData({
      currentTab: index,
      orderList: [],
      page: 1,
      hasMore: true
    }, () => {
      this.loadOrders();
    });
  },

  // 加载订单列表
  async loadOrders(refresh = false) {
    if (this.data.loading || (!refresh && !this.data.hasMore)) return;

    try {
      if (!refresh) {
        this.setData({ loading: true });
        showLoading('加载中...');
      }

      const res = await request({
        url: '/api/order/list',
        data: {
          status: this.getStatusByTab(this.data.currentTab),
          page: this.data.page,
          limit: 10
        }
      });

      if (res.success) {
        const { orders, total } = res.data;
        const hasMore = orders.length === 10;
        
        this.setData({
          orderList: refresh ? orders : [...this.data.orderList, ...orders],
          page: this.data.page + 1,
          hasMore,
          loading: false,
          refreshing: false
        });
      } else {
        showError(res.message || '加载失败');
        this.setData({ 
          loading: false,
          refreshing: false
        });
      }
    } catch (error) {
      showError('网络错误');
      this.setData({ 
        loading: false,
        refreshing: false
      });
    } finally {
      if (!refresh) {
        hideLoading();
      }
    }
  },

  // 根据标签获取状态
  getStatusByTab(tab) {
    const statusMap = {
      0: 'all',
      1: 'unpaid',
      2: 'unshipped',
      3: 'shipped',
      4: 'completed',
      5: 'cancelled'
    };
    return statusMap[tab];
  },

  // 下拉刷新
  async onPullDownRefresh() {
    this.setData({
      refreshing: true,
      page: 1,
      hasMore: true
    });
    await this.loadOrders(true);
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore) {
      this.loadOrders();
    }
  },

  // 取消订单
  async cancelOrder(e) {
    const { orderId } = e.currentTarget.dataset;
    
    try {
      const res = await wx.showModal({
        title: '提示',
        content: '确定要取消该订单吗？',
        confirmText: '确定',
        cancelText: '取消'
      });

      if (res.confirm) {
        showLoading('取消中...');
        const res = await request({
          url: '/api/order/cancel',
          method: 'POST',
          data: { orderId }
        });

        if (res.success) {
          wx.showToast({
            title: '取消成功',
            icon: 'success'
          });
          // 刷新订单列表
          this.setData({
            orderList: [],
            page: 1,
            hasMore: true
          });
          this.loadOrders();
        } else {
          showError(res.message || '取消失败');
        }
      }
    } catch (error) {
      showError('网络错误');
    } finally {
      hideLoading();
    }
  },

  // 确认收货
  async confirmReceive(e) {
    const { orderId } = e.currentTarget.dataset;
    
    try {
      const res = await wx.showModal({
        title: '提示',
        content: '确认已收到商品？',
        confirmText: '确定',
        cancelText: '取消'
      });

      if (res.confirm) {
        showLoading('确认中...');
        const res = await request({
          url: '/api/order/confirm-receive',
          method: 'POST',
          data: { orderId }
        });

        if (res.success) {
          wx.showToast({
            title: '确认成功',
            icon: 'success'
          });
          // 刷新订单列表
          this.setData({
            orderList: [],
            page: 1,
            hasMore: true
          });
          this.loadOrders();
        } else {
          showError(res.message || '确认失败');
        }
      }
    } catch (error) {
      showError('网络错误');
    } finally {
      hideLoading();
    }
  },

  // 查看物流
  viewLogistics(e) {
    const { orderId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/order/logistics?orderId=${orderId}`
    });
  },

  // 查看订单详情
  viewOrderDetail(e) {
    const { orderId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/order/detail?orderId=${orderId}`
    });
  }
}); 