const { request } = require('../../utils/request');
const { showError, showLoading, hideLoading } = require('../../utils/util');
const config = require('../../utils/config');

Page({
  data: {
    status: 'all',
    statusList: [
      { value: 'all', label: '全部' },
      { value: 'pending', label: '待付款' },
      { value: 'paid', label: '待发货' },
      { value: 'shipped', label: '待收货' },
      { value: 'completed', label: '已完成' }
    ],
    orderList: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad(options) {
    if (options.status) {
      this.setData({ status: options.status });
    }
    this.loadOrderList();
  },

  onPullDownRefresh() {
    this.setData({
      orderList: [],
      page: 1,
      hasMore: true
    });
    this.loadOrderList().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadOrderList();
    }
  },

  // 切换订单状态
  onStatusChange(e) {
    const { status } = e.currentTarget.dataset;
    if (status === this.data.status) return;

    this.setData({
      status,
      orderList: [],
      page: 1,
      hasMore: true
    });
    this.loadOrderList();
  },

  // 加载订单列表
  async loadOrderList() {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });
      const res = await request({
        url: '/api/orders',
        method: 'GET',
        data: {
          status: this.data.status,
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      });

      const { list, total } = res.data;
      const hasMore = this.data.orderList.length + list.length < total;

      this.setData({
        orderList: [...this.data.orderList, ...list],
        page: this.data.page + 1,
        hasMore,
        loading: false
      });
    } catch (error) {
      showError('加载订单列表失败');
      this.setData({ loading: false });
    }
  },

  // 取消订单
  async onCancelOrder(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '提示',
      content: '确定要取消这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            showLoading('取消中...');
            await request({
              url: `/api/orders/${id}/cancel`,
              method: 'POST'
            });

            // 更新订单状态
            const orderList = this.data.orderList.map(order => {
              if (order.id === id) {
                return { ...order, status: 'cancelled' };
              }
              return order;
            });

            this.setData({ orderList });
          } catch (error) {
            showError('取消订单失败');
          } finally {
            hideLoading();
          }
        }
      }
    });
  },

  // 确认收货
  async onConfirmReceive(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '提示',
      content: '确认已收到商品？',
      success: async (res) => {
        if (res.confirm) {
          try {
            showLoading('确认中...');
            await request({
              url: `/api/orders/${id}/confirm`,
              method: 'POST'
            });

            // 更新订单状态
            const orderList = this.data.orderList.map(order => {
              if (order.id === id) {
                return { ...order, status: 'completed' };
              }
              return order;
            });

            this.setData({ orderList });
          } catch (error) {
            showError('确认收货失败');
          } finally {
            hideLoading();
          }
        }
      }
    });
  },

  // 去支付
  onPay(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/payment/payment?orderId=${id}`
    });
  },

  // 查看订单详情
  onViewDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/order/detail?id=${id}`
    });
  },

  // 删除订单
  async onDeleteOrder(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '提示',
      content: '确定要删除这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            showLoading('删除中...');
            await request({
              url: `/api/orders/${id}`,
              method: 'DELETE'
            });

            // 从列表中移除
            const orderList = this.data.orderList.filter(order => order.id !== id);
            this.setData({ orderList });
          } catch (error) {
            showError('删除订单失败');
          } finally {
            hideLoading();
          }
        }
      }
    });
  }
}); 