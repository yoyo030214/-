const app = getApp();
const { request } = require('../../utils/request');
const { showLoading, hideLoading, showError } = require('../../utils/util');

Page({
  data: {
    orderItems: [],
    address: null,
    addressList: [],
    showAddressList: false,
    remark: '',
    totalPrice: 0,
    freight: 0,
    actualPrice: 0,
    loading: true,
    submitting: false
  },

  onLoad() {
    this.loadOrderData();
    this.loadAddressList();
  },

  // 加载订单数据
  async loadOrderData() {
    try {
      showLoading('加载中...');
      const res = await request({
        url: '/api/order/confirm'
      });

      if (res.success) {
        const { items, freight } = res.data;
        const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        this.setData({
          orderItems: items,
          freight,
          totalPrice,
          actualPrice: totalPrice + freight,
          loading: false
        });
      } else {
        showError(res.message || '加载失败');
        this.setData({ loading: false });
      }
    } catch (error) {
      showError('网络错误');
      this.setData({ loading: false });
    } finally {
      hideLoading();
    }
  },

  // 加载地址列表
  async loadAddressList() {
    try {
      const res = await request({
        url: '/api/address/list'
      });

      if (res.success) {
        const addressList = res.data;
        const defaultAddress = addressList.find(addr => addr.isDefault);
        
        this.setData({
          addressList,
          address: defaultAddress || null
        });
      }
    } catch (error) {
      console.error('加载地址列表失败:', error);
    }
  },

  // 显示地址列表
  showAddressList() {
    this.setData({ showAddressList: true });
  },

  // 隐藏地址列表
  hideAddressList() {
    this.setData({ showAddressList: false });
  },

  // 选择地址
  selectAddress(e) {
    const { address } = e.currentTarget.dataset;
    this.setData({
      address,
      showAddressList: false
    });
  },

  // 添加新地址
  addAddress() {
    wx.navigateTo({
      url: '/pages/address/edit'
    });
  },

  // 编辑地址
  editAddress() {
    if (!this.data.address) return;
    wx.navigateTo({
      url: `/pages/address/edit?id=${this.data.address.id}`
    });
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 提交订单
  async submitOrder() {
    const { address, orderItems, remark, actualPrice } = this.data;
    
    if (!address) {
      wx.showToast({
        title: '请选择收货地址',
        icon: 'none'
      });
      return;
    }

    try {
      this.setData({ submitting: true });
      showLoading('提交中...');

      const res = await request({
        url: '/api/order/create',
        method: 'POST',
        data: {
          addressId: address.id,
          items: orderItems.map(item => ({
            productId: item.id,
            quantity: item.quantity
          })),
          remark,
          totalAmount: actualPrice
        }
      });

      if (res.success) {
        const { orderId } = res.data;
        // 跳转到支付页面
        wx.navigateTo({
          url: `/pages/order/payment?orderId=${orderId}`
        });
      } else {
        showError(res.message || '提交失败');
      }
    } catch (error) {
      showError('网络错误');
    } finally {
      hideLoading();
      this.setData({ submitting: false });
    }
  }
}); 