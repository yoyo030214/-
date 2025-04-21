// 配置文件
module.exports = {
  // API配置
  api: {
    baseUrl: 'http://175.178.80.222:3000',
    timeout: 10000,
    version: 'v1'
  },

  // 天气API配置
  weather: {
    apiKey: 'your_weather_api_key',
    baseUrl: 'https://api.weatherapi.com/v1'
  },

  // 高德地图配置
  amap: {
    key: 'your_amap_key',
    geocoding: {
      url: 'https://restapi.amap.com/v3/geocode/geo'
    },
    weather: {
      url: 'https://restapi.amap.com/v3/weather/weatherInfo'
    }
  },

  // 图片上传配置
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxCount: 9
  },

  // 缓存配置
  storage: {
    tokenKey: 'merchantToken',
    userInfoKey: 'merchantInfo',
    cartKey: 'merchantCart'
  },

  // 分页配置
  pagination: {
    pageSize: 10,
    maxPages: 100
  },

  // 订单状态
  orderStatus: {
    pending: '待付款',
    paid: '待发货',
    shipped: '待收货',
    completed: '已完成',
    cancelled: '已取消'
  },

  // 支付配置
  payment: {
    timeout: 30 * 60 * 1000, // 30分钟
    wxpay: {
      appId: 'your_wxpay_appid',
      mchId: 'your_wxpay_mchid'
    },
    alipay: {
      appId: 'your_alipay_appid',
      merchantId: 'your_alipay_merchantid'
    }
  },

  baseUrl: 'http://175.178.80.222:3000',
  version: '1.0.0',
  debug: true
}; 