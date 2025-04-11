const express = require('express');
const router = express.Router();
const axios = require('axios');

// 免费天气API（示例）
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'your_weather_api_key';

// 获取当前天气
router.get('/current', async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    
    // 优先使用经纬度，其次使用城市名
    let params = {
      appid: WEATHER_API_KEY,
      units: 'metric', // 摄氏度
      lang: 'zh_cn' // 中文
    };
    
    if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    } else if (city) {
      params.q = city;
    } else {
      return res.status(400).json({ message: '必须提供城市名或经纬度' });
    }
    
    // 调用天气API
    const response = await axios.get(WEATHER_API_URL, { params });
    
    // 提取需要的天气信息
    const weatherData = {
      location: {
        name: response.data.name,
        country: response.data.sys.country,
        coordinates: {
          lat: response.data.coord.lat,
          lon: response.data.coord.lon
        }
      },
      weather: {
        main: response.data.weather[0].main,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon
      },
      temperature: {
        current: response.data.main.temp,
        feelsLike: response.data.main.feels_like,
        min: response.data.main.temp_min,
        max: response.data.main.temp_max
      },
      wind: {
        speed: response.data.wind.speed,
        direction: response.data.wind.deg
      },
      humidity: response.data.main.humidity,
      pressure: response.data.main.pressure,
      visibility: response.data.visibility,
      timestamp: response.data.dt * 1000 // 转换为毫秒
    };
    
    res.status(200).json({ weather: weatherData });
  } catch (error) {
    console.error('获取天气信息失败:', error);
    
    // 处理API错误
    if (error.response) {
      const { status, data } = error.response;
      if (status === 404) {
        return res.status(404).json({ message: '找不到指定城市的天气信息' });
      }
      if (status === 401) {
        return res.status(500).json({ message: 'API密钥无效' });
      }
      return res.status(status).json({ message: data.message || '天气API错误' });
    }
    
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取天气预报
router.get('/forecast', async (req, res) => {
  try {
    const { city, lat, lon, days = 5 } = req.query;
    
    // 使用免费的天气预报API（示例）
    const FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';
    
    // 优先使用经纬度，其次使用城市名
    let params = {
      appid: WEATHER_API_KEY,
      units: 'metric', // 摄氏度
      lang: 'zh_cn', // 中文
      cnt: Math.min(parseInt(days) * 8, 40) // 每天8个3小时间隔，最多5天
    };
    
    if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    } else if (city) {
      params.q = city;
    } else {
      return res.status(400).json({ message: '必须提供城市名或经纬度' });
    }
    
    // 调用天气预报API
    const response = await axios.get(FORECAST_API_URL, { params });
    
    // 整理预报数据，按天分组
    const forecastData = {
      location: {
        name: response.data.city.name,
        country: response.data.city.country,
        coordinates: {
          lat: response.data.city.coord.lat,
          lon: response.data.city.coord.lon
        }
      },
      forecast: []
    };
    
    // 按天组织数据
    const dailyForecasts = {};
    
    response.data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date,
          forecasts: []
        };
      }
      
      dailyForecasts[date].forecasts.push({
        time: new Date(item.dt * 1000).toISOString(),
        weather: {
          main: item.weather[0].main,
          description: item.weather[0].description,
          icon: item.weather[0].icon
        },
        temperature: {
          current: item.main.temp,
          feelsLike: item.main.feels_like,
          min: item.main.temp_min,
          max: item.main.temp_max
        },
        wind: {
          speed: item.wind.speed,
          direction: item.wind.deg
        },
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        visibility: item.visibility
      });
    });
    
    // 转换为数组并排序
    forecastData.forecast = Object.values(dailyForecasts).sort((a, b) => a.date.localeCompare(b.date));
    
    res.status(200).json({ forecast: forecastData });
  } catch (error) {
    console.error('获取天气预报失败:', error);
    
    // 处理API错误
    if (error.response) {
      const { status, data } = error.response;
      if (status === 404) {
        return res.status(404).json({ message: '找不到指定城市的天气预报' });
      }
      if (status === 401) {
        return res.status(500).json({ message: 'API密钥无效' });
      }
      return res.status(status).json({ message: data.message || '天气API错误' });
    }
    
    res.status(500).json({ message: '服务器错误' });
  }
});

// 农业相关天气指数（示例功能）
router.get('/agricultural-index', (req, res) => {
  // 实际项目中可能需要与专业的农业气象数据API集成
  // 这里提供一个示例响应
  const mockData = {
    indices: [
      {
        name: '种植指数',
        value: 75,
        level: '适宜',
        description: '今日天气适宜农作物种植，建议农户可以进行播种活动。'
      },
      {
        name: '施肥指数',
        value: 60,
        level: '较适宜',
        description: '今日气温适中，降水概率低，适合进行农作物施肥作业。'
      },
      {
        name: '病虫害风险',
        value: 30,
        level: '低风险',
        description: '当前温湿度条件下，农作物病虫害发生风险较低。'
      },
      {
        name: '收获指数',
        value: 80,
        level: '非常适宜',
        description: '今日天气晴好，非常适合进行农作物收获作业。'
      },
      {
        name: '灌溉需求',
        value: 70,
        level: '需要',
        description: '近期降水不足，建议对农田进行适量灌溉。'
      }
    ],
    tips: [
      '预计未来三天气温稳定，适合进行田间管理作业。',
      '今日紫外线强度较高，户外作业注意防晒。',
      '近期昼夜温差较大，注意防范可能的霜冻对作物的影响。'
    ],
    updatedAt: new Date().toISOString()
  };
  
  res.status(200).json({ agriculturalIndex: mockData });
});

module.exports = router; 