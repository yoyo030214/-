const app = getApp();
const { request } = require('../../utils/request');
const { showLoading, hideLoading, showError, showSuccess } = require('../../utils/util');

// 引入TensorFlow.js
// 注意：需要先在app.json中配置tensorflow-plugin插件
// const tf = requirePlugin('tensorflow-plugin');

Page({
  data: {
    // 地图配置
    longitude: 114.328963,  // 咸宁市中心经度
    latitude: 29.832798,    // 咸宁市中心纬度
    markers: [],           // 地图标记点
    scale: 10,             // 地图缩放级别
    polygons: [],          // 添加多边形数据
    
    // 数据相关
    counties: [
      { id: 1, name: '咸安区', color: '#FF5733', coordinate: { longitude: 114.298572, latitude: 29.852813 } },
      { id: 2, name: '赤壁市', color: '#33A8FF', coordinate: { longitude: 113.900269, latitude: 29.724102 } },
      { id: 3, name: '通山县', color: '#33FF57', coordinate: { longitude: 114.482698, latitude: 29.605376 } },
      { id: 4, name: '崇阳县', color: '#B033FF', coordinate: { longitude: 114.039857, latitude: 29.556688 } },
      { id: 5, name: '通城县', color: '#FF33A8', coordinate: { longitude: 113.816710, latitude: 29.246076 } },
      { id: 6, name: '嘉鱼县', color: '#FFAA33', coordinate: { longitude: 113.939279, latitude: 29.970587 } }
    ],
    activeCounty: null,     // 当前选中的县区
    
    // 筛选相关
    categories: [
      { id: 'all', name: '全部' },
      { id: 'fruit', name: '水果' },
      { id: 'tea', name: '茶叶' },
      { id: 'aquatic', name: '水产' },
      { id: 'specialty', name: '特产' }
    ],
    seasons: [
      { id: 'all', name: '全年' },
      { id: 'spring', name: '春季' },
      { id: 'summer', name: '夏季' },
      { id: 'autumn', name: '秋季' },
      { id: 'winter', name: '冬季' },
      { id: 'current', name: '当季' }
    ],
    selectedCategory: 'all',
    selectedSeason: 'all',
    
    // 产品数据
    products: [],
    filteredProducts: [],
    geoProducts: [],       // 地理标识产品
    loading: false,
    
    // 界面控制
    showProductList: false,
    showGeoProducts: false,
    expandedPanels: {}, // 添加记录展开的面板
    
    // 新增：节气和推荐相关
    currentTerm: null, // 当前节气
    nextTerm: null, // 下一个节气
    currentTermProducts: [], // 当前节气推荐产品
    nextTermProducts: [], // 下一个节气推荐产品
    recommendedProducts: [], // 个性化推荐产品
    
    // 图片预加载相关
    preloadedImages: {}, // 记录已预加载的图片
    imageLoadQueue: [], // 图片加载队列
    maxConcurrentLoads: 3 // 最大并发加载数
  },

  onLoad: function() {
    this.initMarkers();
    this.initPolygons();
    this.loadAllProducts();
    this.loadGeoProducts();
    this.initSolarTerms(); // 初始化节气数据
    
    // 预加载关键图片
    this.preloadCriticalImages();
    
    // 判断当前季节
    const now = new Date();
    const month = now.getMonth() + 1;
    let currentSeason = 'spring';
    
    if (month >= 3 && month <= 5) {
      currentSeason = 'spring';
    } else if (month >= 6 && month <= 8) {
      currentSeason = 'summer';
    } else if (month >= 9 && month <= 11) {
      currentSeason = 'autumn';
    } else {
      currentSeason = 'winter';
    }
    
    this.setData({ currentSeason });
    
    // 尝试初始化推荐模型
    // this.initRecommendationModel();
    
    // 简化版：不使用模型，直接根据规则生成推荐
    setTimeout(() => {
      this.generateBasicRecommendations();
      // 页面数据加载完成后，预加载非关键图片
      this.preloadNonCriticalImages();
    }, 1000);
  },
  
  // 预加载关键图片（首屏必须的图片）
  preloadCriticalImages() {
    const criticalImages = [
      '/images/products/rice.webp', // 替换为已有的默认图片
      // 去掉不存在的图片
      // '/images/map/marker.png',
      // '/images/icons/location.svg',
      // '/images/icons/filter.svg',
      // '/images/icons/reset.svg'
    ];
    
    this.preloadImages(criticalImages, true);
  },
  
  // 预加载非关键图片（可以延迟加载的图片）
  preloadNonCriticalImages() {
    // 收集所有产品图片
    const termProductImages = this.data.currentTermProducts.map(product => product.image || '');
    const nextTermProductImages = this.data.nextTermProducts.map(product => product.image || '');
    const recommendedProductImages = this.data.recommendedProducts.map(product => product.image || '');
    
    // 确认这些图片实际存在
    const productImages = [
      ...termProductImages,
      ...nextTermProductImages,
      ...recommendedProductImages,
      // 确认存在的图片
      '/images/products/term/fruit_orange_440.webp',
      '/images/products/term/nut_chestnut_440.webp',
      '/images/products/term/tea_silver_440.webp',
      '/images/products/recommend/tea_brick_560.webp',
      '/images/products/recommend/fish_catfish_560.webp',
      '/images/products/recommend/fruit_citrus_560.webp',
      '/images/products/cabbage.webp',
      '/images/products/chili.webp',
      '/images/products/rice.webp',
      '/images/products/strawberry.webp',
      '/images/products/tung-hao.webp',
      '/images/products/vegbox.webp',
      '/images/products/xianningchili.webp'
    ].filter(img => img); // 过滤掉空值
    
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
  
  // 初始化地图标记点
  initMarkers: function() {
    const markers = this.data.counties.map(county => ({
      id: county.id,
      latitude: county.coordinate.latitude,
      longitude: county.coordinate.longitude,
      title: county.name,
      // 暂时不使用图标，使用默认图标
      // iconPath: '/images/map/marker.png',
      width: 30,
      height: 30,
      callout: {
        content: county.name,
        color: '#000000',
        fontSize: 14,
        borderRadius: 5,
        bgColor: '#ffffff',
        padding: 5,
        display: 'ALWAYS'
      }
    }));
    
    this.setData({ markers });
  },
  
  // 新增：初始化县区轮廓多边形
  initPolygons: function() {
    const { counties } = this.data;
    const polygons = counties.map(county => {
      // 每个县的轮廓点坐标数组
      const points = this.getCountyPolygonPoints(county.id);
      return {
        points: points,
        strokeWidth: 2,
        strokeColor: county.color,
        fillColor: county.color + '33', // 添加33表示20%透明度
        zIndex: 1
      };
    });
    
    this.setData({ polygons });
  },

  // 新增：获取县区多边形坐标点函数
  getCountyPolygonPoints: function(countyId) {
    // 实际项目中应该从服务器获取或存储在本地数据库
    // 这里使用简化的咸宁市六个县市区的轮廓点数据
    const polygonData = {
      // 咸安区轮廓点坐标 (简化版)
      1: [
        { latitude: 29.872813, longitude: 114.248572 },
        { latitude: 29.912813, longitude: 114.298572 },
        { latitude: 29.932813, longitude: 114.348572 },
        { latitude: 29.882813, longitude: 114.398572 },
        { latitude: 29.822813, longitude: 114.358572 },
        { latitude: 29.812813, longitude: 114.298572 }
      ],
      // 赤壁市轮廓点坐标 (简化版)
      2: [
        { latitude: 29.694102, longitude: 113.850269 },
        { latitude: 29.744102, longitude: 113.880269 },
        { latitude: 29.784102, longitude: 113.930269 },
        { latitude: 29.754102, longitude: 113.970269 },
        { latitude: 29.704102, longitude: 113.950269 },
        { latitude: 29.674102, longitude: 113.900269 }
      ],
      // 通山县轮廓点坐标 (简化版)
      3: [
        { latitude: 29.575376, longitude: 114.432698 },
        { latitude: 29.635376, longitude: 114.452698 },
        { latitude: 29.665376, longitude: 114.512698 },
        { latitude: 29.625376, longitude: 114.552698 },
        { latitude: 29.575376, longitude: 114.532698 },
        { latitude: 29.545376, longitude: 114.472698 }
      ],
      // 崇阳县轮廓点坐标 (简化版)
      4: [
        { latitude: 29.526688, longitude: 113.989857 },
        { latitude: 29.576688, longitude: 114.009857 },
        { latitude: 29.606688, longitude: 114.069857 },
        { latitude: 29.576688, longitude: 114.109857 },
        { latitude: 29.526688, longitude: 114.089857 },
        { latitude: 29.506688, longitude: 114.029857 }
      ],
      // 通城县轮廓点坐标 (简化版)
      5: [
        { latitude: 29.216076, longitude: 113.766710 },
        { latitude: 29.266076, longitude: 113.786710 },
        { latitude: 29.306076, longitude: 113.846710 },
        { latitude: 29.266076, longitude: 113.886710 },
        { latitude: 29.226076, longitude: 113.866710 },
        { latitude: 29.196076, longitude: 113.806710 }
      ],
      // 嘉鱼县轮廓点坐标 (简化版)
      6: [
        { latitude: 29.940587, longitude: 113.889279 },
        { latitude: 29.990587, longitude: 113.909279 },
        { latitude: 30.020587, longitude: 113.969279 },
        { latitude: 29.990587, longitude: 114.009279 },
        { latitude: 29.940587, longitude: 113.989279 },
        { latitude: 29.920587, longitude: 113.929279 }
      ]
    };
    
    return polygonData[countyId] || [];
  },
  
  // 加载所有产品数据
  loadAllProducts: function() {
    this.setData({ loading: true });
    showLoading('加载中...');
    
    // 模拟数据加载 - 实际项目中应该从API获取
    setTimeout(() => {
      const products = this.getMockProducts();
      
      // 增强产品数据，添加上市时间和预约信息
      const enhancedProducts = this.enhanceProductsWithMarketDates(products);
      
      this.setData({ 
        products: enhancedProducts,
        filteredProducts: enhancedProducts,
        loading: false
      });
      
      hideLoading();
      
      // 加载产品后，更新节气相关产品
      this.updateSolarTermProducts();
      
      // 加载基础推荐
      this.generateBasicRecommendations();
    }, 500);
  },
  
  // 加载地理标识产品
  loadGeoProducts: function() {
    // 模拟数据加载 - 实际项目中应该从API获取
    setTimeout(() => {
      const geoProducts = this.getMockGeoProducts();
      this.setData({ geoProducts });
    }, 700);
  },
  
  // 处理地图点击事件
  onMapTap: function(e) {
    console.log('Map tapped:', e);
  },
  
  // 修改onMarkerTap函数，高亮显示选中的县区
  onMarkerTap: function(e) {
    const markerId = e.markerId;
    const county = this.data.counties.find(item => item.id === markerId);
    
    if (county) {
      // 更新多边形数据，高亮显示选中县区
      const polygons = this.data.counties.map(item => {
        const points = this.getCountyPolygonPoints(item.id);
        return {
          points: points,
          strokeWidth: item.id === markerId ? 3 : 2,
          strokeColor: item.id === markerId ? '#FF0000' : item.color,
          fillColor: item.id === markerId ? item.color + '66' : item.color + '33', // 选中区域透明度更低
          zIndex: item.id === markerId ? 2 : 1
        };
      });

      this.setData({ 
        activeCounty: county,
        // 将地图中心移到选中的县区
        longitude: county.coordinate.longitude,
        latitude: county.coordinate.latitude,
        scale: 12, // 放大地图
        showProductList: true,
        polygons: polygons
      });
      
      // 筛选当前县区的产品
      this.filterProducts();
      wx.showToast({
        title: `已选择${county.name}`,
        icon: 'none'
      });
    }
  },
  
  // 处理类别筛选变化
  onCategoryChange: function(e) {
    const selectedCategory = e.currentTarget.dataset.id;
    this.setData({ selectedCategory });
    this.filterProducts();
  },
  
  // 处理季节筛选变化
  onSeasonChange: function(e) {
    const selectedSeason = e.currentTarget.dataset.id;
    this.setData({ selectedSeason });
    this.filterProducts();
  },
  
  // 切换地理标识产品展示
  toggleGeoProducts: function() {
    this.setData({
      showGeoProducts: !this.data.showGeoProducts
    });
  },
  
  // 筛选产品
  filterProducts: function() {
    const { products, selectedCategory, selectedSeason, activeCounty, currentSeason } = this.data;
    
    let filtered = [...products];
    
    // 筛选县区
    if (activeCounty) {
      filtered = filtered.filter(product => product.county === activeCounty.id);
    }
    
    // 筛选类别
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // 筛选季节
    if (selectedSeason !== 'all') {
      if (selectedSeason === 'current') {
        // 当季产品
        filtered = filtered.filter(product => 
          product.season === currentSeason || product.season === 'all'
        );
      } else {
        filtered = filtered.filter(product => 
          product.season === selectedSeason || product.season === 'all'
        );
      }
    }
    
    this.setData({ filteredProducts: filtered });
  },
  
  // 查看产品详情
  viewProduct: function(e) {
    const productId = e.currentTarget.dataset.id;
    
    // 记录用户行为
    this.trackUserBehavior('view', productId);
    
    wx.navigateTo({
      url: `/pages/product/detail?id=${productId}`
    });
  },
  
  // 添加到购物车
  addToCart: function(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.id === productId);
    
    if (product) {
      // 记录用户行为
      this.trackUserBehavior('cart', productId);
      
      // 实际项目中应调用购物车API
      showSuccess('已添加到购物车');
    }
  },
  
  // 修改resetView函数，重置多边形样式
  resetView: function() {
    // 重置多边形样式
    const polygons = this.data.counties.map(county => {
      const points = this.getCountyPolygonPoints(county.id);
      return {
        points: points,
        strokeWidth: 2,
        strokeColor: county.color,
        fillColor: county.color + '33',
        zIndex: 1
      };
    });
    
    this.setData({
      activeCounty: null,
      longitude: 114.328963,
      latitude: 29.832798,
      scale: 10,
      showProductList: false,
      selectedCategory: 'all',
      selectedSeason: 'all',
      polygons: polygons
    });
    
    this.filterProducts();
  },
  
  // 模拟产品数据 - 实际应用中应从API获取
  getMockProducts: function() {
    return [
      // 咸安区产品
      {
        id: 101,
        name: '浮山银毫',
        category: 'tea',
        county: 1,
        countyName: '咸安区',
        price: '168.00',
        unit: '500g',
        // 单图改为多图数组
        images: [
          '/images/products/term/tea_silver_440.webp',
          '/images/products/term/tea_silver_detail1.webp',
          '/images/products/term/tea_silver_detail2.webp',
          '/images/products/term/tea_silver_detail3.webp'
        ],
        // 增加产品特性
        features: ['有机种植', '手工采摘', '传统工艺', '高山云雾'],
        // 增加营养成分
        nutrition: {
          protein: '2.5g/100g',
          fat: '0.6g/100g',
          carbs: '3.2g/100g',
          minerals: '丰富的矿物质和茶多酚'
        },
        // 增加生产环境信息
        environment: {
          altitude: '800-1200米',
          soil: '红壤土',
          climate: '亚热带季风气候',
          rainfall: '年均1500mm'
        },
        // 增加种植/生产过程
        process: [
          { stage: '春季萌芽', description: '3月下旬开始萌芽' },
          { stage: '采摘', description: '4月初采摘一芽一叶' },
          { stage: '加工', description: '传统手工炒制' },
          { stage: '包装', description: '真空密封保鲜' }
        ],
        season: 'spring',
        image: '/images/products/term/tea_silver_440.webp', // 保留兼容性
        description: '浮山银毫产于咸宁市咸安区浮山茶场，属绿茶类，其外形挺直略扁，白毫显露，色泽翠绿光润，滋味鲜爽，香气高锐持久',
        culture: '浮山茶文化有着悠久历史，据记载始于唐代，历经千年传承至今'
      },
      {
        id: 102,
        name: '向阳桃',
        category: 'fruit',
        county: 1,
        countyName: '咸安区',
        price: '25.90',
        unit: '斤',
        // 多图
        images: [
          '/images/products/term/fruit_peach_440.webp',
          '/images/products/term/fruit_peach_detail1.webp',
          '/images/products/term/fruit_peach_detail2.webp',
          '/images/products/term/fruit_peach_detail3.webp'
        ],
        // 特性
        features: ['自然成熟', '不催熟', '果园直发', '新鲜采摘'],
        // 营养成分
        nutrition: {
          protein: '0.9g/100g',
          fat: '0.1g/100g',
          carbs: '10.5g/100g',
          vitamins: '丰富的维生素C和胡萝卜素'
        },
        // 生产环境
        environment: {
          altitude: '300-500米',
          soil: '砂质土壤',
          climate: '温暖湿润',
          irrigation: '滴灌系统'
        },
        // 生产过程
        process: [
          { stage: '春季开花', description: '3月中旬至4月初开花' },
          { stage: '果实发育', description: '4-6月果实生长发育' },
          { stage: '采摘', description: '7月初开始采摘' },
          { stage: '分级包装', description: '按大小和品质分级包装' }
        ],
        season: 'summer',
        image: '/images/products/term/fruit_peach_440.webp', // 保留兼容性
        description: '向阳桃肉质细嫩，汁多味甜，果形美观，色泽鲜艳，富含多种维生素',
        culture: '咸安区向阳乡种植桃树已有百年历史，当地土壤和气候条件造就了独特品质'
      },
      {
        id: 103,
        name: '淦河野生甲鱼',
        category: 'aquatic',
        county: 1,
        countyName: '咸安区',
        price: '298.00',
        unit: '斤',
        image: '/images/products/term/aquatic_turtle_440.webp',
        season: 'autumn',
        description: '淦河野生甲鱼生长在无污染的淦河水域，肉质鲜美，营养丰富',
        culture: '淦河素有"鱼米之乡"的美誉，甲鱼为当地特色美食之一'
      },
      {
        id: 104,
        name: '高桥绿茶',
        category: 'tea',
        county: 1,
        countyName: '咸安区',
        price: '128.00',
        unit: '500g',
        image: '/images/products/term/tea_green_440.webp',
        season: 'spring',
        description: '高桥绿茶香气清新，滋味甘醇，富含多种氨基酸和维生素',
        culture: '高桥镇茶叶种植历史悠久，是咸宁传统名茶产区之一'
      },
      
      // 赤壁市产品
      {
        id: 201,
        name: '赤壁青砖茶',
        category: 'tea',
        county: 2,
        countyName: '赤壁市',
        price: '298.00',
        unit: '1kg',
        image: '/images/products/recommend/tea_brick_560.webp',
        season: 'all',
        description: '赤壁青砖茶是中国传统的紧压茶，形如砖块，色泽黑褐，冲泡后汤色红浓，香气独特',
        culture: '青砖茶历史悠久，是古代茶马互市的重要商品，赤壁是中国茶文化的发源地之一'
      },
      {
        id: 202,
        name: '羊楼洞柑橘',
        category: 'fruit',
        county: 2,
        countyName: '赤壁市',
        price: '15.90',
        unit: '斤',
        image: '/images/products/recommend/fruit_citrus_560.webp',
        season: 'winter',
        description: '羊楼洞柑橘果形美观，色泽鲜艳，肉质脆嫩多汁，酸甜适口',
        culture: '羊楼洞柑橘种植已有百年历史，当地独特的土壤和气候条件造就了其独特风味'
      },
      {
        id: 203,
        name: '赤壁米酒',
        category: 'specialty',
        county: 2,
        countyName: '赤壁市',
        price: '59.00',
        unit: '瓶',
        image: '/images/products/recommend/specialty_wine_560.webp',
        season: 'all',
        description: '赤壁米酒甘甜醇厚，口感细腻，是以优质糯米为原料，经传统工艺酿制而成',
        culture: '赤壁米酒酿造技艺已有千年历史，是当地重要的非物质文化遗产'
      },
      
      // 通山县产品
      {
        id: 301,
        name: '通山板栗',
        category: 'fruit',
        county: 3,
        countyName: '通山县',
        price: '32.00',
        unit: '斤',
        image: '/images/products/term/nut_chestnut_440.webp',
        season: 'autumn',
        description: '通山板栗个大饱满，肉质松软，香甜可口，营养丰富',
        culture: '通山县盛产板栗，有"板栗之乡"的美誉，种植历史悠久'
      },
      {
        id: 302,
        name: '九宫山黑木耳',
        category: 'specialty',
        county: 3,
        countyName: '通山县',
        price: '88.00',
        unit: '500g',
        image: '/images/products/recommend/specialty_fungus_560.webp',
        season: 'all',
        description: '九宫山黑木耳生长在海拔1000米以上的高山林区，肉质肥厚，色泽乌黑发亮，口感脆嫩',
        culture: '九宫山独特的气候和环境条件，使得这里的黑木耳品质极佳，是当地传统特产'
      },
      {
        id: 303,
        name: '富水绿茶',
        category: 'tea',
        county: 3,
        countyName: '通山县',
        price: '158.00',
        unit: '500g',
        image: '/images/products/term/tea_green_440.webp',
        season: 'spring',
        description: '富水绿茶外形挺秀匀整，色泽翠绿，香气高锐持久，滋味鲜爽',
        culture: '富水茶区环境优越，气候适宜，是通山县传统名茶产区'
      },
      
      // 崇阳县产品
      {
        id: 401,
        name: '崇阳脐橙',
        category: 'fruit',
        county: 4,
        countyName: '崇阳县',
        price: '18.80',
        unit: '斤',
        image: '/images/products/term/fruit_orange_440.webp',
        season: 'winter',
        description: '崇阳脐橙果大皮薄，色泽金黄，肉质细嫩多汁，甜酸适口，富含维生素C',
        culture: '崇阳县是中国著名的脐橙产区，崇阳脐橙获得国家地理标志保护产品认证'
      },
      {
        id: 402,
        name: '白霓蜜桔',
        category: 'fruit',
        county: 4,
        countyName: '崇阳县',
        price: '15.80',
        unit: '斤',
        image: '/images/products/recommend/fruit_tangerine_560.webp',
        season: 'autumn',
        description: '白霓蜜桔果形美观，色泽鲜艳，肉质脆嫩，汁多味甜',
        culture: '白霓镇是崇阳县重要的柑橘产区，当地独特的土壤和气候条件造就了蜜桔的优质品质'
      },
      {
        id: 403,
        name: '金塘贡米',
        category: 'specialty',
        county: 4,
        countyName: '崇阳县',
        price: '39.90',
        unit: '5斤',
        image: '/images/products/recommend/grain_rice_560.webp',
        season: 'all',
        description: '金塘贡米粒粒饱满，色泽晶莹剔透，煮熟后香气扑鼻，口感软糯',
        culture: '金塘贡米种植历史悠久，相传曾是古代进贡的贡品，代表着崇阳县优质水稻的最高品质'
      },
      
      // 通城县产品
      {
        id: 501,
        name: '通城银杏',
        category: 'specialty',
        county: 5,
        countyName: '通城县',
        price: '68.00',
        unit: '500g',
        image: '/images/products/recommend/specialty_ginkgo_560.webp',
        season: 'autumn',
        description: '通城银杏果肉饱满，色泽金黄，口感独特，富含多种营养成分',
        culture: '通城县有"银杏之乡"的美誉，银杏树种植历史悠久，部分古银杏树已有上千年历史'
      },
      {
        id: 502,
        name: '麦市葡萄',
        category: 'fruit',
        county: 5,
        countyName: '通城县',
        price: '22.80',
        unit: '斤',
        image: '/images/products/recommend/fruit_grape_560.webp',
        season: 'summer',
        description: '麦市葡萄粒大均匀，色泽鲜艳，肉质脆嫩多汁，香甜可口',
        culture: '麦市镇是通城县重要的葡萄产区，种植历史已有数十年，当地独特的气候条件造就了葡萄的优质品质'
      },
      {
        id: 503,
        name: '隽水毛尖',
        category: 'tea',
        county: 5,
        countyName: '通城县',
        price: '148.00',
        unit: '500g',
        image: '/images/products/term/tea_tip_440.webp',
        season: 'spring',
        description: '隽水毛尖外形挺拔秀丽，白毫显露，色泽翠绿，香气高锐持久，滋味鲜爽甘醇',
        culture: '隽水毛尖是通城县传统名茶，以隽水河命名，代表着通城优质茶叶的最高品质'
      },
      
      // 嘉鱼县产品
      {
        id: 601,
        name: '嘉鱼黄颡鱼',
        category: 'aquatic',
        county: 6,
        countyName: '嘉鱼县',
        price: '98.00',
        unit: '斤',
        image: '/images/products/recommend/fish_catfish_560.webp',
        season: 'spring',
        description: '嘉鱼黄颡鱼肉质细嫩，口感鲜美，营养丰富，是长江中下游地区的特色鱼种',
        culture: '嘉鱼县濒临长江，水产资源丰富，黄颡鱼是当地传统特色水产'
      },
      {
        id: 602,
        name: '簰洲湖藕',
        category: 'aquatic',
        county: 6,
        countyName: '嘉鱼县',
        price: '12.80',
        unit: '斤',
        image: '/images/products/recommend/aquatic_lotus_560.webp',
        season: 'summer',
        description: '簰洲湖藕藕节饱满，肉质脆嫩，色泽洁白，清甜爽口',
        culture: '簰洲湖是嘉鱼县重要的湖泊，湖藕种植历史悠久，是当地重要的特色农产品'
      },
      {
        id: 603,
        name: '官桥贡米',
        category: 'specialty',
        county: 6,
        countyName: '嘉鱼县',
        price: '42.80',
        unit: '5斤',
        image: '/images/products/recommend/grain_tribute_560.webp',
        season: 'all',
        description: '官桥贡米粒粒饱满，色泽晶莹剔透，煮熟后香气扑鼻，口感软糯',
        culture: '官桥镇是嘉鱼县重要的水稻产区，官桥贡米相传曾是古代进贡的贡品，代表着嘉鱼县优质水稻的最高品质'
      }
    ];
  },
  
  // 模拟地理标识产品
  getMockGeoProducts: function() {
    return [
      {
        id: 1,
        name: '崇阳脐橙',
        level: '国家级',
        year: '2006',
        county: '崇阳县',
        image: '/images/products/term/fruit_orange_440.webp',
        description: '崇阳脐橙是湖北省咸宁市崇阳县的特产，已获得国家地理标志保护产品认证。其果实品质优良，果肉橙黄，化渣性好，风味浓郁。'
      },
      {
        id: 2,
        name: '赤壁青砖茶',
        level: '国家级',
        year: '2010',
        county: '赤壁市',
        image: '/images/products/recommend/tea_brick_560.webp',
        description: '赤壁青砖茶是湖北省咸宁市赤壁市的特产，已获得国家地理标志保护产品认证。具有"红、浓、醇"的品质特征，是中国茶文化的重要代表。'
      },
      {
        id: 3,
        name: '通山板栗',
        level: '省级',
        year: '2012',
        county: '通山县',
        image: '/images/products/term/nut_chestnut_440.webp',
        description: '通山板栗是湖北省咸宁市通山县的特产，已获得省级地理标志保护产品认证。其果实个大饱满，肉质松软，香甜可口。'
      },
      {
        id: 4,
        name: '通城银杏',
        level: '省级',
        year: '2015',
        county: '通城县',
        image: '/images/products/recommend/specialty_ginkgo_560.webp',
        description: '通城银杏是湖北省咸宁市通城县的特产，已获得省级地理标志保护产品认证。通城县有"银杏之乡"的美誉，银杏树种植历史悠久。'
      },
      {
        id: 5,
        name: '簰洲湖藕',
        level: '省级',
        year: '2014',
        county: '嘉鱼县',
        image: '/images/products/recommend/aquatic_lotus_560.webp',
        description: '簰洲湖藕是湖北省咸宁市嘉鱼县的特产，已获得省级地理标志保护产品认证。其藕节饱满，肉质脆嫩，色泽洁白，清甜爽口。'
      }
    ];
  },
  
  // 新增：产品上市时间和预约相关数据结构
  enhanceProductsWithMarketDates: function(products) {
    // 获取当前日期
    const now = new Date();
    const currentYear = now.getFullYear();
    
    return products.map(product => {
      // 根据产品季节确定上市日期
      let marketStartDate, marketEndDate;
      
      switch(product.season) {
        case 'spring':
          marketStartDate = new Date(currentYear, 2, 1); // 3月1日
          marketEndDate = new Date(currentYear, 4, 31);  // 5月31日
          break;
        case 'summer':
          marketStartDate = new Date(currentYear, 5, 1); // 6月1日
          marketEndDate = new Date(currentYear, 7, 31);  // 8月31日
          break;
        case 'autumn':
          marketStartDate = new Date(currentYear, 8, 1); // 9月1日
          marketEndDate = new Date(currentYear, 10, 30); // 11月30日
          break;
        case 'winter':
          marketStartDate = new Date(currentYear, 11, 1); // 12月1日
          marketEndDate = new Date(currentYear + 1, 1, 28); // 次年2月28日
          break;
        default:
          // 全年供应
          marketStartDate = null;
          marketEndDate = null;
      }
      
      // 计算上市倒计时（如果有）
      let countdownDays = null;
      let marketStatus = '全年供应';
      
      if (marketStartDate && marketEndDate) {
        if (now < marketStartDate) {
          // 未上市，计算倒计时
          countdownDays = Math.ceil((marketStartDate - now) / (1000 * 60 * 60 * 24));
          marketStatus = '即将上市';
        } else if (now > marketEndDate) {
          // 已下市
          marketStatus = '已下市';
        } else {
          // 当前正在供应
          marketStatus = '当季热销';
        }
      }
      
      return {
        ...product,
        marketStartDate,
        marketEndDate,
        countdownDays,
        marketStatus,
        canReserve: marketStatus === '即将上市' && countdownDays && countdownDays <= 30
      };
    });
  },
  
  // 新增：初始化推荐模型
  initRecommendationModel: async function() {
    try {
      // 在实际项目中，这里应该加载预训练好的推荐模型
      // this.recommenderModel = await tf.loadLayersModel('云存储路径/model.json');
      console.log('推荐模型加载成功');
      
      // 初始化模型后开始生成推荐
      // this.generateRecommendations();
    } catch (error) {
      console.error('推荐模型加载失败:', error);
      
      // 回退到基础推荐方法
      this.generateBasicRecommendations();
    }
  },
  
  // 新增：生成基础推荐
  generateBasicRecommendations: function() {
    const { products, currentSeason } = this.data;
    
    // 1. 获取用户行为数据（简化版）
    const userBehaviors = wx.getStorageSync('userBehaviors') || {};
    const viewedProducts = userBehaviors.view || [];
    const favoriteCategories = this.getFavoriteCategories(viewedProducts);
    
    // 2. 找出当季热销产品
    const inSeasonProducts = products.filter(p => 
      p.marketStatus === '当季热销' || p.marketStatus === '全年供应'
    );
    
    // 3. 按照用户偏好类别筛选
    let recommendPool = inSeasonProducts;
    if (favoriteCategories.length > 0) {
      const categoryProducts = inSeasonProducts.filter(p => 
        favoriteCategories.includes(p.category)
      );
      
      if (categoryProducts.length >= 3) {
        recommendPool = categoryProducts;
      }
    }
    
    // 4. 根据推荐理由标记产品
    const recommended = recommendPool.map(p => ({
      ...p,
      recommendReason: this.getRecommendReason(p, favoriteCategories, currentSeason)
    })).slice(0, 8); // 最多推荐8个
    
    this.setData({
      recommendedProducts: recommended
    });
  },
  
  // 新增：获取推荐理由
  getRecommendReason: function(product, favoriteCategories, currentSeason) {
    if (product.marketStatus === '当季热销') {
      return '当季鲜品';
    }
    
    if (favoriteCategories.includes(product.category)) {
      return '根据您的浏览偏好';
    }
    
    if (product.season === currentSeason) {
      return '应季好物';
    }
    
    return '优质推荐';
  },
  
  // 新增：获取用户喜好类别
  getFavoriteCategories: function(viewedProducts) {
    if (!viewedProducts || viewedProducts.length === 0) {
      return [];
    }
    
    // 统计各类别的浏览次数
    const categoryCounts = {};
    viewedProducts.forEach(record => {
      const { category } = record;
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
    
    // 转换为数组并排序
    const sortedCategories = Object.keys(categoryCounts)
      .map(category => ({ category, count: categoryCounts[category] }))
      .sort((a, b) => b.count - a.count);
    
    // 返回前2个最常浏览的类别
    return sortedCategories.slice(0, 2).map(item => item.category);
  },
  
  // 新增：初始化节气数据
  initSolarTerms: function() {
    // 二十四节气数据
    const currentYear = new Date().getFullYear();
    const solarTermsData = [
      {
        name: '立春',
        date: new Date(currentYear, 1, 4), // 这些日期每年略有差异，实际项目中应计算或从API获取
        description: '春季开始，万物复苏',
        recommendCategories: ['tea', 'vegetable']
      },
      {
        name: '雨水',
        date: new Date(currentYear, 1, 19),
        description: '降雨增多，湿度渐大',
        recommendCategories: ['tea', 'vegetable']
      },
      {
        name: '惊蛰',
        date: new Date(currentYear, 2, 5),
        description: '春雷始鸣，惊醒蛰伏的昆虫',
        recommendCategories: ['tea', 'vegetable', 'fruit']
      },
      {
        name: '春分',
        date: new Date(currentYear, 2, 20),
        description: '昼夜平分，阴阳相半',
        recommendCategories: ['tea', 'vegetable', 'fruit']
      },
      {
        name: '清明',
        date: new Date(currentYear, 3, 5),
        description: '天气清爽明朗',
        recommendCategories: ['tea', 'vegetable', 'fruit']
      },
      {
        name: '谷雨',
        date: new Date(currentYear, 3, 20),
        description: '雨生百谷',
        recommendCategories: ['tea', 'vegetable', 'fruit']
      },
      {
        name: '立夏',
        date: new Date(currentYear, 4, 5),
        description: '夏季开始',
        recommendCategories: ['fruit', 'vegetable']
      },
      {
        name: '小满',
        date: new Date(currentYear, 4, 21),
        description: '麦类等夏熟作物籽粒开始饱满',
        recommendCategories: ['fruit', 'vegetable']
      },
      {
        name: '芒种',
        date: new Date(currentYear, 5, 5),
        description: '有芒的麦子成熟',
        recommendCategories: ['fruit', 'vegetable', 'aquatic']
      },
      {
        name: '夏至',
        date: new Date(currentYear, 5, 21),
        description: '一年中白昼最长的一天',
        recommendCategories: ['fruit', 'vegetable', 'aquatic']
      },
      {
        name: '小暑',
        date: new Date(currentYear, 6, 7),
        description: '开始进入炎热季节',
        recommendCategories: ['fruit', 'aquatic']
      },
      {
        name: '大暑',
        date: new Date(currentYear, 6, 22),
        description: '一年中最热的时期',
        recommendCategories: ['fruit', 'aquatic']
      },
      {
        name: '立秋',
        date: new Date(currentYear, 7, 7),
        description: '秋季开始',
        recommendCategories: ['fruit', 'specialty']
      },
      {
        name: '处暑',
        date: new Date(currentYear, 7, 23),
        description: '暑气开始消退',
        recommendCategories: ['fruit', 'specialty']
      },
      {
        name: '白露',
        date: new Date(currentYear, 8, 7),
        description: '露水开始凝结',
        recommendCategories: ['fruit', 'specialty']
      },
      {
        name: '秋分',
        date: new Date(currentYear, 8, 23),
        description: '昼夜平分，阴阳相半',
        recommendCategories: ['fruit', 'specialty']
      },
      {
        name: '寒露',
        date: new Date(currentYear, 9, 8),
        description: '露水寒冷，将要结冰',
        recommendCategories: ['fruit', 'specialty']
      },
      {
        name: '霜降',
        date: new Date(currentYear, 9, 23),
        description: '开始降霜',
        recommendCategories: ['fruit', 'specialty']
      },
      {
        name: '立冬',
        date: new Date(currentYear, 10, 7),
        description: '冬季开始',
        recommendCategories: ['specialty', 'fruit']
      },
      {
        name: '小雪',
        date: new Date(currentYear, 10, 22),
        description: '开始降雪',
        recommendCategories: ['specialty', 'fruit']
      },
      {
        name: '大雪',
        date: new Date(currentYear, 11, 7),
        description: '降雪量增多',
        recommendCategories: ['specialty']
      },
      {
        name: '冬至',
        date: new Date(currentYear, 11, 22),
        description: '一年中白昼最短的一天',
        recommendCategories: ['specialty']
      },
      {
        name: '小寒',
        date: new Date(currentYear + 1, 0, 5),
        description: '开始进入寒冷季节',
        recommendCategories: ['specialty']
      },
      {
        name: '大寒',
        date: new Date(currentYear + 1, 0, 20),
        description: '一年中最冷的时期',
        recommendCategories: ['specialty']
      }
    ];
    
    // 为每个节气添加日期字符串
    const formattedSolarTerms = solarTermsData.map(term => {
      const month = term.date.getMonth() + 1;
      const day = term.date.getDate();
      return {
        ...term,
        dateStr: `${month}月${day}日`
      };
    });
    
    // 存储节气数据
    this.solarTermsData = formattedSolarTerms;
    
    // 获取当前节气
    const currentTerm = this.getCurrentSolarTerm();
    
    // 查找下一个节气
    const currentIndex = this.solarTermsData.findIndex(term => term.name === currentTerm.name);
    const nextTermIndex = (currentIndex + 1) % 24;
    const nextTerm = this.solarTermsData[nextTermIndex];
    
    this.setData({
      currentTerm,
      nextTerm
    });
  },
  
  // 新增：获取当前节气
  getCurrentSolarTerm: function() {
    const now = new Date();
    
    // 找到当前日期最接近的节气
    return this.solarTermsData
      .map(term => ({
        ...term,
        diffDays: Math.abs(this.daysBetween(now, term.date))
      }))
      .sort((a, b) => a.diffDays - b.diffDays)[0];
  },
  
  // 新增：计算两个日期之间的天数
  daysBetween: function(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
    const diffTime = Math.abs(date2 - date1);
    return Math.round(diffTime / oneDay);
  },
  
  // 新增：更新节气相关产品
  updateSolarTermProducts: function() {
    if (!this.data.currentTerm || !this.data.nextTerm) return;
    
    const { products, currentTerm, nextTerm } = this.data;
    
    // 获取当前节气推荐的产品
    const currentTermProducts = products.filter(product => 
      currentTerm.recommendCategories.includes(product.category) && 
      (product.marketStatus === '当季热销' || product.marketStatus === '全年供应')
    ).slice(0, 6); // 最多显示6个
    
    // 获取下一个节气推荐的产品
    const nextTermProducts = products.filter(product => 
      nextTerm.recommendCategories.includes(product.category) && 
      !currentTermProducts.find(p => p.id === product.id)
    ).slice(0, 6); // 最多显示6个
    
    this.setData({
      currentTermProducts,
      nextTermProducts
    });
  },
  
  // 新增：用户行为跟踪
  trackUserBehavior: function(behaviorType, productId) {
    const behaviors = wx.getStorageSync('userBehaviors') || {};
    const product = this.data.products.find(p => p.id === productId);
    
    if (!product) return;
    
    // 记录行为
    if (!behaviors[behaviorType]) {
      behaviors[behaviorType] = [];
    }
    
    // 添加带时间戳的行为记录
    behaviors[behaviorType].push({
      productId,
      category: product.category,
      county: product.county,
      timestamp: Date.now()
    });
    
    // 最多保存20条每种行为
    if (behaviors[behaviorType].length > 20) {
      behaviors[behaviorType] = behaviors[behaviorType].slice(-20);
    }
    
    // 保存用户行为数据
    wx.setStorageSync('userBehaviors', behaviors);
  },
  
  // 新增：查看节气指南
  viewSolarTermGuide: function() {
    wx.navigateTo({
      url: '/pages/solar-term-guide/index'
    });
  },
  
  // 新增：预约产品
  reserveProduct: function(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.filteredProducts.find(p => p.id === productId);
    
    if (!product || !product.canReserve) {
      wx.showToast({
        title: '该产品暂不可预约',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '预约提醒',
      content: `您确定要预约${product.name}吗？上市后我们将第一时间通知您。`,
      success: (res) => {
        if (res.confirm) {
          // 保存预约信息
          const reservations = wx.getStorageSync('productReservations') || [];
          const existingIndex = reservations.findIndex(r => r.productId === productId);
          
          if (existingIndex >= 0) {
            wx.showToast({
              title: '您已预约过该产品',
              icon: 'success'
            });
            return;
          }
          
          // 添加新预约
          reservations.push({
            productId,
            productName: product.name,
            expectedDate: product.marketStartDate,
            reserveDate: new Date(),
            notified: false
          });
          
          wx.setStorageSync('productReservations', reservations);
          
          // 记录用户行为
          this.trackUserBehavior('reserve', productId);
          
          wx.showToast({
            title: '预约成功',
            icon: 'success'
          });
        }
      }
    });
  },
  
  // 分享功能更新
  onShareAppMessage: function() {
    return {
      title: '咸宁农产品地图',
      path: '/pages/local-specialties-map/index',
      imageUrl: '/images/share/product-map-share.png'
    };
  },
  
  // 切换详情面板
  togglePanel: function(e) {
    const { panel, id } = e.currentTarget.dataset;
    const key = `${id}_${panel}`;
    const expanded = this.data.expandedPanels[key] || false;
    
    const expandedPanels = {...this.data.expandedPanels};
    expandedPanels[key] = !expanded;
    
    this.setData({ expandedPanels });
  },
  
  // 处理图片加载错误
  handleImageError(e) {
    const { type, index } = e.currentTarget.dataset;
    // 使用现有的图片作为默认图片
    const defaultImage = '/images/products/rice.webp';
    
    if (type === 'term') {
      let products = [...this.data.currentTermProducts];
      products[index].image = defaultImage;
      this.setData({
        currentTermProducts: products
      });
    } else if (type === 'recommend') {
      let products = [...this.data.recommendedProducts];
      products[index].image = defaultImage;
      this.setData({
        recommendedProducts: products
      });
    } else if (type === 'product') {
      let products = [...this.data.filteredProducts];
      products[index].image = defaultImage;
      this.setData({
        filteredProducts: products
      });
    } else if (type === 'geo') {
      let products = [...this.data.geoProducts];
      products[index].image = defaultImage;
      this.setData({
        geoProducts: products
      });
    }
  },
  
  // 页面显示时触发
  onShow() {
    // 继续处理图片加载队列
    this.processImageQueue();
  },
  
  // 页面隐藏时触发
  onHide() {
    // 可以在这里暂停一些非关键操作
  },
  
  // 页面卸载时触发
  onUnload() {
    // 清理资源
  },
  
  // 下拉刷新
  onPullDownRefresh() {
    this.loadAllProducts();
    this.loadGeoProducts();
    this.initSolarTerms();
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },
}); 