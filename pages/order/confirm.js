const { request } = require('../../utils/request');
const { showError, showLoading, hideLoading } = require('../../utils/util');
const config = require('../../utils/config');

Page({
  data: {
    address: null,
    addressList: [],
    products: [],
    remark: '',
    paymentMethod: 'wxpay',
    totalAmount: 0,
    freightAmount: 0,
    discountAmount: 0,
    actualAmount: 0,
    loading: false
  },

  onLoad(options) {
    if (options.items) {
      const items = JSON.parse(options.items);
      this.setData({ products: items });
    }
    this.loadAddressList();
    this.calculateAmount();
  },

  // 加载地址列表
  async loadAddressList() {
    try {
      showLoading('加载中...');
      const res = await request({
        url: '/api/address',
        method: 'GET'
      });

      const addressList = res.data;
      // 设置默认地址
      const defaultAddress = addressList.find(item => item.isDefault);
      if (defaultAddress) {
        this.setData({
          address: defaultAddress,
          addressList
        });
      } else if (addressList.length > 0) {
        this.setData({
          address: addressList[0],
          addressList
        });
      }
    } catch (error) {
      showError('加载地址列表失败');
    } finally {
      hideLoading();
    }
  },

  // 选择收货地址
  onSelectAddress() {
    wx.navigateTo({
      url: '/pages/address/select?from=order'
    });
  },

  // 计算金额
  calculateAmount() {
    const { products } = this.data;
    let totalAmount = 0;
    let freightAmount = 0;
    let discountAmount = 0;

    // 计算商品总额
    products.forEach(item => {
      totalAmount += item.price * item.quantity;
    });

    // 计算运费
    if (totalAmount < 100) {
      freightAmount = 10;
    }

    // 计算优惠金额
    if (totalAmount >= 200) {
      discountAmount = totalAmount * 0.1; // 满200减10%
    }

    // 计算实付金额
    const actualAmount = totalAmount + freightAmount - discountAmount;

    this.setData({
      totalAmount,
      freightAmount,
      discountAmount,
      actualAmount
    });
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 选择支付方式
  onPaymentMethodChange(e) {
    const { method } = e.currentTarget.dataset;
    this.setData({
      paymentMethod: method
    });
  },

  // 提交订单
  async onSubmitOrder() {
    if (!this.data.address) {
      showError('请选择收货地址');
      return;
    }

    try {
      this.setData({ loading: true });
      const res = await request({
        url: '/api/orders',
        method: 'POST',
        data: {
          addressId: this.data.address.id,
          products: this.data.products,
          remark: this.data.remark,
          paymentMethod: this.data.paymentMethod,
          totalAmount: this.data.totalAmount,
          freightAmount: this.data.freightAmount,
          discountAmount: this.data.discountAmount,
          actualAmount: this.data.actualAmount
        }
      });

      // 跳转到支付页面
      wx.navigateTo({
        url: `/pages/payment/payment?orderId=${res.data.id}`
      });
    } catch (error) {
      showError('提交订单失败');
    } finally {
      this.setData({ loading: false });
    }
  }
}); 