/**
 * 小程序商城连接器
 * 用于处理商品上传、政策页面和在线/离线模式切换
 */

class MiniappConnector {
  constructor(baseUrl = 'http://localhost:5000/api') {
    this.baseUrl = baseUrl;
    this.token = wx.getStorageSync('merchant_token') || null;
    this.user = wx.getStorageSync('merchant_user') ? JSON.parse(wx.getStorageSync('merchant_user')) : null;
    
    // 本地缓存
    this.localCache = {
      products: wx.getStorageSync('local_products') ? JSON.parse(wx.getStorageSync('local_products')) : [],
      policies: wx.getStorageSync('local_policies') ? JSON.parse(wx.getStorageSync('local_policies')) : [],
      farmerStories: wx.getStorageSync('local_farmer_stories') ? JSON.parse(wx.getStorageSync('local_farmer_stories')) : []
    };
    
    // 网络状态
    this.isOnline = true;
    
    // 初始化
    this.init();
  }
  
  /**
   * 初始化
   */
  init() {
    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      this.isOnline = res.isConnected;
      if (res.isConnected) {
        wx.showToast({
          title: '网络已连接',
          icon: 'success',
          duration: 1500
        });
        this.syncLocalChanges();
      } else {
        wx.showToast({
          title: '网络已断开，切换至离线模式',
          icon: 'none',
          duration: 2000
        });
      }
    });
    
    // 初始检查网络状态
    this.checkNetworkStatus();
  }
  
  /**
   * 检查网络状态
   */
  async checkNetworkStatus() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          this.isOnline = res.networkType !== 'none';
          resolve(this.isOnline);
        },
        fail: () => {
          this.isOnline = false;
          resolve(false);
        }
      });
    });
  }
  
  /**
   * 设置请求头
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = this.token;
    }
    
    return headers;
  }
  
  /**
   * 发起网络请求
   */
  async request(url, method, data = null, useForm = false) {
    // 检查网络状态
    const isOnline = await this.checkNetworkStatus();
    if (!isOnline) {
      throw new Error('网络连接不可用，请检查网络设置');
    }
    
    return new Promise((resolve, reject) => {
      const requestTask = wx.request({
        url: `${this.baseUrl}${url}`,
        method: method,
        header: this.getHeaders(),
        data: data,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: (err) => {
          reject(new Error('网络请求失败，请检查网络连接'));
        }
      });
    });
  }
  
  /**
   * 上传文件
   */
  async uploadFile(url, filePath, name, formData = {}) {
    // 检查网络状态
    const isOnline = await this.checkNetworkStatus();
    if (!isOnline) {
      throw new Error('网络连接不可用，请检查网络设置');
    }
    
    return new Promise((resolve, reject) => {
      const uploadTask = wx.uploadFile({
        url: `${this.baseUrl}${url}`,
        filePath: filePath,
        name: name,
        header: {
          'Authorization': this.token
        },
        formData: formData,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const data = JSON.parse(res.data);
            resolve(data);
          } else {
            let message = '上传失败';
            try {
              const error = JSON.parse(res.data);
              message = error.message || message;
            } catch (e) {}
            reject(new Error(message));
          }
        },
        fail: (err) => {
          reject(new Error('文件上传失败，请检查网络连接'));
        }
      });
    });
  }
  
  /**
   * 登录
   */
  async login(username, password) {
    try {
      const data = await this.request('/login', 'POST', { username, password });
      
      // 保存token和用户信息
      this.token = data.token;
      this.user = data.user;
      
      wx.setStorageSync('merchant_token', this.token);
      wx.setStorageSync('merchant_user', JSON.stringify(this.user));
      
      return data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取商品列表
   * @param {string} category 商品分类（可选）
   */
  async getProducts(category = '') {
    try {
      // 检查网络状态
      const isOnline = await this.checkNetworkStatus();
      
      if (isOnline) {
        // 在线模式，从服务器获取
        const url = category ? `/products?category=${encodeURIComponent(category)}` : '/products';
        const data = await this.request(url, 'GET');
        
        // 更新本地缓存
        if (category) {
          // 更新指定分类的商品
          const otherProducts = this.localCache.products.filter(p => p.category !== category);
          const categoryProducts = data.data.filter(p => p.category === category);
          this.localCache.products = [...otherProducts, ...categoryProducts];
        } else {
          // 更新所有商品
          this.localCache.products = data.data;
        }
        
        wx.setStorageSync('local_products', JSON.stringify(this.localCache.products));
        
        return data;
      } else {
        // 离线模式，从本地缓存获取
        let products = this.localCache.products;
        
        // 如果指定了分类，进行过滤
        if (category) {
          products = products.filter(p => p.category === category);
        }
        
        return {
          status: 'success',
          data: products,
          isOfflineData: true
        };
      }
    } catch (error) {
      console.error('获取商品列表失败:', error);
      
      // 发生错误时也尝试从本地获取
      let products = this.localCache.products;
      
      // 如果指定了分类，进行过滤
      if (category) {
        products = products.filter(p => p.category === category);
      }
      
      return {
        status: 'success',
        data: products,
        isOfflineData: true,
        error: error.message
      };
    }
  }
  
  /**
   * 获取商品详情
   * @param {string} productId 商品ID
   */
  async getProductDetail(productId) {
    try {
      // 检查网络状态
      const isOnline = await this.checkNetworkStatus();
      
      if (isOnline) {
        // 在线模式，从服务器获取
        const data = await this.request(`/products/${productId}`, 'GET');
        
        // 更新本地缓存中的对应商品
        const index = this.localCache.products.findIndex(p => p.id === productId);
        if (index >= 0) {
          this.localCache.products[index] = data.data;
        } else {
          this.localCache.products.push(data.data);
        }
        
        wx.setStorageSync('local_products', JSON.stringify(this.localCache.products));
        
        return data;
      } else {
        // 离线模式，从本地缓存获取
        const product = this.localCache.products.find(p => p.id === productId);
        
        if (!product) {
          throw new Error('商品不存在或已被删除');
        }
        
        return {
          status: 'success',
          data: product,
          isOfflineData: true
        };
      }
    } catch (error) {
      console.error('获取商品详情失败:', error);
      
      // 发生错误时也尝试从本地获取
      const product = this.localCache.products.find(p => p.id === productId);
      
      if (!product) {
        throw new Error('商品不存在或已被删除');
      }
      
      return {
        status: 'success',
        data: product,
        isOfflineData: true,
        error: error.message
      };
    }
  }
  
  /**
   * 添加商品
   * @param {Object} productData 商品数据
   * @param {string} imagePath 图片路径
   */
  async addProduct(productData, imagePath) {
    try {
      // 检查网络状态
      const isOnline = await this.checkNetworkStatus();
      
      if (isOnline) {
        // 在线模式，直接上传到服务器
        const data = await this.uploadFile('/products', imagePath, 'image', productData);
        
        // 添加到本地缓存
        this.localCache.products.push(data.data);
        wx.setStorageSync('local_products', JSON.stringify(this.localCache.products));
        
        return data;
      } else {
        // 离线模式，先保存到本地
        const tempProduct = {
          id: `temp_${Date.now()}`,
          ...productData,
          image: imagePath,
          createdAt: new Date().toISOString(),
          status: 'pending',
          merchant: this.user.username
        };
        
        // 添加到本地缓存
        this.localCache.products.push(tempProduct);
        wx.setStorageSync('local_products', JSON.stringify(this.localCache.products));
        
        // 添加到待同步列表
        let pendingUploads = wx.getStorageSync('pending_uploads') || [];
        pendingUploads.push({
          type: 'product',
          data: productData,
          imagePath: imagePath,
          tempId: tempProduct.id,
          timestamp: Date.now()
        });
        wx.setStorageSync('pending_uploads', pendingUploads);
        
        return {
          status: 'success',
          message: '商品已保存到本地，将在网络恢复后自动上传',
          data: tempProduct,
          isOfflineData: true
        };
      }
    } catch (error) {
      console.error('添加商品失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取政策列表
   */
  async getPolicies() {
    try {
      // 检查网络状态
      const isOnline = await this.checkNetworkStatus();
      
      if (isOnline) {
        // 在线模式，从服务器获取
        const data = await this.request('/policies', 'GET');
        
        // 更新本地缓存
        this.localCache.policies = data.data;
        wx.setStorageSync('local_policies', JSON.stringify(this.localCache.policies));
        
        return data;
      } else {
        // 离线模式，从本地缓存获取
        return {
          status: 'success',
          data: this.localCache.policies,
          isOfflineData: true
        };
      }
    } catch (error) {
      console.error('获取政策列表失败:', error);
      
      // 发生错误时也尝试从本地获取
      return {
        status: 'success',
        data: this.localCache.policies,
        isOfflineData: true,
        error: error.message
      };
    }
  }
  
  /**
   * 获取政策详情
   * @param {string} policyId 政策ID
   */
  async getPolicyDetail(policyId) {
    try {
      // 检查网络状态
      const isOnline = await this.checkNetworkStatus();
      
      if (isOnline) {
        // 在线模式，从服务器获取
        const data = await this.request(`/policies/${policyId}`, 'GET');
        
        // 更新本地缓存中的对应政策
        const index = this.localCache.policies.findIndex(p => p.id === policyId);
        if (index >= 0) {
          this.localCache.policies[index] = data.data;
        } else {
          this.localCache.policies.push(data.data);
        }
        
        wx.setStorageSync('local_policies', JSON.stringify(this.localCache.policies));
        
        return data;
      } else {
        // 离线模式，从本地缓存获取
        const policy = this.localCache.policies.find(p => p.id === policyId);
        
        if (!policy) {
          throw new Error('政策信息不存在或已被删除');
        }
        
        return {
          status: 'success',
          data: policy,
          isOfflineData: true
        };
      }
    } catch (error) {
      console.error('获取政策详情失败:', error);
      
      // 发生错误时也尝试从本地获取
      const policy = this.localCache.policies.find(p => p.id === policyId);
      
      if (!policy) {
        throw new Error('政策信息不存在或已被删除');
      }
      
      return {
        status: 'success',
        data: policy,
        isOfflineData: true,
        error: error.message
      };
    }
  }
  
  /**
   * 获取农户故事列表
   */
  async getFarmerStories() {
    try {
      // 检查网络状态
      const isOnline = await this.checkNetworkStatus();
      
      if (isOnline) {
        // 在线模式，从服务器获取
        const data = await this.request('/farmer-stories', 'GET');
        
        // 更新本地缓存
        this.localCache.farmerStories = data.data;
        wx.setStorageSync('local_farmer_stories', JSON.stringify(this.localCache.farmerStories));
        
        return data;
      } else {
        // 离线模式，从本地缓存获取
        return {
          status: 'success',
          data: this.localCache.farmerStories,
          isOfflineData: true
        };
      }
    } catch (error) {
      console.error('获取农户故事列表失败:', error);
      
      // 发生错误时也尝试从本地获取
      return {
        status: 'success',
        data: this.localCache.farmerStories,
        isOfflineData: true,
        error: error.message
      };
    }
  }
  
  /**
   * 获取农户故事详情
   * @param {string} storyId 故事ID
   */
  async getFarmerStoryDetail(storyId) {
    try {
      // 检查网络状态
      const isOnline = await this.checkNetworkStatus();
      
      if (isOnline) {
        // 在线模式，从服务器获取
        const data = await this.request(`/farmer-stories/${storyId}`, 'GET');
        
        // 更新本地缓存中的对应故事
        const index = this.localCache.farmerStories.findIndex(s => s.id === storyId);
        if (index >= 0) {
          this.localCache.farmerStories[index] = data.data;
        } else {
          this.localCache.farmerStories.push(data.data);
        }
        
        wx.setStorageSync('local_farmer_stories', JSON.stringify(this.localCache.farmerStories));
        
        return data;
      } else {
        // 离线模式，从本地缓存获取
        const story = this.localCache.farmerStories.find(s => s.id === storyId);
        
        if (!story) {
          throw new Error('农户故事不存在或已被删除');
        }
        
        return {
          status: 'success',
          data: story,
          isOfflineData: true
        };
      }
    } catch (error) {
      console.error('获取农户故事详情失败:', error);
      
      // 发生错误时也尝试从本地获取
      const story = this.localCache.farmerStories.find(s => s.id === storyId);
      
      if (!story) {
        throw new Error('农户故事不存在或已被删除');
      }
      
      return {
        status: 'success',
        data: story,
        isOfflineData: true,
        error: error.message
      };
    }
  }
  
  /**
   * 同步本地修改到服务器
   */
  async syncLocalChanges() {
    // 获取待同步的上传
    let pendingUploads = wx.getStorageSync('pending_uploads') || [];
    
    if (pendingUploads.length === 0) {
      return { status: 'success', message: '没有需要同步的数据' };
    }
    
    // 显示同步进度
    wx.showLoading({
      title: '正在同步本地数据',
      mask: true
    });
    
    // 同步结果
    const results = {
      total: pendingUploads.length,
      success: 0,
      failed: 0,
      details: []
    };
    
    // 处理每个待上传项
    const newPendingUploads = [];
    
    for (const item of pendingUploads) {
      try {
        if (item.type === 'product') {
          // 上传商品
          const data = await this.uploadFile('/products', item.imagePath, 'image', item.data);
          
          // 更新本地缓存中的临时商品
          const index = this.localCache.products.findIndex(p => p.id === item.tempId);
          if (index >= 0) {
            this.localCache.products[index] = data.data;
          }
          
          results.success++;
          results.details.push({
            type: 'product',
            status: 'success',
            id: data.data.id,
            name: item.data.name
          });
        }
        // 可以添加其他类型的同步处理
      } catch (error) {
        console.error('同步失败:', error, item);
        
        results.failed++;
        results.details.push({
          type: item.type,
          status: 'failed',
          error: error.message,
          item: item
        });
        
        // 保留失败的项，以便下次重试
        newPendingUploads.push(item);
      }
    }
    
    // 更新本地存储
    wx.setStorageSync('local_products', JSON.stringify(this.localCache.products));
    wx.setStorageSync('pending_uploads', newPendingUploads);
    
    // 隐藏加载提示
    wx.hideLoading();
    
    // 显示结果
    if (results.failed > 0) {
      wx.showToast({
        title: `同步完成，成功${results.success}，失败${results.failed}`,
        icon: 'none',
        duration: 2000
      });
    } else {
      wx.showToast({
        title: '所有数据同步成功',
        icon: 'success',
        duration: 1500
      });
    }
    
    return { status: 'success', results };
  }
  
  /**
   * 预加载数据
   * 用于应用启动时预加载基础数据
   */
  async preloadData() {
    try {
      // 检查网络状态
      const isOnline = await this.checkNetworkStatus();
      
      if (!isOnline) {
        console.log('离线模式，使用本地缓存数据');
        return {
          status: 'success',
          isOfflineData: true,
          message: '当前处于离线模式，使用本地缓存数据'
        };
      }
      
      // 显示加载提示
      wx.showLoading({
        title: '正在加载数据',
        mask: true
      });
      
      // 并行加载多种数据
      const promises = [
        this.getProducts(),
        this.getPolicies(),
        this.getFarmerStories()
      ];
      
      const results = await Promise.allSettled(promises);
      
      // 隐藏加载提示
      wx.hideLoading();
      
      // 检查结果
      const hasErrors = results.some(result => result.status === 'rejected');
      
      if (hasErrors) {
        console.warn('部分数据加载失败', results);
        wx.showToast({
          title: '部分数据加载失败，将使用本地缓存',
          icon: 'none',
          duration: 2000
        });
      } else {
        console.log('所有数据加载成功');
      }
      
      // 同步本地修改
      if (isOnline) {
        this.syncLocalChanges();
      }
      
      return {
        status: 'success',
        results: results
      };
    } catch (error) {
      console.error('预加载数据失败:', error);
      
      wx.hideLoading();
      
      return {
        status: 'error',
        error: error.message,
        isOfflineData: true
      };
    }
  }
  
  /**
   * 生成默认本地数据
   * 用于首次使用应用时，创建基本的本地缓存数据
   */
  generateDefaultLocalData() {
    // 默认商品数据
    const defaultProducts = [
      {
        id: 'local_1',
        name: '新鲜番茄',
        price: 5.99,
        description: '本地种植的新鲜番茄，无农药，绿色健康',
        image: '/images/products/tomato.jpg',
        category: '蔬果生鲜',
        stock: 100,
        sales: 50,
        createdAt: new Date().toISOString(),
        status: 'active',
        merchant: 'local'
      },
      {
        id: 'local_2',
        name: '有机黄瓜',
        price: 3.99,
        description: '绿色种植的有机黄瓜，脆嫩多汁',
        image: '/images/products/cucumber.jpg',
        category: '蔬果生鲜',
        stock: 80,
        sales: 30,
        createdAt: new Date().toISOString(),
        status: 'active',
        merchant: 'local'
      },
      {
        id: 'local_3',
        name: '新鲜土豆',
        price: 2.99,
        description: '农家自种土豆，口感绵软，营养丰富',
        image: '/images/products/potato.jpg',
        category: '蔬果生鲜',
        stock: 150,
        sales: 70,
        createdAt: new Date().toISOString(),
        status: 'active',
        merchant: 'local'
      }
    ];
    
    // 默认政策数据
    const defaultPolicies = [
      {
        id: 'policy_1',
        title: '农业补贴政策2023',
        summary: '关于2023年农业补贴政策的最新通知',
        content: '为了促进农业发展，国家将在2023年实施新的农业补贴政策，包括种粮补贴、农机购置补贴等多项措施...',
        publishedAt: new Date().toISOString(),
        author: '农业农村部',
        category: '政策通知'
      },
      {
        id: 'policy_2',
        title: '农产品质量安全标准',
        summary: '最新农产品质量安全标准与检测规范',
        content: '为保障消费者健康，提高农产品质量，特制定本标准。本标准规定了农产品生产、加工、流通等环节的质量安全要求...',
        publishedAt: new Date(Date.now() - 86400000).toISOString(), // 一天前
        author: '市场监管总局',
        category: '标准规范'
      }
    ];
    
    // 默认农户故事数据
    const defaultFarmerStories = [
      {
        id: 'story_1',
        title: '从贫困到致富的蔬菜种植之路',
        farmer: '张大山',
        location: '河北省石家庄市晋州县',
        summary: '张大山通过科学种植蔬菜，走上了致富之路',
        content: '张大山是河北省石家庄市晋州县的一名普通农民。十年前，他还是当地的贫困户，家里收入微薄。2013年，他开始接触设施农业，学习科学种植技术。经过几年的摸索，他掌握了反季节蔬菜种植技术，建起了自己的蔬菜大棚...',
        images: ['/images/stories/farmer1_1.jpg', '/images/stories/farmer1_2.jpg'],
        video: '/videos/stories/farmer1.mp4',
        publishedAt: new Date().toISOString(),
        likes: 256,
        views: 1024
      },
      {
        id: 'story_2',
        title: '返乡创业的大学生果农',
        farmer: '李小燕',
        location: '陕西省延安市洛川县',
        summary: '大学毕业后返乡种植苹果，带动村民共同致富',
        content: '李小燕，30岁，陕西农业大学毕业生。2018年大学毕业后，她没有选择留在城市，而是回到了家乡陕西省延安市洛川县。利用自己所学的农业知识，她开始经营家里的苹果园，引进新品种，应用现代种植技术...',
        images: ['/images/stories/farmer2_1.jpg', '/images/stories/farmer2_2.jpg'],
        video: '/videos/stories/farmer2.mp4',
        publishedAt: new Date(Date.now() - 172800000).toISOString(), // 两天前
        likes: 198,
        views: 876
      }
    ];
    
    // 保存到本地缓存
    this.localCache.products = defaultProducts;
    this.localCache.policies = defaultPolicies;
    this.localCache.farmerStories = defaultFarmerStories;
    
    wx.setStorageSync('local_products', JSON.stringify(defaultProducts));
    wx.setStorageSync('local_policies', JSON.stringify(defaultPolicies));
    wx.setStorageSync('local_farmer_stories', JSON.stringify(defaultFarmerStories));
    
    console.log('已生成默认本地数据');
    
    return {
      status: 'success',
      message: '默认数据已生成'
    };
  }
}

// 创建全局连接器实例
const miniappConnector = new MiniappConnector();

// 导出供小程序使用
module.exports = miniappConnector; 