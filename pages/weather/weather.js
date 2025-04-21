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
    lastUpdateTime: 0,    // 最后更新时间戳
    weatherIcon: '100'    // 天气图标
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
    } finally {
      this.setData({ loading: false });
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
    console.log('选择城市:', city);
    
    // 如果选择的是当前城市，直接关闭选择器
    if (city === this.data.city) {
      this.hideCityPicker();
      return;
    }
    
    this.setData({ 
      city,
      loading: true,
      networkError: false,
      isOffline: false
    });
    
    wx.setStorageSync('lastCity', city);
    
    try {
      // 清除当前城市的缓存数据，强制重新加载
      wx.removeStorageSync(`weatherData_${city}`);
      wx.removeStorageSync(`weatherDataTime_${city}`);
      
      // 清除天气服务缓存
      weatherService.clearCache();
      
      // 强制设置最后更新时间为0，确保立即更新
      this.setData({ lastUpdateTime: 0 });
      
      await this.searchCity(city);
    } catch (error) {
      console.error('切换城市失败:', error);
      this.handleNetworkError();
    } finally {
      this.setData({ loading: false });
    }
  },

  // 搜索城市获取城市代码
  async searchCity(keyword) {
    try {
      this.setData({ loading: true });
      
      // 先尝试从缓存获取城市代码
      const cachedCityCode = wx.getStorageSync(`cityCode_${keyword}`);
      if (cachedCityCode) {
        console.log('使用缓存的城市代码:', cachedCityCode);
        this.setData({ cityCode: cachedCityCode });
        await this.loadWeatherData(cachedCityCode);
        return;
      }

      console.log('搜索城市:', keyword);
      const res = await weatherService.searchCity(keyword);
      console.log('城市搜索结果:', res);
      
      if (res.location && res.location[0]) {
        const cityCode = res.location[0].id;
        console.log('获取到城市代码:', cityCode);
        wx.setStorageSync(`cityCode_${keyword}`, cityCode);
        this.setData({ cityCode });
        await this.loadWeatherData(cityCode);
      } else {
        console.error('未找到城市信息');
        this.handleNetworkError();
      }
    } catch (error) {
      console.error('搜索城市失败:', error);
      this.handleNetworkError();
      throw error; // 向上传递错误
    } finally {
      this.setData({ loading: false });
    }
  },

  // 检查是否需要更新天气数据
  checkNeedUpdate() {
    const now = Date.now();
    const lastUpdate = this.data.lastUpdateTime;
    const updateInterval = 2 * 1000; // 改为2秒更新一次
    
    // 如果没有最后更新时间，或者距离上次更新超过2秒，则需要更新
    return !lastUpdate || (now - lastUpdate > updateInterval);
  },

  // 加载天气数据
  async loadWeatherData(cityCode) {
    if (!cityCode) {
      console.error('城市代码为空，无法加载天气数据');
      this.handleNetworkError();
      return;
    }

    // 检查是否需要更新
    if (!this.checkNeedUpdate() && !this.data.isOffline) {
      console.log('数据仍在有效期内，无需更新');
      return;
    }

    this.setData({ loading: true, networkError: false });
    
    try {
      // 尝试从缓存获取天气数据
      const cachedData = wx.getStorageSync(`weatherData_${this.data.city}`);
      const cacheTime = wx.getStorageSync(`weatherDataTime_${this.data.city}`);
      const now = Date.now();
      
      // 如果缓存存在且未过期（2秒）
      if (cachedData && cacheTime && (now - cacheTime < 2 * 1000)) {
        console.log('使用缓存的天气数据');
        this.setData({
          ...cachedData,
          loading: false
        });
        return;
      }

      console.log('开始加载天气数据, cityCode:', cityCode);
      
      // 使用Promise.allSettled代替Promise.all，确保即使某个请求失败也能继续
      const results = await Promise.allSettled([
        weatherService.getNowWeather(cityCode),
        weatherService.getWeatherForecast(cityCode),
        weatherService.getHourlyForecast(cityCode),
        weatherService.getLifeIndices(cityCode),
        weatherService.getAgroMeteo(cityCode)
      ]);
      
      // 处理结果
      const nowRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const forecastRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const hourlyRes = results[2].status === 'fulfilled' ? results[2].value : null;
      const indicesRes = results[3].status === 'fulfilled' ? results[3].value : null;
      const agroRes = results[4].status === 'fulfilled' ? results[4].value : null;
      
      console.log('获取到天气数据:', {
        now: nowRes,
        forecast: forecastRes,
        hourly: hourlyRes,
        indices: indicesRes,
        agro: agroRes
      });

      // 处理实时天气数据
      const weatherData = {
        temperature: nowRes ? nowRes.now.temp : '--',
        weatherDesc: nowRes ? nowRes.now.text : '暂无数据',
        humidity: nowRes ? nowRes.now.humidity : '--',
        windLevel: nowRes ? nowRes.now.windScale : '--',
        pressure: nowRes ? nowRes.now.pressure : '--',
        visibility: nowRes ? nowRes.now.vis : '--',
        updateTime: this.formatTime(new Date()),
        lastUpdateTime: now,
        isOffline: false,
        weatherIcon: nowRes ? (nowRes.now.icon || '100') : '100'
      };

      // 处理24小时预报
      weatherData.hourlyForecast = hourlyRes && hourlyRes.hourly ? 
        hourlyRes.hourly.map(item => ({
          time: this.formatHour(item.fxTime),
          temp: item.temp,
          text: item.text,
          icon: item.icon
        })) : [];

      // 处理7天预报
      weatherData.forecast = forecastRes && forecastRes.daily ? 
        forecastRes.daily.map(item => ({
          date: this.formatDate(item.fxDate),
          maxTemp: item.tempMax,
          minTemp: item.tempMin,
          textDay: item.textDay,
          iconDay: item.iconDay
        })) : [];

      // 处理生活指数
      weatherData.lifeIndices = indicesRes && indicesRes.daily ? 
        indicesRes.daily.map(item => ({
          name: item.name,
          value: item.category,
          text: item.text
        })) : [];

      // 处理农业气象
      weatherData.farmingTips = agroRes ? agroRes.tips : '暂无农事建议';

      // 保存数据到缓存
      wx.setStorageSync(`weatherData_${this.data.city}`, weatherData);
      wx.setStorageSync(`weatherDataTime_${this.data.city}`, now);
      
      // 更新页面数据
      this.setData({
        ...weatherData,
        loading: false
      });
      
      console.log('天气数据更新完成');
    } catch (error) {
      console.error('加载天气数据失败:', error);
      this.handleNetworkError();
      throw error; // 向上传递错误
    } finally {
      this.setData({ loading: false });
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
    console.log('刷新天气数据');
    this.setData({ 
      loading: true,
      networkError: false,
      isOffline: false
    });
    
    // 清除当前城市的缓存数据，强制重新加载
    wx.removeStorageSync(`weatherData_${this.data.city}`);
    wx.removeStorageSync(`weatherDataTime_${this.data.city}`);
    
    // 清除天气服务缓存
    weatherService.clearCache();
    
    if (this.data.cityCode) {
      this.loadWeatherData(this.data.cityCode);
    } else {
      this.searchCity(this.data.city);
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    console.log('下拉刷新');
    await this.refreshWeather();
    wx.stopPullDownRefresh();
  },

  // 格式化时间
  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // 格式化小时
  formatHour(timeStr) {
    return timeStr.split('T')[1].substring(0, 5);
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  },

  // 处理网络错误
  handleNetworkError() {
    console.log('处理网络错误');
    this.setData({
      loading: false,
      networkError: true,
      isOffline: true
    });
    
    // 尝试加载离线数据
    this.loadOfflineData(this.data.city);
  }
}); 