const { request } = require('../../utils/request');
const { showError, showLoading, hideLoading } = require('../../utils/util');
const config = require('../../utils/config');

Page({
  data: {
    loading: false,
    phone: '',
    code: '',
    countdown: 0
  },

  // 获取手机号
  async getPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      showError('获取手机号失败');
      return;
    }

    try {
      showLoading('登录中...');
      const res = await request({
        url: '/api/user/login/phone',
        method: 'POST',
        data: {
          code: e.detail.code
        }
      });

      // 保存token和用户信息
      wx.setStorageSync(config.storage.tokenKey, res.data.token);
      wx.setStorageSync(config.storage.userInfoKey, res.data.userInfo);

      // 返回上一页
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
      } else {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    } catch (error) {
      showError('登录失败');
    } finally {
      hideLoading();
    }
  },

  // 输入手机号
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 输入验证码
  onCodeInput(e) {
    this.setData({
      code: e.detail.value
    });
  },

  // 发送验证码
  async sendCode() {
    const { phone } = this.data;
    if (!phone) {
      showError('请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showError('请输入正确的手机号');
      return;
    }

    try {
      showLoading('发送中...');
      await request({
        url: '/api/user/sms/send',
        method: 'POST',
        data: { phone }
      });

      showError('验证码已发送');
      this.startCountdown();
    } catch (error) {
      showError('发送失败');
    } finally {
      hideLoading();
    }
  },

  // 开始倒计时
  startCountdown() {
    this.setData({ countdown: 60 });
    const timer = setInterval(() => {
      if (this.data.countdown <= 1) {
        clearInterval(timer);
        this.setData({ countdown: 0 });
      } else {
        this.setData({ countdown: this.data.countdown - 1 });
      }
    }, 1000);
  },

  // 手机号登录
  async phoneLogin() {
    const { phone, code } = this.data;
    if (!phone || !code) {
      showError('请输入手机号和验证码');
      return;
    }

    try {
      showLoading('登录中...');
      const res = await request({
        url: '/api/user/login/phone',
        method: 'POST',
        data: { phone, code }
      });

      // 保存token和用户信息
      wx.setStorageSync(config.storage.tokenKey, res.data.token);
      wx.setStorageSync(config.storage.userInfoKey, res.data.userInfo);

      // 返回上一页
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
      } else {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    } catch (error) {
      showError('登录失败');
    } finally {
      hideLoading();
    }
  }
}); 