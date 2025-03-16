const { request } = require('../../utils/request');
const { showError, showLoading, hideLoading } = require('../../utils/util');
const config = require('../../utils/config');

Page({
  data: {
    orderId: '',
    orderInfo: null,
    paymentMethod: 'wxpay',
    countdown: 30 * 60, // 30分钟
    loading: false
  },

  onLoad(options) {
    if (options.orderId) {
      this.setData({ orderId: options.orderId });
      this.loadOrderInfo();
      this.startCountdown();
    }
  },

  onUnload() {
    this.stopCountdown();
  },

  // 加载订单信息
  async loadOrderInfo() {
    try {
      showLoading('加载中...');
      const res = await request({
        url: `/api/orders/${this.data.orderId}`,
        method: 'GET'
      });
      this.setData({
        orderInfo: res.data
      });
    } catch (error) {
      showError('加载订单信息失败');
    } finally {
      hideLoading();
    }
  },

  // 选择支付方式
  onPaymentMethodChange(e) {
    const { method } = e.currentTarget.dataset;
    this.setData({
      paymentMethod: method
    });
  },

  // 开始倒计时
  startCountdown() {
    const timer = setInterval(() => {
      if (this.data.countdown <= 1) {
        clearInterval(timer);
        this.setData({ countdown: 0 });
        this.onCancelPayment();
      } else {
        this.setData({ countdown: this.data.countdown - 1 });
      }
    }, 1000);
  },

  // 停止倒计时
  stopCountdown() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },

  // 格式化倒计时
  formatCountdown() {
    const minutes = Math.floor(this.data.countdown / 60);
    const seconds = this.data.countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },

  // 发起支付
  async onPay() {
    try {
      this.setData({ loading: true });
      const res = await request({
        url: `/api/orders/${this.data.orderId}/pay`,
        method: 'POST',
        data: {
          paymentMethod: this.data.paymentMethod
        }
      });

      // 调用支付
      if (this.data.paymentMethod === 'wxpay') {
        wx.requestPayment({
          ...res.data,
          success: () => {
            this.onPaySuccess();
          },
          fail: (error) => {
            console.error('支付失败:', error);
            showError('支付失败');
          }
        });
      } else if (this.data.paymentMethod === 'alipay') {
        // 跳转到支付宝支付页面
        wx.navigateToMiniProgram({
          appId: res.data.appId,
          path: res.data.path,
          success: () => {
            this.onPaySuccess();
          },
          fail: (error) => {
            console.error('跳转失败:', error);
            showError('支付失败');
          }
        });
      }
    } catch (error) {
      showError('发起支付失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 支付成功
  onPaySuccess() {
    wx.showToast({
      title: '支付成功',
      icon: 'success',
      duration: 2000,
      success: () => {
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/order/detail?id=${this.data.orderId}`
          });
        }, 2000);
      }
    });
  },

  // 取消支付
  onCancelPayment() {
    wx.showModal({
      title: '提示',
      content: '支付超时，订单已自动取消',
      showCancel: false,
      success: () => {
        wx.navigateBack();
      }
    });
  }
}); 