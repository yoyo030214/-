Page({
  data: {
    isElderMode: true,
    weather: {
      today: '晴 28°C',
      forecast: '未来三天晴好',
      agricultural: '适合播种'
    },
    policies: {
      agricultural: '最新农业补贴政策',
      subsidy: '农机购置补贴',
      tech: '水稻种植技术推广',
      market: '本周稻米价格上涨'
    }
  },

  onLoad(options) {
    console.log('长辈模式页面已加载');
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '长辈模式'
    });
    this.loadUserData();
  },

  onShow() {
    console.log('长辈模式页面显示');
    wx.setNavigationBarTitle({
      title: '长辈模式'
    });
  },

  // 加载用户数据
  loadUserData() {
    // 这里可以加载用户数据
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo
      });
    }
  },

  // 查看天气
  viewWeather() {
    wx.showModal({
      title: '今日天气',
      content: this.data.weather.today,
      showCancel: false
    });
  },

  // 查看天气预报
  viewWeatherForecast() {
    wx.showModal({
      title: '天气预报',
      content: this.data.weather.forecast,
      showCancel: false
    });
  },

  // 查看农业天气
  viewAgriWeather() {
    wx.showModal({
      title: '农业天气',
      content: this.data.weather.agricultural,
      showCancel: false
    });
  },

  // 查看政策
  viewPolicy(e) {
    const type = e.currentTarget.dataset.type;
    const policyMap = {
      agri: '农业政策',
      subsidy: '补贴政策',
      tech: '技术推广',
      market: '市场行情'
    };
    
    wx.showModal({
      title: policyMap[type] || '政策信息',
      content: this.data.policies[type] || '暂无相关政策信息',
      showCancel: false
    });
  },

  // 页面跳转
  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({ url });
    }
  },

  // 联系客服
  contactService() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail(err) {
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none'
        });
      }
    });
  },

  // 关闭长辈模式
  closeElderMode() {
    console.log('关闭长辈模式');
    
    // 重新加载首页并设置用户页面的isElderMode为false
    wx.reLaunch({
      url: '/pages/index/index',
      success: () => {
        console.log('返回首页成功');
        // 这里不能直接设置user页面的数据，需要通过缓存方式
        wx.setStorageSync('elderModeStatus', false);
        wx.showToast({
          title: '已关闭长辈模式',
          icon: 'success'
        });
      }
    });
  }
}); 