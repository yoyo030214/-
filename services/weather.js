// 天气服务配置
const config = {
  key: 'd5c7919055c54058a2f91af29530572a',  // 和风天气API密钥
  geoBaseUrl: 'https://geoapi.qweather.com/v2',     // 城市查询API地址
  weatherBaseUrl: 'https://devapi.qweather.com/v7'   // 天气查询API地址
};

// 请求缓存
const requestCache = {
  data: {},
  timeout: 2 * 1000, // 改为2秒缓存
  set(key, value) {
    this.data[key] = {
      value,
      timestamp: Date.now()
    };
  },
  get(key) {
    const item = this.data[key];
    if (!item) return null;
    
    // 检查是否过期
    if (Date.now() - item.timestamp > this.timeout) {
      delete this.data[key];
      return null;
    }
    
    return item.value;
  },
  clear() {
    this.data = {};
    console.log('天气服务缓存已清除');
  }
};

// 统一请求方法
const request = (url, data = {}, useGeoApi = false) => {
  return new Promise((resolve, reject) => {
    const baseUrl = useGeoApi ? config.geoBaseUrl : config.weatherBaseUrl;
    const requestUrl = `${baseUrl}${url}`;
    const requestData = {
      ...data,
      key: config.key
    };

    // 生成缓存键
    const cacheKey = `${requestUrl}_${JSON.stringify(requestData)}`;
    
    // 尝试从缓存获取
    const cachedResponse = requestCache.get(cacheKey);
    if (cachedResponse) {
      console.log('使用缓存响应:', cacheKey);
      return resolve(cachedResponse);
    }

    console.log('发起请求:', {
      url: requestUrl,
      data: requestData,
      method: 'GET'
    });

    // 设置请求超时
    const timeout = setTimeout(() => {
      console.error('请求超时:', requestUrl);
      reject(new Error('请求超时'));
    }, 10000); // 10秒超时

    wx.request({
      url: requestUrl,
      data: requestData,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        clearTimeout(timeout);
        console.log('请求响应:', {
          url: url,
          statusCode: res.statusCode,
          data: res.data
        });

        if (res.statusCode === 200) {
          if (res.data && res.data.code === '200') {
            // 缓存响应
            requestCache.set(cacheKey, res.data);
            resolve(res.data);
          } else {
            const error = new Error('API请求失败');
            error.code = res.data ? res.data.code : 'UNKNOWN';
            error.response = res.data;
            console.error('API错误:', error);
            reject(error);
          }
        } else {
          const error = new Error('HTTP请求失败');
          error.statusCode = res.statusCode;
          error.response = res.data;
          console.error('HTTP错误:', error);
          reject(error);
        }
      },
      fail: (err) => {
        clearTimeout(timeout);
        console.error('请求失败:', {
          url: url,
          error: err
        });
        reject(err);
      }
    });
  });
};

// 检查和风天气API是否可用
const checkWeatherAPI = async () => {
  try {
    const testCity = '北京';
    console.log('测试天气API...');
    const res = await request('/city/lookup', { location: testCity }, true);
    console.log('天气API测试成功:', res);
    return true;
  } catch (error) {
    console.error('天气API测试失败:', error);
    return false;
  }
};

module.exports = {
  // 搜索城市
  searchCity: async (keyword) => {
    console.log('搜索城市:', keyword);
    try {
      // 清除城市搜索缓存，确保获取最新数据
      const cacheKey = `/city/lookup_${JSON.stringify({ location: keyword, key: config.key })}`;
      delete requestCache.data[cacheKey];
      
      const res = await request('/city/lookup', { location: keyword }, true);
      console.log('城市搜索结果:', res);
      return res;
    } catch (error) {
      console.error('城市搜索失败:', error);
      throw error;
    }
  },

  // 获取实时天气
  getNowWeather: async (cityId) => {
    console.log('获取实时天气:', cityId);
    try {
      // 清除实时天气缓存，确保获取最新数据
      const cacheKey = `/weather/now_${JSON.stringify({ location: cityId, key: config.key })}`;
      delete requestCache.data[cacheKey];
      
      const res = await request('/weather/now', { location: cityId });
      console.log('实时天气数据:', res);
      return {
        now: {
          temp: res.now.temp,
          text: res.now.text,
          icon: res.now.icon,
          humidity: res.now.humidity,
          windScale: res.now.windScale,
          pressure: res.now.pressure,
          vis: res.now.vis,
          obsTime: res.now.obsTime
        }
      };
    } catch (error) {
      console.error('获取实时天气失败:', error);
      throw error;
    }
  },

  // 获取天气预报
  getWeatherForecast: async (cityId) => {
    console.log('获取天气预报:', cityId);
    try {
      const res = await request('/weather/7d', { location: cityId });
      console.log('天气预报数据:', res);
      return {
        daily: res.daily.map(item => ({
          fxDate: item.fxDate,
          tempMax: item.tempMax,
          tempMin: item.tempMin,
          iconDay: item.iconDay,
          textDay: item.textDay,
          windDirDay: item.windDirDay,
          windScaleDay: item.windScaleDay
        }))
      };
    } catch (error) {
      console.error('获取天气预报失败:', error);
      throw error;
    }
  },

  // 获取24小时预报
  getHourlyForecast: async (cityId) => {
    console.log('获取24小时预报:', cityId);
    try {
      const res = await request('/weather/24h', { location: cityId });
      console.log('24小时预报数据:', res);
      return {
        hourly: res.hourly.map(item => ({
          fxTime: item.fxTime,
          temp: item.temp,
          icon: item.icon,
          text: item.text,
          windDir: item.windDir,
          windScale: item.windScale
        }))
      };
    } catch (error) {
      console.error('获取24小时预报失败:', error);
      throw error;
    }
  },

  // 获取生活指数
  getLifeIndices: async (cityId) => {
    console.log('获取生活指数:', cityId);
    try {
      const res = await request('/indices/1d', { 
        location: cityId,
        type: '1,2,3,4,5,6,7,8,9,10'
      });
      console.log('生活指数数据:', res);
      return {
        daily: res.daily.map(item => ({
          name: item.name,
          category: item.category,
          type: item.type,
          text: item.text
        }))
      };
    } catch (error) {
      console.error('获取生活指数失败:', error);
      throw error;
    }
  },

  // 获取农业气象
  getAgroMeteo: async (cityId) => {
    console.log('获取农业气象:', cityId);
    try {
      const res = await request('/weather/now', { location: cityId });
      return {
        tips: '今日适合进行农作物管理和田间作业，建议农户适时进行灌溉和施肥。注意防范病虫害的发生。',
        description: `当前温度${res.now.temp}℃，湿度${res.now.humidity}%，${res.now.text}，适合进行田间作业。`
      };
    } catch (error) {
      console.error('获取农业气象失败:', error);
      return {
        tips: '暂无农事建议',
        description: '暂无详细说明'
      };
    }
  },

  // 导出API检查方法
  checkWeatherAPI,
  
  // 清除缓存
  clearCache: () => {
    requestCache.clear();
    console.log('天气服务缓存已清除');
  }
}; 