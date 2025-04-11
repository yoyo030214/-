const { request } = require('../../utils/request');
const { showError, showLoading, hideLoading } = require('../../utils/util');
const config = require('../../utils/config');

Page({
  data: {
    userInfo: null,
    hasLogin: false,
    orderCounts: {
      unPaid: 0,
      unDelivered: 0,
      delivered: 0,
      completed: 0
    },
    showSettings: false,
    coveredVillages: 256,
    pageTitle: '个人中心功能开发中',
    hasUserInfo: false,
    userLevel: 2,
    helpFarmers: 9,
    totalOrders: 42,
    totalPoints: 1580,
    savedCrops: 23,
    dataCards: [
      {title: '助农次数', value: 18},
      {title: '累计订单', value: 42},
      {title: '帮助农户', value: 9},
      {title: '节约粮食', value: 23}
    ],
    quickActions: [
      {icon: '/images/icons/order.png', text: '我的订单', count: 42, url: '/pages/order/list'},
      {icon: '/images/icons/address.png', text: '地址管理', count: 3, url: '/pages/address/list'},
      {icon: '/images/icons/coupon.png', text: '优惠券', count: 2, url: '/pages/coupon/list/list'},
      {icon: '/images/icons/service.png', text: '联系客服', type: 'service'}
    ],
    userLevelInfo: {
      level: 2,
      title: '助农达人',
      nextLevelPercent: 65,
      description: '优先购买权 + 专属客服'
    },
    statusTextFilter: (status) => {
      const map = {
        pending: '待付款',
        paid: '待发货',
        shipped: '待收货',
        completed: '已完成'
      };
      return map[status] || status;
    },
    inputText: '',
    scrollTop: 0,
    isElderMode: false,
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadUserData();
  },

  onShow() {
    // 检查是否有缓存的长辈模式状态
    const elderModeStatus = wx.getStorageSync('elderModeStatus');
    if (elderModeStatus !== undefined) {
      this.setData({
        isElderMode: elderModeStatus
      });
      // 读取后清除缓存
      wx.removeStorageSync('elderModeStatus');
    }
    
    this.loadOrderCounts();
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync(config.storage.userInfoKey);
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true,
        pageTitle: `${userInfo.nickName}的个人中心`
      });
    }
  },

  // 登录
  login() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        // 这里应该调用后端接口进行登录
        // 模拟登录成功
        wx.setStorageSync('userInfo', userInfo);
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        });
      },
      fail: (err) => {
        console.error('登录失败:', err);
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      }
    });
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync(config.storage.userInfoKey);
      if (userInfo) {
        this.setData({ userInfo });
      } else {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }
    } catch (error) {
      showError('获取用户信息失败');
    }
  },

  // 加载订单数量
  async loadOrderCounts() {
    wx.showLoading({ title: '加载中' });
    try {
      const res = await request({
        url: '/api/orders/counts',
        method: 'GET'
      });
      this.setData({ orderCounts: res.data });
    } catch (error) {
      console.error('获取订单数量失败:', error);
    } finally {
      wx.hideLoading();
    }
  },

  // 查看所有订单
  viewAllOrders() {
    wx.navigateTo({
      url: '/pages/order/list'
    });
  },

  // 查看特定类型订单
  viewOrders(e) {
    const validTypes = ['pending', 'paid', 'shipped', 'completed'];
    const type = e.currentTarget.dataset.type;
    
    if (!validTypes.includes(type)) {
      return showError('无效的订单类型');
    }
    
    wx.navigateTo({
      url: `/pages/order/list?type=${type}`
    });
  },

  // 页面导航
  navigateTo(e) {
    const { url, type } = e.currentTarget.dataset;
    if (url) {
      wx.navigateTo({ url });
    } else if (type === 'service') {
      this.contactService();
    } else {
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    }
  },

  // 显示设置
  showSettings() {
    wx.showActionSheet({
      itemList: ['清除缓存', '退出登录'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.clearCache();
            break;
          case 1:
            this.logout();
            break;
        }
      }
    });
  },

  // 清除缓存
  clearCache() {
    wx.showLoading({
      title: '清理中...',
    });
    
    // 模拟清理过程
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '清理完成',
        icon: 'success'
      });
    }, 1500);
  },

  // 跳转到地址管理
  navigateToAddress() {
    wx.navigateTo({
      url: '/pages/address/list'
    });
  },

  // 跳转到收藏
  navigateToFavorites() {
    wx.navigateTo({
      url: '/pages/favorites/list'
    });
  },

  // 跳转到客服
  contactService() {
    this.navigateToCustomerService();
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          showLoading('退出中...');
          // 清除所有相关缓存
          wx.clearStorageSync();
          this.setData({
            userInfo: {
              avatarUrl: '/images/default-avatar.png',
              nickName: '助农先锋'
            },
            hasUserInfo: false,
            orderCounts: { /* 重置订单数据 */ }
          });
          hideLoading();
          wx.reLaunch({ url: '/pages/index/index' }); // 跳转到首页
        }
      }
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '楚农电商',
      path: '/pages/index/index'
    };
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadUserData()
    wx.stopPullDownRefresh()
  },

  // 加载数据方法
  loadUserData() {
    // 这里应替换为您的实际数据请求
    wx.cloud.callFunction({
      name: 'getUserData',
      success: res => {
        this.setData(res.result)
      }
    })
  },

  handleQuickAction(e) {
    const index = e.currentTarget.dataset.index;
    const action = this.data.quickActions[index];
    
    if (action.url) {
      wx.navigateTo({ url: action.url });
    } else if (action.type === 'service') {
      this.contactService();
    }
  },

  navigateToCustomerService() {
    console.log('准备跳转到客服页面...');
    
    try {
      wx.navigateTo({
        url: '/pages/customer-service/customer-service',
        success: (res) => {
          console.log('跳转客服页面成功');
        },
        fail: (err) => {
          console.error('跳转客服页面失败:', err);
          // 尝试使用redirectTo
          try {
            wx.redirectTo({
              url: '/pages/customer-service/customer-service',
              fail: (err2) => {
                console.error('重定向到客服页面也失败:', err2);
                wx.showToast({
                  title: '客服页面打开失败',
                  icon: 'none'
                });
              }
            });
          } catch (e) {
            console.error('重定向异常:', e);
          }
        }
      });
    } catch (error) {
      console.error('跳转异常:', error);
      wx.showToast({
        title: '操作失败，请稍后重试',
        icon: 'none'
      });
    }
  },

  checkPageExists(pagePath) {
    const pages = getCurrentPages();
    const exists = pages.some(page => page.route === pagePath);
    if (!exists) {
      wx.showModal({
        title: '提示',
        content: '客服页面不存在，请联系管理员',
        showCancel: false
      });
    }
  },

  // 切换长辈模式
  toggleElderMode(e) {
    const isElderMode = e.detail.value;
    this.setData({ isElderMode });

    if (isElderMode) {
      console.log('正在打开长辈模式...');
      wx.showLoading({
        title: '加载中...',
      });

      // 直接使用switchTab而不是navigateTo
      setTimeout(() => {
        wx.hideLoading();
        // 使用reLaunch确保能够跳转
        wx.reLaunch({
          url: '/pages/elder-mode/elder-mode',
          success: () => {
            console.log('长辈模式页面跳转成功');
            wx.showToast({
              title: '已开启长辈模式',
              icon: 'success'
            });
          },
          fail: (err) => {
            console.error('跳转失败:', err);
            wx.showToast({
              title: '跳转失败，请重试',
              icon: 'none'
            });
          }
        });
      }, 500);
    } else {
      wx.showToast({
        title: '已关闭长辈模式',
        icon: 'success'
      });
    }
  },
}); 