const weatherService = require('../../services/weather');

Page({
  data: {
    loading: false,         // 加载状态
    networkError: false,    // 网络错误状态
    isOffline: false,      // 离线状态
    city: '武汉市',        // 默认城市
    cityCode: '',          // 城市代码
    showCityPicker: false, // 城市选择器显示状态
    updateTime: '',        // 更新时间
    temperature: '',       // 当前温度
    weatherDesc: '',       // 天气描述
    humidity: '',         // 湿度
    windLevel: '',        // 风力
    pressure: '',         // 气压
    visibility: '',       // 能见度
    hourlyForecast: [],   // 24小时预报
    forecast: [],         // 7天预报
    lifeIndices: [],      // 生活指数
    farmingTips: '',      // 农事建议
    lastUpdateTime: 0     // 最后更新时间戳
  },

  onLoad: async function() {
    console.log('页面加载开始');
    try {
      // 检查API是否可用
      const isApiAvailable = await weatherService.checkWeatherAPI();
      console.log('API可用性检查结果:', isApiAvailable);

      if (isApiAvailable) {
        await this.loadLastCity();
      } else {
        console.error('天气API不可用');
        this.handleNetworkError();
      }
    } catch (error) {
      console.error('页面初始化失败:', error);
      this.handleNetworkError();
    }
  },

  // 加载上次选择的城市
  loadLastCity() {
    const lastCity = wx.getStorageSync('lastCity') || '武汉市';
    this.setData({ city: lastCity });
    this.searchCity(lastCity);
  },

  // 显示城市选择器
  showCityPicker() {
    this.setData({ showCityPicker: true });
  },

  // 隐藏城市选择器
  hideCityPicker() {
    this.setData({ showCityPicker: false });
  },

  // 处理城市选择
  async handleCitySelect(e) {
    const { city } = e.detail;
    this.setData({ 
      city,
      loading: true,
      networkError: false,
      isOffline: false
    });
    wx.setStorageSync('lastCity', city);
    await this.searchCity(city);
  },

  // 搜索城市获取城市代码
  async searchCity(keyword) {
    try {
      this.setData({ loading: true });
      const res = await weatherService.searchCity(keyword);
      console.log('城市搜索结果:', res); // 添加日志
      if (res.location && res.location[0]) {
        const cityCode = res.location[0].id;
        wx.setStorageSync(`cityCode_${keyword}`, cityCode);
        this.setData({ cityCode });
        await this.loadWeatherData(cityCode);
      } else {
        console.error('未找到城市信息');
        this.handleNetworkError();
      }
    } catch (error) {
      console.error('搜索城市失败:', error);
      const cachedCityCode = wx.getStorageSync(`cityCode_${keyword}`);
      if (cachedCityCode) {
        this.setData({ cityCode: cachedCityCode });
        await this.loadWeatherData(cachedCityCode);
      } else {
        this.handleNetworkError();
      }
    }
  },

  // 处理网络错误
  handleNetworkError() {
    this.setData({ networkError: true });
    wx.showToast({
      title: '网络连接失败，已切换到离线模式',
      icon: 'none',
      duration: 2000
    });
    this.loadOfflineData(this.data.city);
  },

  // 检查数据是否需要更新
  checkNeedUpdate() {
    const now = new Date().getTime();
    const updateInterval = 30 * 60 * 1000; // 30分钟更新一次
    return (now - this.data.lastUpdateTime) > updateInterval;
  },

  // 加载天气数据
  async loadWeatherData(cityCode) {
    // 检查是否需要更新
    if (!this.checkNeedUpdate() && !this.data.isOffline) {
      console.log('数据仍在有效期内，无需更新');
      return;
    }

    this.setData({ loading: true, networkError: false });
    
    try {
      console.log('开始加载天气数据, cityCode:', cityCode);
      const [nowRes, forecastRes, hourlyRes, indicesRes, agroRes] = await Promise.all([
        weatherService.getNowWeather(cityCode),
        weatherService.getWeatherForecast(cityCode),
        weatherService.getHourlyForecast(cityCode),
        weatherService.getLifeIndices(cityCode),
        weatherService.getAgroMeteo(cityCode)
      ]);

      // 处理实时天气数据
      const weatherData = {
        temperature: nowRes.now.temp,
        weatherDesc: nowRes.now.text,
        humidity: nowRes.now.humidity,
        windLevel: nowRes.now.windScale,
        pressure: nowRes.now.pressure,
        visibility: nowRes.now.vis,
        updateTime: this.formatTime(new Date()),
        lastUpdateTime: new Date().getTime(),
        isOffline: false
      };

      // 处理24小时预报
      weatherData.hourlyForecast = hourlyRes.hourly.map(item => ({
        time: this.formatHour(item.fxTime),
        temp: item.temp,
        text: item.text
      }));

      // 处理7天预报
      weatherData.forecast = forecastRes.daily.map(item => ({
        date: this.formatDate(item.fxDate),
        maxTemp: item.tempMax,
        minTemp: item.tempMin,
        textDay: item.textDay
      }));

      // 处理生活指数
      weatherData.lifeIndices = indicesRes.daily.map(item => ({
        name: item.name,
        value: item.category
      }));

      // 处理农业气象
      weatherData.farmingTips = agroRes.tips;

      // 保存数据到缓存
      wx.setStorageSync(`weatherData_${this.data.city}`, weatherData);
      
      // 更新页面数据
      this.setData({
        ...weatherData,
        loading: false
      });

      wx.showToast({
        title: '天气已更新',
        icon: 'success',
        duration: 1500
      });

    } catch (error) {
      console.error('加载天气数据失败:', error);
      this.handleNetworkError();
    }
  },

  // 加载离线数据
  loadOfflineData(cityName) {
    const cachedData = wx.getStorageSync(`weatherData_${cityName}`);
    if (cachedData) {
      const now = new Date().getTime();
      const cacheAge = now - (cachedData.lastUpdateTime || 0);
      const maxCacheAge = 2 * 60 * 60 * 1000; // 2小时缓存过期
      
      if (cacheAge > maxCacheAge) {
        wx.showToast({
          title: '当前为离线数据，可能已过期',
          icon: 'none',
          duration: 2000
        });
      }

      this.setData({
        ...cachedData,
        isOffline: true,
        loading: false
      });
    } else {
      const defaultData = {
        temperature: '--',
        weatherDesc: '暂无数据',
        humidity: '--',
        windLevel: '--',
        pressure: '--',
        visibility: '--',
        updateTime: '暂无更新',
        hourlyForecast: Array(5).fill({
          time: '--:--',
          temp: '--',
          text: '暂无'
        }),
        forecast: Array(5).fill({
          date: '暂无',
          maxTemp: '--',
          minTemp: '--',
          textDay: '暂无'
        }),
        lifeIndices: Array(4).fill({
          name: '暂无',
          value: '--'
        }),
        farmingTips: '暂无农事建议',
        isOffline: true,
        lastUpdateTime: 0
      };
      this.setData({
        ...defaultData,
        loading: false
      });
    }
  },

  // 刷新天气数据
  refreshWeather() {
    if (this.data.loading) return;
    if (this.data.cityCode) {
      this.loadWeatherData(this.data.cityCode);
    } else {
      this.searchCity(this.data.city);
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.refreshWeather();
    wx.stopPullDownRefresh();
  },

  // 格式化时间
  formatTime(date) {
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${hour}:${minute}`;
  },

  // 格式化小时
  formatHour(timeString) {
    const date = new Date(timeString);
    return `${date.getHours().toString().padStart(2, '0')}:00`;
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天';
    } else {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekdays[date.getDay()];
    }
  }
}); 