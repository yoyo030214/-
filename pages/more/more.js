Page({
  data: {
    // 分类数据
    categories: [
      { id: 0, name: '全部', active: true, icon: '/images/icons/all.webp', desc: '全部农产品' },
      { id: 1, name: '蔬', active: false, icon: '/images/icons/vegetable.webp', desc: '新鲜蔬菜' },
      { id: 2, name: '果', active: false, icon: '/images/icons/fruit.webp', desc: '时令水果' },
      { id: 3, name: '生', active: false, icon: '/images/icons/grain.webp', desc: '粮油杂粮' },
      { id: 4, name: '鲜', active: false, icon: '/images/icons/seafood.webp', desc: '水产海鲜' }
    ],
    // 当前选中的分类
    currentCategory: '全部',
    // 产品数据
    products: [],
    // 所有产品数据
    allProducts: [],
    // 加载状态
    isLoading: true,
    // 排序方式
    sortOptions: [
      { id: 1, name: '默认排序', active: true },
      { id: 2, name: '价格从低到高', active: false },
      { id: 3, name: '价格从高到低', active: false }
    ],
    currentSort: '默认排序',
    showSortOptions: false,
    // 显示分类图标
    showCategoryIcons: true,
    // 页面标题
    pageTitle: '蔬果生鲜',
    // 蔬菜产品
    vegetableProducts: [
      { id: 1, name: '咸宁白菜', image: '/images/products/cabbage.webp', wholesalePrice: '2.5', marketPrice: '3.5', unit: '斤', sales: 235, category: '蔬' },
      { id: 2, name: '咸宁萝卜', image: '/images/products/radish.webp', wholesalePrice: '1.8', marketPrice: '2.5', unit: '斤', sales: 189, category: '蔬' },
      { id: 9, name: '咸宁青椒', image: '/images/products/pepper.webp', wholesalePrice: '3.2', marketPrice: '4.0', unit: '斤', sales: 156, category: '蔬' },
      { id: 10, name: '咸宁茄子', image: '/images/products/eggplant.webp', wholesalePrice: '2.8', marketPrice: '3.8', unit: '斤', sales: 142, category: '蔬' }
    ],
    // 水果产品
    fruitProducts: [
      { id: 3, name: '咸宁脐橙', image: '/images/products/orange.webp', wholesalePrice: '3.0', marketPrice: '4.5', unit: '斤', sales: 321, category: '果' },
      { id: 4, name: '咸宁蜜桃', image: '/images/products/peach.webp', wholesalePrice: '5.0', marketPrice: '6.5', unit: '斤', sales: 278, category: '果' },
      { id: 11, name: '咸宁猕猴桃', image: '/images/products/kiwi.webp', wholesalePrice: '6.5', marketPrice: '8.0', unit: '斤', sales: 198, category: '果' },
      { id: 12, name: '咸宁葡萄', image: '/images/products/grape.webp', wholesalePrice: '4.5', marketPrice: '6.0', unit: '斤', sales: 210, category: '果' }
    ],
    // 粮油杂粮产品
    grainProducts: [
      { id: 5, name: '咸宁大米', image: '/images/products/rice.webp', wholesalePrice: '3.5', marketPrice: '4.5', unit: '斤', sales: 456, category: '生' },
      { id: 6, name: '咸宁玉米', image: '/images/products/corn.webp', wholesalePrice: '2.0', marketPrice: '3.0', unit: '斤', sales: 345, category: '生' },
      { id: 13, name: '咸宁花生', image: '/images/products/peanut.webp', wholesalePrice: '5.5', marketPrice: '7.0', unit: '斤', sales: 167, category: '生' },
      { id: 14, name: '咸宁红豆', image: '/images/products/redbean.webp', wholesalePrice: '6.0', marketPrice: '7.5', unit: '斤', sales: 132, category: '生' }
    ],
    // 水产海鲜产品
    seafoodProducts: [
      { id: 7, name: '咸宁草鱼', image: '/images/products/fish.webp', wholesalePrice: '8.0', marketPrice: '10.0', unit: '斤', sales: 178, category: '鲜' },
      { id: 8, name: '咸宁虾', image: '/images/products/shrimp.webp', wholesalePrice: '15.0', marketPrice: '18.0', unit: '斤', sales: 145, category: '鲜' },
      { id: 15, name: '咸宁螃蟹', image: '/images/products/crab.webp', wholesalePrice: '25.0', marketPrice: '30.0', unit: '斤', sales: 98, category: '鲜' },
      { id: 16, name: '咸宁鲫鱼', image: '/images/products/crucian.webp', wholesalePrice: '10.0', marketPrice: '12.5', unit: '斤', sales: 123, category: '鲜' }
    ]
  },

  // 页面加载
  onLoad(options) {
    // 尝试将URL参数打印出来以便调试
    console.log('接收到的参数:', options);
    
    // 使用更安全的方式获取分类参数
    let category = '全部';
    if (options && options.category) {
      category = decodeURIComponent(options.category);
    }
    
    console.log('当前分类:', category);
    
    this.setData({
      currentCategory: category,
      categories: this.data.categories.map(item => ({
        ...item,
        active: item.name === category
      }))
    });
    
    // 预加载常用图片
    this.preloadImages([
      '/images/default_product.webp',
      '/images/default_icon.webp'
    ]);
    
    // 加载所有产品数据
    this.loadAllProducts();
  },

  // 预加载图片方法
  preloadImages(urls) {
    if (urls && urls.length) {
      urls.forEach(url => {
        const image = { src: url };
        wx.getImageInfo({
          src: url,
          success: () => console.log(`预加载图片成功: ${url}`),
          fail: () => console.warn(`预加载图片失败: ${url}`)
        });
      });
    }
  },

  // 加载所有产品数据
  loadAllProducts() {
    // 显示加载状态
    this.setData({ isLoading: true });
    
    // 模拟加载延迟
    setTimeout(() => {
      try {
        // 模拟咸宁本地产品数据
        const mockData = {
          蔬: [
            { id: 1, name: '咸宁白菜', image: '/images/products/cabbage.webp', wholesalePrice: '2.5', marketPrice: '3.5', unit: '斤', sales: 235, category: '蔬' },
            { id: 2, name: '咸宁萝卜', image: '/images/products/radish.webp', wholesalePrice: '1.8', marketPrice: '2.5', unit: '斤', sales: 189, category: '蔬' },
            { id: 9, name: '咸宁青椒', image: '/images/products/pepper.webp', wholesalePrice: '3.2', marketPrice: '4.0', unit: '斤', sales: 156, category: '蔬' },
            { id: 10, name: '咸宁茄子', image: '/images/products/eggplant.webp', wholesalePrice: '2.8', marketPrice: '3.8', unit: '斤', sales: 142, category: '蔬' }
          ],
          果: [
            { id: 3, name: '咸宁脐橙', image: '/images/products/orange.webp', wholesalePrice: '3.0', marketPrice: '4.5', unit: '斤', sales: 321, category: '果' },
            { id: 4, name: '咸宁蜜桃', image: '/images/products/peach.webp', wholesalePrice: '5.0', marketPrice: '6.5', unit: '斤', sales: 278, category: '果' },
            { id: 11, name: '咸宁猕猴桃', image: '/images/products/kiwi.webp', wholesalePrice: '6.5', marketPrice: '8.0', unit: '斤', sales: 198, category: '果' },
            { id: 12, name: '咸宁葡萄', image: '/images/products/grape.webp', wholesalePrice: '4.5', marketPrice: '6.0', unit: '斤', sales: 210, category: '果' }
          ],
          生: [
            { id: 5, name: '咸宁大米', image: '/images/products/rice.webp', wholesalePrice: '3.5', marketPrice: '4.5', unit: '斤', sales: 456, category: '生' },
            { id: 6, name: '咸宁玉米', image: '/images/products/corn.webp', wholesalePrice: '2.0', marketPrice: '3.0', unit: '斤', sales: 345, category: '生' },
            { id: 13, name: '咸宁花生', image: '/images/products/peanut.webp', wholesalePrice: '5.5', marketPrice: '7.0', unit: '斤', sales: 167, category: '生' },
            { id: 14, name: '咸宁红豆', image: '/images/products/redbean.webp', wholesalePrice: '6.0', marketPrice: '7.5', unit: '斤', sales: 132, category: '生' }
          ],
          鲜: [
            { id: 7, name: '咸宁草鱼', image: '/images/products/fish.webp', wholesalePrice: '8.0', marketPrice: '10.0', unit: '斤', sales: 178, category: '鲜' },
            { id: 8, name: '咸宁虾', image: '/images/products/shrimp.webp', wholesalePrice: '15.0', marketPrice: '18.0', unit: '斤', sales: 145, category: '鲜' },
            { id: 15, name: '咸宁螃蟹', image: '/images/products/crab.webp', wholesalePrice: '25.0', marketPrice: '30.0', unit: '斤', sales: 98, category: '鲜' },
            { id: 16, name: '咸宁鲫鱼', image: '/images/products/crucian.webp', wholesalePrice: '10.0', marketPrice: '12.5', unit: '斤', sales: 123, category: '鲜' }
          ]
        };
        
        // 检查是否所有分类数据都存在
        if (!mockData.蔬 || !mockData.果 || !mockData.生 || !mockData.鲜) {
          console.error('数据结构不完整');
          throw new Error('数据结构不完整');
        }
        
        // 合并所有产品
        const allProducts = [
          ...mockData.蔬,
          ...mockData.果,
          ...mockData.生,
          ...mockData.鲜
        ];
        
        console.log('所有产品数量:', allProducts.length);
        
        // 保存所有产品
        this.setData({ allProducts: allProducts });
        
        // 根据当前分类筛选产品
        this.filterProductsByCategory(this.data.currentCategory);
      } catch (error) {
        console.error('加载产品数据失败:', error);
        this.setData({ 
          isLoading: false,
          products: []
        });
        
        wx.showToast({
          title: '加载数据失败',
          icon: 'none'
        });
      }
    }, 500);
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      categories: this.data.categories.map(item => ({
        ...item,
        active: item.name === category
      })),
      isLoading: true
    });
    
    // 根据分类筛选产品
    this.filterProductsByCategory(category);
  },
  
  // 根据分类筛选产品
  filterProductsByCategory(category) {
    setTimeout(() => {
      let filteredProducts = [];
      
      if (category === '全部') {
        // 显示所有产品
        filteredProducts = [...this.data.allProducts];
      } else {
        // 根据分类筛选
        filteredProducts = this.data.allProducts.filter(item => item.category === category);
      }
      
      // 根据排序方式排序
      filteredProducts = this.sortProducts(filteredProducts, this.data.currentSort);
      
      this.setData({
        products: filteredProducts,
        isLoading: false
      });
    }, 300);
  },
  
  // 排序产品
  sortProducts(products, sortType) {
    let sortedProducts = [...products];
    switch(sortType) {
      case '价格从低到高':
        sortedProducts.sort((a, b) => parseFloat(a.wholesalePrice) - parseFloat(b.wholesalePrice));
        break;
      case '价格从高到低':
        sortedProducts.sort((a, b) => parseFloat(b.wholesalePrice) - parseFloat(a.wholesalePrice));
        break;
      default:
        // 默认排序，按销量排序
        sortedProducts.sort((a, b) => b.sales - a.sales);
    }
    return sortedProducts;
  },
  
  // 显示排序选项
  showSort() {
    this.setData({
      showSortOptions: true
    });
  },
  
  // 隐藏排序选项
  hideSort() {
    this.setData({
      showSortOptions: false
    });
  },
  
  // 选择排序方式
  selectSort(e) {
    const sort = e.currentTarget.dataset.sort;
    this.setData({
      currentSort: sort,
      sortOptions: this.data.sortOptions.map(item => ({
        ...item,
        active: item.name === sort
      })),
      showSortOptions: false,
      isLoading: true
    });
    
    // 重新排序产品
    setTimeout(() => {
      const products = this.sortProducts(this.data.products, sort);
      this.setData({
        products: products,
        isLoading: false
      });
    }, 300);
  },
  
  // 查看产品详情
  viewProductDetail(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product/detail?id=${productId}&category=${this.data.currentCategory}`
    });
  },
  
  // 添加到购物车
  addToCart(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find(item => item.id === productId);
    
    // 这里可以添加购物车逻辑
    wx.showToast({
      title: `已添加 ${product.name} 到购物车`,
      icon: 'success'
    });
  },
  
  // 分享
  onShareAppMessage() {
    return {
      title: `咸宁本地${this.data.currentCategory === '全部' ? '农产品' : this.data.currentCategory + '类农产品'}`,
      path: `/pages/more/more?category=${this.data.currentCategory}`
    };
  },
  
  // 处理图片加载错误
  handleImageError(e) {
    const defaultImage = '/images/default_product.webp'; // 默认图片路径
    const dataset = e.currentTarget.dataset;
    const index = dataset.index;
    
    // 创建新的products数组，避免直接修改数组内的对象
    const updatedProducts = [...this.data.products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      image: defaultImage
    };
    
    this.setData({
      products: updatedProducts
    });
    
    console.warn(`产品图片加载失败，已替换为默认图片。索引: ${index}, 产品名: ${updatedProducts[index].name}`);
  },
  
  // 处理图标加载错误
  handleIconError(e) {
    const defaultIcon = '/images/default_icon.webp'; // 默认图标路径
    const index = e.currentTarget.dataset.index;
    
    // 创建新的分类数组副本
    const updatedCategories = [...this.data.categories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      icon: defaultIcon
    };
    
    this.setData({
      categories: updatedCategories
    });
    
    console.warn(`分类图标加载失败，已替换为默认图标。索引: ${index}, 分类名: ${this.data.categories[index].name}`);
  },
  
  // 切换分类图标显示
  toggleCategoryIcons() {
    this.setData({
      showCategoryIcons: !this.data.showCategoryIcons
    });
  }
}); 