const app = getApp();
const { request } = require('../../utils/request');
const { showLoading, hideLoading, showError, showSuccess } = require('../../utils/util');

// 添加防抖函数
function debounce(fn, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(context, args), wait);
  };
}

Page({
  data: {
    longitude: 114.328963,  // 咸宁市中心经度
    latitude: 29.832798,    // 咸宁市中心纬度
    scale: 10,
    markers: [],
    products: [],
    loading: true,
    isLoadingMore: false,
    page: 1,
    hasMore: true,
    currentFilter: 'all',
    clusters: [], // 聚合点数据
    clusterRadius: 40, // 聚合半径
    
    // 筛选选项
    filters: [
      { id: 'all', name: '全部' },
      { id: 'fruits', name: '水果' },
      { id: 'vegetables', name: '蔬菜' },
      { id: 'tea', name: '茶叶' },
      { id: 'aquatic', name: '水产' }
    ],
    
    // 季节标签
    seasons: [
      { id: 'all', name: '全年' },
      { id: 'spring', name: '春季' },
      { id: 'summer', name: '夏季' },
      { id: 'autumn', name: '秋季' },
      { id: 'winter', name: '冬季' }
    ],
    selectedSeason: 'all'
  },

  onLoad() {
    this.loadProducts();
  },

  // 加载产品数据
  async loadProducts(isLoadMore = false) {
    if (this.data.isLoadingMore) return;
    
    try {
      if (!isLoadMore) {
        this.setData({ loading: true });
      } else {
        this.setData({ isLoadingMore: true });
      }
      
      const res = await request({
        url: '/api/products/map',
        data: {
          longitude: this.data.longitude,
          latitude: this.data.latitude,
          filter: this.data.currentFilter,
          season: this.data.selectedSeason,
          page: isLoadMore ? this.data.page + 1 : 1,
          limit: 20
        }
      });

      if (res.success) {
        const products = isLoadMore 
          ? [...this.data.products, ...res.data]
          : res.data;
        
        // 处理产品图片和位置信息
        const processedProducts = products.map(product => ({
          ...product,
          images: Array.isArray(product.images) ? product.images : [product.images]
        }));

        // 生成地图标记点
        const markers = this.generateMarkers(processedProducts);
        
        // 计算标记点聚合
        const clusters = this.calculateClusters(markers);

        this.setData({
          products: processedProducts,
          markers: clusters, // 使用聚合后的标记点
          loading: false,
          isLoadingMore: false,
          page: isLoadMore ? this.data.page + 1 : 1,
          hasMore: res.data.length === 20
        });
      } else {
        showError(res.message || '加载失败');
        this.setData({ 
          loading: false,
          isLoadingMore: false
        });
      }
    } catch (error) {
      showError('网络错误');
      this.setData({ 
        loading: false,
        isLoadingMore: false
      });
    }
  },

  // 生成地图标记点
  generateMarkers(products) {
    return products.map((product, index) => ({
      id: product.id,
      latitude: product.latitude,
      longitude: product.longitude,
      title: product.name,
      callout: {
        content: product.name,
        color: '#ffffff',
        fontSize: 14,
        borderRadius: 4,
        bgColor: '#2ecc71',
        padding: 8,
        display: 'BYCLICK'
      },
      iconPath: '/images/marker.png',
      width: 30,
      height: 30,
      product: product // 保存产品信息用于聚合展示
    }));
  },

  // 计算标记点聚合
  calculateClusters(markers) {
    const clusters = [];
    const processed = new Set();

    markers.forEach((marker, i) => {
      if (processed.has(i)) return;

      const cluster = {
        id: `cluster_${i}`,
        latitude: marker.latitude,
        longitude: marker.longitude,
        iconPath: '/images/cluster.png',
        width: 40,
        height: 40,
        products: [marker.product]
      };

      // 查找附近的标记点
      markers.forEach((other, j) => {
        if (i !== j && !processed.has(j)) {
          const distance = this.calculateDistance(
            marker.latitude, marker.longitude,
            other.latitude, other.longitude
          );

          if (distance <= this.data.clusterRadius) {
            cluster.products.push(other.product);
            processed.add(j);
          }
        }
      });

      // 设置聚合点的显示信息
      if (cluster.products.length > 1) {
        cluster.callout = {
          content: `${cluster.products.length}个产品`,
          color: '#ffffff',
          fontSize: 14,
          borderRadius: 4,
          bgColor: '#ff6b6b',
          padding: 8,
          display: 'ALWAYS'
        };
      } else {
        cluster.callout = marker.callout;
        cluster.iconPath = marker.iconPath;
        cluster.width = marker.width;
        cluster.height = marker.height;
      }

      clusters.push(cluster);
      processed.add(i);
    });

    return clusters;
  },

  // 计算两点之间的距离（米）
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 地球半径（米）
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // 角度转弧度
  toRad(degree) {
    return degree * Math.PI / 180;
  },

  // 处理标记点点击
  onMarkerTap(e) {
    const markerId = e.markerId;
    const marker = this.data.markers.find(m => m.id === markerId);
    
    if (marker) {
      if (marker.products.length > 1) {
        // 显示聚合点的产品列表
        this.showClusterProducts(marker.products);
      } else {
        // 直接跳转到单个产品详情
        this.navigateToProduct(marker.products[0].id);
      }
    }
  },

  // 显示聚合点的产品列表
  showClusterProducts(products) {
    wx.showActionSheet({
      itemList: products.map(p => p.name),
      success: (res) => {
        if (res.tapIndex >= 0) {
          this.navigateToProduct(products[res.tapIndex].id);
        }
      }
    });
  },

  // 跳转到产品详情
  navigateToProduct(productId) {
    wx.navigateTo({
      url: `/pages/products/detail?id=${productId}`
    });
  },

  // 处理筛选变化
  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter,
      page: 1,
      hasMore: true
    });
    this.loadProducts();
  },

  // 处理季节筛选变化
  onSeasonChange(e) {
    const season = e.currentTarget.dataset.season;
    this.setData({
      selectedSeason: season,
      page: 1,
      hasMore: true
    });
    this.loadProducts();
  },

  // 地图区域改变（使用防抖）
  onRegionChange: debounce(function(e) {
    if (e.type === 'end' && e.causedBy === 'drag') {
      const mapContext = wx.createMapContext('map');
      mapContext.getCenterLocation({
        success: (res) => {
          this.setData({
            longitude: res.longitude,
            latitude: res.latitude,
            page: 1,
            hasMore: true
          });
          this.loadProducts();
        }
      });
    }
  }, 500)
}); 