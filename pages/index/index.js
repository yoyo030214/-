// 引入天气服务和网络请求工具
const weatherService = require('../../services/weather');
const { request } = require('../../utils/request');

Page({
  data: {
    showMore: false,
    showCityPicker: false,
    weather: {
      temp: '',
      weatherDesc: '',
      city: '',
      icon: ''
    },
    banners: [
      { id: 1, image: '/images/banners/banner1.webp' },
      { id: 2, image: '/images/banners/banner2.webp' },
      { id: 3, image: '/images/banners/banner3.webp' }
    ],
    farmerStories: [
      {
        id: 1,
        image: '/images/farmers/farmer1.webp',
        farmerName: '李大叔',
        title: '崇阳脐橙：阳光果园的故事',
        views: 1234,
        date: '2024-03-05'
      },
      {
        id: 2,
        image: '/images/farmers/farmer2.webp',
        farmerName: '王阿姨',
        title: '通城有机蔬菜基地',
        views: 2345,
        date: '2024-03-04'
      }
    ],
    // 本地特产
    localProducts: [
      {
        id: 1,
        image: '/images/products/rice.webp',
        name: '咸宁大米',
        origin: '咸宁市',
        farmerName: '咸宁农场',
        price: '39.9',
        unit: '10斤'
      },
      {
        id: 2,
        image: '/images/products/chili.webp',
        name: '咸宁辣椒',
        origin: '咸宁市',
        farmerName: '温泉辣椒基地',
        price: '19.9',
        unit: '2斤'
      }
    ],
    // 当季时令
    seasonalProducts: [
      {
        id: 1,
        image: '/images/products/tung-hao.webp',
        name: '新鲜茼蒿',
        origin: '咸宁市',
        price: '9.9',
        unit: '500g'
      },
      {
        id: 2,
        image: '/images/products/strawberry.webp',
        name: '新鲜草莓',
        origin: '咸宁市',
        price: '29.9',
        unit: '500g'
      }
    ],
    // 农户直供
    farmerProducts: [
      {
        id: 1,
        farmerAvatar: '/images/farmers/farmer1.webp',
        farmerName: '李大叔',
        location: '咸宁崇阳',
        desc: '崇阳脐橙种植能手',
        tags: ['有机认证', '源头直供'],
        products: [
          {
            id: 1,
            name: '崇阳脐橙',
            image: '/images/products/orange.webp',
            price: '39.9',
            unit: '5斤',
            desc: '精选优质脐橙，果肉饱满，汁多甜美',
            sales: 2341
          },
          {
            id: 2,
            name: '崇阳蜜橙',
            image: '/images/products/orange2.webp',
            price: '49.9',
            unit: '5斤',
            desc: '蜜橙中的极品，入口即化',
            sales: 1892
          }
        ]
      },
      {
        id: 2,
        farmerAvatar: '/images/farmers/farmer2.webp',
        farmerName: '王阿姨',
        location: '咸宁通城',
        desc: '有机蔬菜种植专家',
        tags: ['绿色认证', '无公害'],
        products: [
          {
            id: 1,
            name: '时令蔬菜礼盒',
            image: '/images/products/vegbox.webp',
            price: '99.9',
            unit: '10斤',
            desc: '当季新鲜蔬菜，品类丰富',
            sales: 1567
          },
          {
            id: 2,
            name: '有机菜心',
            image: '/images/products/cabbage.webp',
            price: '12.9',
            unit: '500g',
            desc: '生态种植，清甜可口',
            sales: 2103
          }
        ]
      },
      {
        id: 3,
        farmerAvatar: '/images/farmers/farmer3.webp',
        farmerName: '陈爷爷',
        location: '咸宁赤壁',
        desc: '稻米种植传承人',
        tags: ['古法种植', '生态农业'],
        products: [
          {
            id: 1,
            name: '赤壁香米',
            image: '/images/products/rice.webp',
            price: '45.9',
            unit: '10斤',
            desc: '古法种植，香糯可口',
            sales: 3421
          },
          {
            id: 2,
            name: '有机糙米',
            image: '/images/products/rice.webp',
            price: '39.9',
            unit: '5斤',
            desc: '营养丰富，健康之选',
            sales: 1234
          }
        ]
      },
      {
        id: 4,
        farmerAvatar: '/images/farmers/farmer4.webp',
        farmerName: '刘婶',
        location: '咸宁嘉鱼',
        desc: '蜜桃种植达人',
        tags: ['生态种植', '现摘现发'],
        products: [
          {
            id: 1,
            name: '嘉鱼蜜桃',
            image: '/images/products/peach.webp',
            price: '29.9',
            unit: '3斤',
            desc: '个大汁多，香甜可口',
            sales: 4521
          },
          {
            id: 2,
            name: '水蜜桃礼盒',
            image: '/images/products/peach.webp',
            price: '88',
            unit: '6斤',
            desc: '精选大果，送礼佳品',
            sales: 892
          }
        ]
      }
    ],
    isLoading: true, // 添加加载状态
    loadError: false, // 添加错误状态
    preloadedImages: {}, // 记录已预加载的图片
    imageLoadQueue: [], // 图片加载队列
    maxConcurrentLoads: 3 // 最大并发加载数
  },

  // 页面加载
  async onLoad() {
    try {
      // 预加载关键图片
      this.preloadCriticalImages();
      
      // 并行加载数据
      await Promise.all([
        this.loadLocation(),
        this.loadFarmerStories(),
        this.loadLocalProducts(),
        this.loadSeasonalProducts(),
        this.loadFarmerProducts()
      ]);

      this.setData({ 
        isLoading: false,
        loadError: false 
      });
      
      // 页面数据加载完成后，预加载非关键图片
      this.preloadNonCriticalImages();
    } catch (error) {
      console.error('页面加载失败:', error);
      this.setData({ 
        isLoading: false,
        loadError: true 
      });
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  // 预加载关键图片（首屏必须的图片）
  preloadCriticalImages() {
    const criticalImages = [
      '/images/products/default_product.webp',
      '/images/default_farmer.webp',
      '/images/default_icon.webp',
      '/images/features/local.svg',
      '/images/features/seasonal.svg',
      '/images/features/farmer.svg',
      '/images/features/more.svg',
      // 添加轮播图
      ...this.data.banners.map(banner => banner.image)
    ];
    
    this.preloadImages(criticalImages, true);
  },
  
  // 预加载非关键图片（可以延迟加载的图片）
  preloadNonCriticalImages() {
    // 收集所有产品图片
    const productImages = [
      ...this.data.localProducts.map(product => product.image),
      ...this.data.seasonalProducts.map(product => product.image),
      ...this.data.farmerProducts.map(farmer => farmer.farmerAvatar),
      // 特色农产品地图相关图片
      '/images/products/term/tea_silver_440.webp',
      '/images/products/term/fruit_orange_440.webp',
      '/images/products/term/nut_chestnut_440.webp',
      '/images/products/recommend/tea_brick_560.webp',
      '/images/products/recommend/fruit_citrus_560.webp',
      '/images/products/recommend/fish_catfish_560.webp'
    ];
    
    // 过滤掉已经预加载的图片
    const nonCriticalImages = productImages.filter(
      img => !this.data.preloadedImages[img]
    );
    
    this.preloadImages(nonCriticalImages, false);
  },

  // 预加载图片方法
  preloadImages(urls, isCritical = false) {
    if (!urls || !urls.length) return;
    
    // 将图片添加到加载队列
    const queue = [...this.data.imageLoadQueue];
    urls.forEach(url => {
      if (!this.data.preloadedImages[url]) {
        queue.push({
          url,
          isCritical,
          status: 'pending'
        });
      }
    });
    
    this.setData({ imageLoadQueue: queue }, () => {
      this.processImageQueue();
    });
  },
  
  // 处理图片加载队列
  processImageQueue() {
    const queue = [...this.data.imageLoadQueue];
    const preloadedImages = {...this.data.preloadedImages};
    
    // 计算当前正在加载的图片数量
    const loadingCount = queue.filter(item => item.status === 'loading').length;
    
    // 如果正在加载的图片数量已达到最大并发数，则不继续加载
    if (loadingCount >= this.data.maxConcurrentLoads) return;
    
    // 优先加载关键图片
    const criticalPending = queue.findIndex(
      item => item.status === 'pending' && item.isCritical
    );
    
    // 如果没有关键图片，则加载非关键图片
    const nextIndex = criticalPending >= 0 ? 
      criticalPending : 
      queue.findIndex(item => item.status === 'pending');
    
    if (nextIndex >= 0) {
      // 更新状态为加载中
      queue[nextIndex].status = 'loading';
      this.setData({ imageLoadQueue: queue });
      
      const item = queue[nextIndex];
      wx.getImageInfo({
        src: item.url,
        success: () => {
          console.log(`预加载图片成功: ${item.url}`);
          // 更新队列和预加载记录
          const updatedQueue = [...this.data.imageLoadQueue];
          const index = updatedQueue.findIndex(
            q => q.url === item.url && q.status === 'loading'
          );
          
          if (index >= 0) {
            updatedQueue[index].status = 'loaded';
            const updatedPreloaded = {...this.data.preloadedImages};
            updatedPreloaded[item.url] = true;
            
            this.setData({
              imageLoadQueue: updatedQueue,
              preloadedImages: updatedPreloaded
            }, () => {
              // 继续处理队列
              this.processImageQueue();
            });
          }
        },
        fail: (err) => {
          console.warn(`预加载图片失败: ${item.url}`, err);
          // 更新队列状态
          const updatedQueue = [...this.data.imageLoadQueue];
          const index = updatedQueue.findIndex(
            q => q.url === item.url && q.status === 'loading'
          );
          
          if (index >= 0) {
            updatedQueue[index].status = 'failed';
            this.setData({
              imageLoadQueue: updatedQueue
            }, () => {
              // 继续处理队列
              this.processImageQueue();
            });
          }
        }
      });
      
      // 如果还可以加载更多图片，继续处理队列
      if (loadingCount + 1 < this.data.maxConcurrentLoads) {
        this.processImageQueue();
      }
    }
  },

  // 重构位置和天气加载
  async loadLocation() {
    const lastCity = wx.getStorageSync('selectedCity');
    try {
      const location = lastCity 
        ? await this.getCityCoordinates(lastCity)
        : await this.getCurrentLocation();
      
      await this.getWeatherData(location.latitude, location.longitude);
    } catch (error) {
      console.error('位置加载失败:', error);
      this.useDefaultLocation();
    }
  },

  // 获取当前位置
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => resolve(res),
        fail: (err) => {
          console.error('获取位置失败:', err);
          this.useDefaultLocation();
          reject(err);
        }
      });
    });
  },

  // 获取城市坐标
  async getCityCoordinates(city) {
    try {
      const cityData = await weatherService.searchCity(city);
      if (cityData.location && cityData.location[0]) {
        return cityData.location[0];
      }
      throw new Error('未找到城市坐标');
    } catch (error) {
      console.error('获取城市坐标失败:', error);
      this.useDefaultLocation();
      return {
        latitude: 30.52,
        longitude: 114.31
      };
    }
  },

  // 加载农户故事（添加缓存）
  async loadFarmerStories() {
    try {
      // 尝试从缓存读取
      const cachedStories = wx.getStorageSync('farmerStories');
      if (cachedStories) {
        this.setData({ farmerStories: cachedStories });
      }

      // 咸宁农户故事
      const stories = [
        {
          id: 1,
          image: '/images/farmers/farmer1.webp',
          farmerName: '李大叔',
          title: '崇阳脐橙：阳光果园的故事',
          views: 1234,
          date: '2024-03-05'
        },
        {
          id: 2,
          image: '/images/farmers/farmer2.webp',
          farmerName: '王阿姨',
          title: '通城有机蔬菜基地',
          views: 2345,
          date: '2024-03-04'
        },
        {
          id: 3,
          image: '/images/farmers/farmer3.webp',
          farmerName: '陈爷爷',
          title: '赤壁稻米：传统农耕智慧',
          views: 1567,
          date: '2024-03-06'
        },
        {
          id: 4,
          image: '/images/farmers/farmer4.webp',
          farmerName: '刘婶',
          title: '嘉鱼蜜桃：春日甜蜜故事',
          views: 2134,
          date: '2024-03-07'
        }
      ];

      this.setData({ farmerStories: stories });
      // 缓存故事
      wx.setStorageSync('farmerStories', stories);
    } catch (error) {
      console.error('加载农户故事失败:', error);
      wx.showToast({
        title: '加载故事失败',
        icon: 'none'
      });
    }
  },

  // 页面显示时触发
  onShow() {
    // 预加载图片
    this.preloadImages();
  },

  // 下拉刷新
  async onPullDownRefresh() {
    try {
      await this.onLoad();
      wx.stopPullDownRefresh();
    } catch (error) {
      console.error('刷新失败:', error);
      wx.stopPullDownRefresh();
    }
  },

  // 加载本地特产
  async loadLocalProducts() {
    try {
      // 咸宁特色农产品
      const products = [
        {
          id: 1,
          image: '/images/products/rice.webp',
          name: '咸宁大米',
          origin: '咸宁市',
          farmerName: '咸宁农场',
          price: '39.9',
          unit: '10斤'
        },
        {
          id: 2,
          image: '/images/products/chili.webp',
          name: '咸宁辣椒',
          origin: '咸宁市',
          farmerName: '温泉辣椒基地',
          price: '19.9',
          unit: '2斤'
        }
      ];
      this.setData({ localProducts: products });
    } catch (error) {
      console.error('加载特产失败:', error);
      wx.showToast({
        title: '加载特产失败',
        icon: 'none'
      });
    }
  },

  // 加载当季时令
  async loadSeasonalProducts() {
    try {
      // 咸宁春季时令
      const products = [
        {
          id: 1,
          image: '/images/products/tung-hao.webp',
          name: '新鲜茼蒿',
          origin: '咸宁市',
          price: '9.9',
          unit: '500g'
        },
        {
          id: 2,
          image: '/images/products/strawberry.webp',
          name: '新鲜草莓',
          origin: '咸宁市',
          price: '29.9',
          unit: '500g'
        }
      ];
      this.setData({ seasonalProducts: products });
    } catch (error) {
      console.error('加载当季时令失败:', error);
      wx.showToast({
        title: '加载时令失败',
        icon: 'none'
      });
    }
  },

  // 加载农户直供
  async loadFarmerProducts() {
    try {
      // 咸宁农户信息
      const farmers = [
        {
          id: 1,
          farmerAvatar: '/images/farmers/farmer1.webp',
          farmerName: '李大叔',
          location: '咸宁崇阳',
          desc: '崇阳脐橙种植能手',
          tags: ['有机认证', '源头直供'],
          products: [
            {
              id: 1,
              name: '崇阳脐橙',
              image: '/images/products/orange.webp',
              price: '39.9',
              unit: '5斤',
              desc: '精选优质脐橙，果肉饱满，汁多甜美',
              sales: 2341
            },
            {
              id: 2,
              name: '崇阳蜜橙',
              image: '/images/products/orange2.webp',
              price: '49.9',
              unit: '5斤',
              desc: '蜜橙中的极品，入口即化',
              sales: 1892
            }
          ]
        },
        {
          id: 2,
          farmerAvatar: '/images/farmers/farmer2.webp',
          farmerName: '王阿姨',
          location: '咸宁通城',
          desc: '有机蔬菜种植专家',
          tags: ['绿色认证', '无公害'],
          products: [
            {
              id: 1,
              name: '时令蔬菜礼盒',
              image: '/images/products/vegbox.webp',
              price: '99.9',
              unit: '10斤',
              desc: '当季新鲜蔬菜，品类丰富',
              sales: 1567
            },
            {
              id: 2,
              name: '有机菜心',
              image: '/images/products/cabbage.webp',
              price: '12.9',
              unit: '500g',
              desc: '生态种植，清甜可口',
              sales: 2103
            }
          ]
        },
        {
          id: 3,
          farmerAvatar: '/images/farmers/farmer3.webp',
          farmerName: '陈爷爷',
          location: '咸宁赤壁',
          desc: '稻米种植传承人',
          tags: ['古法种植', '生态农业'],
          products: [
            {
              id: 1,
              name: '赤壁香米',
              image: '/images/products/rice.webp',
              price: '45.9',
              unit: '10斤',
              desc: '古法种植，香糯可口',
              sales: 3421
            },
            {
              id: 2,
              name: '有机糙米',
              image: '/images/products/rice.webp',
              price: '39.9',
              unit: '5斤',
              desc: '营养丰富，健康之选',
              sales: 1234
            }
          ]
        },
        {
          id: 4,
          farmerAvatar: '/images/farmers/farmer4.webp',
          farmerName: '刘婶',
          location: '咸宁嘉鱼',
          desc: '蜜桃种植达人',
          tags: ['生态种植', '现摘现发'],
          products: [
            {
              id: 1,
              name: '嘉鱼蜜桃',
              image: '/images/products/peach.webp',
              price: '29.9',
              unit: '3斤',
              desc: '个大汁多，香甜可口',
              sales: 4521
            },
            {
              id: 2,
              name: '水蜜桃礼盒',
              image: '/images/products/peach.webp',
              price: '88',
              unit: '6斤',
              desc: '精选大果，送礼佳品',
              sales: 892
            }
          ]
        }
      ];
      this.setData({ farmerProducts: farmers });
    } catch (error) {
      console.error('加载农户直供失败:', error);
      wx.showToast({
        title: '加载农户失败',
        icon: 'none'
      });
    }
  },

  // 获取天气数据
  getWeatherData(latitude, longitude) {
    const key = 'd5c7919055c54058a2f91af29530572a';
    const location = `${longitude.toFixed(2)},${latitude.toFixed(2)}`;
    
    wx.request({
      url: 'https://devapi.qweather.com/v7/weather/now',
      data: {
        key: key,
        location: location
      },
      success: (res) => {
        console.log('天气数据响应：', res.data);
        if (res.data.code === '200') {
          const weatherData = res.data.now;
          let weatherIcon = 'unknown';
          if (weatherData && weatherData.icon && weatherData.icon.trim()) {
            const iconCode = parseInt(weatherData.icon);
            if (!isNaN(iconCode)) {
              switch (iconCode) {
                case 100:
                  weatherIcon = '100';
                  break;
                case 101:
                  weatherIcon = '101';
                  break;
                case 104:
                  weatherIcon = '104';
                  break;
                default:
                  weatherIcon = 'unknown';
              }
            }
          }
          
          this.setData({
            'weather.temp': weatherData.temp || '--',
            'weather.weatherDesc': weatherData.text || '暂无数据',
            'weather.icon': weatherIcon
          });
          this.getCityName(latitude, longitude);
        } else {
          console.error('获取天气失败，错误码：', res.data.code);
          this.handleWeatherError();
        }
      },
      fail: (err) => {
        console.error('获取天气请求失败：', err);
        this.handleWeatherError();
      },
      timeout: 10000  // 设置10秒超时
    });
  },

  // 处理天气获取错误
  handleWeatherError() {
    this.setData({
      'weather.temp': '--',
      'weather.weatherDesc': '暂无数据',
      'weather.city': '未知位置',
      'weather.icon': 'unknown'
    });
    
    wx.showToast({
      title: '获取天气信息失败',
      icon: 'none',
      duration: 2000
    });
  },

  // 获取城市名称
  getCityName(latitude, longitude) {
    const key = 'd5c7919055c54058a2f91af29530572a';
    const location = `${longitude.toFixed(2)},${latitude.toFixed(2)}`;

    wx.request({
      url: 'https://geoapi.qweather.com/v2/city/lookup',
      data: {
        key: key,
        location: location
      },
      success: (res) => {
        console.log('城市数据响应：', res.data); // 添加日志
        if (res.data.code === '200' && res.data.location && res.data.location[0]) {
          this.setData({
            'weather.city': res.data.location[0].name || '未知位置'
          });
        } else {
          this.setData({
            'weather.city': '未知位置'
          });
        }
      },
      fail: (err) => {
        console.error('获取城市名称失败：', err);
        this.setData({
          'weather.city': '未知位置'
        });
      }
    });
  },

  // 搜索相关
  onSearchTap() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  // 功能导航
  navigateToFeature(e) {
    const feature = e.currentTarget.dataset.feature;
    switch (feature) {
      case 'local':
        wx.navigateTo({ url: '/pages/local/local' });
        break;
      case 'seasonal':
        wx.navigateTo({ url: '/pages/seasonal/seasonal' });
        break;
      case 'farmer':
        wx.navigateTo({ url: '/pages/farmer/farmer' });
        break;
      case 'more':
        this.showMoreFeatures();
        break;
    }
  },

  // 更多功能面板
  showMoreFeatures() {
    this.setData({ showMore: true });
  },

  hideMoreFeatures() {
    this.setData({ showMore: false });
  },

  preventTouchMove() {
    // 防止滑动穿透
    return false;
  },

  // 导航函数
  navigateToCategory() {
    // 直接跳转到more页面，不经过category页面
    wx.navigateTo({
      url: '/pages/more/more?category=全部'
    });
    this.hideMoreFeatures();
  },

  navigateToCart() {
    wx.navigateTo({ url: '/pages/cart/cart' });
    this.hideMoreFeatures();
  },

  navigateToOrders() {
    wx.navigateTo({ url: '/pages/orders/orders' });
    this.hideMoreFeatures();
  },

  navigateToFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' });
    this.hideMoreFeatures();
  },

  navigateToAddress() {
    wx.navigateTo({ url: '/pages/address/address' });
    this.hideMoreFeatures();
  },

  navigateToService() {
    wx.navigateTo({ url: '/pages/service/service' });
    this.hideMoreFeatures();
  },

  // 查看详情
  viewStory(e) {
    const storyId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/story/detail?id=${storyId}`
    });
  },

  // 查看本地特产详情
  viewLocalProduct(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product/detail?id=${productId}&type=local`
    });
  },

  // 查看当季时令详情
  viewSeasonalProduct(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product/detail?id=${productId}&type=seasonal`
    });
  },

  // 查看农户直供详情
  viewFarmerProduct(e) {
    const farmerId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/farmer/detail?id=${farmerId}`
    });
  },

  // 导航到本地特产页面
  navigateToLocal() {
    wx.navigateTo({
      url: '/pages/local/local'
    });
  },

  // 导航到当季时令页面
  navigateToSeasonal() {
    wx.navigateTo({
      url: '/pages/seasonal/seasonal'
    });
  },

  // 导航到农户直供页面
  navigateToFarmer() {
    wx.navigateTo({
      url: '/pages/farmer/farmer'
    });
  },

  viewPromotion(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/promotion/promotion?id=${id}`
    });
  },

  // 查看更多
  navigateToMore() {
    wx.navigateTo({ 
      url: '/pages/stories/stories',
      events: {
        // 可以监听故事列表页面传回的事件
      },
      success: (res) => {
        // 可以向故事列表页面传递数据
        res.eventChannel.emit('acceptDataFromOpenerPage', { data: this.data.farmerStories })
      }
    });
  },

  viewAllPromotions() {
    wx.navigateTo({ url: '/pages/promotions/promotions' });
  },

  // 显示城市选择器
  showCityPicker() {
    console.log('显示城市选择器');  // 添加日志
    this.setData({
      showCityPicker: true
    });
  },

  // 隐藏城市选择器
  hideCityPicker() {
    console.log('隐藏城市选择器');  // 添加日志
    this.setData({
      showCityPicker: false
    });
  },

  // 处理城市选择
  handleCitySelect(e) {
    console.log('选择城市:', e.detail);  // 添加日志
    const { city } = e.detail;
    this.setData({
      showCityPicker: false,
      'weather.city': city
    });
    
    // 保存选择的城市
    wx.setStorageSync('selectedCity', city);
    
    // 获取城市天气
    this.getCityWeather(city);
  },

  // 获取城市天气
  async getCityWeather(city) {
    try {
      // 先获取城市ID和坐标
      const cityData = await weatherService.searchCity(city);
      if (cityData.location && cityData.location[0]) {
        const location = cityData.location[0];
        // 使用城市的经纬度获取天气
        this.getWeatherData(location.lat, location.lon);
      } else {
        this.handleWeatherError();
      }
    } catch (error) {
      console.error('获取城市信息失败:', error);
      this.handleWeatherError();
    }
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '楚农优品',
      path: '/pages/index/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '楚农优品'
    };
  },

  // 处理图片加载错误
  handleImageLoadError(e) {
    const src = e.currentTarget.dataset.src;
    console.warn(`图片加载失败: ${src}`);
    
    // 替换为默认图片
    if (src.includes('/farmers/')) {
      // 农户图片处理
      const defaultFarmerImage = '/images/default_farmer.webp';
      
      // 更新农户直供数据中的图片
      const updatedFarmerProducts = this.data.farmerProducts.map(item => {
        if (item.farmerAvatar === src) {
          return { ...item, farmerAvatar: defaultFarmerImage };
        }
        return item;
      });
      
      this.setData({
        farmerProducts: updatedFarmerProducts
      });
    } else if (src.includes('/products/')) {
      // 产品图片处理
      const defaultProductImage = '/images/products/default_product.webp';
      
      // 更新本地特产数据中的图片
      const updatedLocalProducts = this.data.localProducts.map(item => {
        if (item.image === src) {
          return { ...item, image: defaultProductImage };
        }
        return item;
      });
      
      // 更新当季时令数据中的图片
      const updatedSeasonalProducts = this.data.seasonalProducts.map(item => {
        if (item.image === src) {
          return { ...item, image: defaultProductImage };
        }
        return item;
      });
      
      // 更新农户产品数据中的图片
      const updatedFarmerProducts = this.data.farmerProducts.map(farmer => ({
        ...farmer,
        products: farmer.products.map(product => {
          if (product.image === src) {
            return { ...product, image: defaultProductImage };
          }
          return product;
        })
      }));
      
      this.setData({
        localProducts: updatedLocalProducts,
        seasonalProducts: updatedSeasonalProducts,
        farmerProducts: updatedFarmerProducts
      });
    } else if (src.includes('/banners/')) {
      // 轮播图处理
      const defaultBannerImage = '/images/default_banner.webp';
      
      // 更新轮播图数据
      const updatedBanners = this.data.banners.map(item => {
        if (item.image === src) {
          return { ...item, image: defaultBannerImage };
        }
        return item;
      });
      
      this.setData({
        banners: updatedBanners
      });
    }
  },

  // 预览农户图片
  previewFarmerImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.farmerProducts.map(item => item.farmerAvatar)
    });
  },

  // 预览产品图片
  previewProductImage(e) {
    const { url, type } = e.currentTarget.dataset;
    let urls = [];
    
    switch(type) {
      case 'local':
        urls = this.data.localProducts.map(item => item.image);
        break;
      case 'seasonal':
        urls = this.data.seasonalProducts.map(item => item.image);
        break;
      case 'farmer':
        urls = this.data.farmerProducts
          .map(farmer => farmer.products.map(product => product.image))
          .flat();
        break;
      default:
        urls = [url];
    }
    
    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  // 添加跳转到特色农产品地图的函数
  navigateToProductMap: function() {
    this.hideMoreFeatures();
    wx.navigateTo({
      url: '/pages/local-specialties-map/index'
    });
  },
});
