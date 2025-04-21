const POLICY_TYPES = {
  planting: { color: '#1677ff', name: '种植补贴' },
  machinery: { color: '#fa8c16', name: '农机补贴' },
  animal: { color: '#52c41a', name: '畜牧扶持' },
  industry: { color: '#722ed1', name: '产业振兴' },
  land: { color: '#13c2c2', name: '耕地保护' },
  green: { color: '#a0d911', name: '绿色农业' }
};

const { getPolicies } = require('../../utils/policies')

Page({
  data: {
    loading: true,
    dashboardItems: [
      { type: 'total', label: '累计政策', value: 0 },
      { type: 'valid', label: '有效政策', value: 0 },
      { type: 'hot', label: '本月热门', value: 0 }
    ],
    categories: [
      { id: 0, type: 'latest', name: '最新政策' },
      { id: 1, type: 'planting', name: '种植补贴' },
      { id: 2, type: 'machinery', name: '农机补贴' },
      { id: 3, type: 'animal', name: '畜牧扶持' }
    ],
    policies: [],
    filteredPolicies: [],
    activeCategory: 0,
    promotions: [
      {
        id: 1,
        title: '助农采摘节活动',
        description: '为促进农产品销售，提高农民收入，特举办助农采摘节...',
        type: 'event',
        image: '/images/policy/助农采摘节.webp',
        date: '2023-04-15',
        location: '咸宁市郊区果园基地',
        organizer: '咸宁市农业农村局'
      },
      {
        id: 2,
        title: '乡村农产品展销会',
        description: '集中展示咸宁特色农产品，搭建农产品销售平台...',
        type: 'event',
        image: '/images/policy/乡村农产品展销会.webp',
        date: '2023-05-20',
        location: '咸宁市体育馆',
        organizer: '咸宁市商务局'
      }
    ],
    noMore: true,
    subCategories: {
      more: [
        {id: 6, name: '耕地保护', type: 'land'},
        {id: 7, name: '绿色农业', type: 'green'},
        {id: 8, name: '保险政策', type: 'insurance'},
        {id: 9, name: '金融支持', type: 'finance'}
      ]
    },
    allPolicies: [],
    page: 1,
    hasMore: true,
    showPromotions: true,
    showAll: false,
    policyList: [
      {
        id: 1,
        title: '乡村振兴政策解读',
        date: '2023-10-01',
        imageUrl: '/images/policy1.webp'
      },
      {
        id: 2,
        title: '农业补贴新政策',
        date: '2023-09-25',
        imageUrl: '/images/policy2.webp'
      }
      // 更多政策...
    ]
  },

  onLoad() {
    console.log('助农活动数据:', this.data.promotions);
    console.log('是否显示助农活动:', this.data.showPromotions);
    
    this.setData({
      showPromotions: true
    });
    
    console.log('设置后是否显示助农活动:', this.data.showPromotions);
    
    this.loadPolicies();
    const policies = this.generatePolicies().map(p => ({
      ...p,
      coverLoaded: false
    }));
    this.setData({ policies });
    this.loadNewPolicies();
  },

  async loadPolicies() {
    try {
      wx.showLoading({ title: '加载中...' })
      
      wx.request({
        url: 'http://175.178.80.222:3000/api/policies',
        method: 'GET',
        success: (res) => {
          const policies = res.data.map(p => ({
            ...p,
            collected: false,
            image: this.generatePolicyImage(p.type),
            coverLoaded: false
          }))

          this.setData({
            policies: this.data.page === 1 ? policies : [...this.data.policies, ...policies],
            hasMore: (this.data.page * 10) < res.total
          })
        }
      })

    } catch (e) {
      console.error('加载失败:', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
      this.setData({ loading: false })
      this.filterPolicies()
    }
  },

  generatePolicies() {
    return Array.from({length: 100}, (_,i) => {
      const type = this.getPolicyType(i);
      const detail = this.generatePolicyDetail(type, i);
      
      return {
        id: i + 1,
        type: type,
        title: `${detail.region}${detail.typeName}政策：${detail.keyPoint}`,
        summary: detail.summary,
        region: detail.region,
        date: this.getRandomDate(2023, 2024),
        validity: detail.validity,
        applicable: detail.applicable,
        tags: detail.tags,
        collected: false,
        image: `/图片/policies/${type}-${(i%5)+1}.webp`,
        coverLoaded: false,
        coverUrl: ''
      };
    });
  },

  // 显示政策详情
  showPolicyDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    const policy = this.data.policies.find(item => item.id === id);
    wx.showModal({
      title: policy.title,
      content: policy.summary,
      showCancel: false
    });
  },

  // 查看活动详情
  viewPromotion(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/promotion/promotion?id=${id}`
    });
  },

  // 查看全部当前政策
  viewAllPolicies() {
    wx.navigateTo({ 
      url: '/pages/policy/list/list?type=current'
    });
  },

  // 查看助农活动更多
  viewAllPromotions() {
    wx.navigateTo({ 
      url: '/pages/promotion/list/list?type=promotion'
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    // 刷新数据
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 }, () => {
        this.loadPolicies();
      });
    }
  },

  // 在loadPolicies方法中生成模拟数据
  async loadMorePolicies() {
    const newPolicies = await this.fetchPolicies(this.data.page);
    
    this.setData({
      allPolicies: [...this.data.allPolicies, ...newPolicies],
      hasMore: newPolicies.length > 0
    });
  },

  setDefaultImage(e) {
    const { dataset } = e.currentTarget;
    console.error('助农活动图片加载失败', e);
    
    // 使用默认图片替换
    const defaultImage = '/images/policy/default-policy.webp';
    
    if (dataset.field) {
      this.setData({
        [dataset.field]: defaultImage
      });
    }
  },

  onImageLoad(event) {
    wx.createSelectorQuery()
      .select(`#${event.currentTarget.id}`)
      .node()
      .exec((res) => {
        res[0].node.classList.add('loaded');
      });
  },

  handleImageLoad(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      [`policies[${index}].coverLoaded`]: true
    });
  },

  handleImageError(e) {
    const index = e.currentTarget.dataset.index;
    console.error('图片加载失败', e);
    this.setData({
      [`policies[${index}].image`]: '/images/policy/default-policy.webp'
    });
  },

  getLocalPolicyType() {
    const typeMap = {
      planting: 'planting',
      machinery: 'machinery',
      animal: 'animal',
      // 其他类型映射...
    }
    return typeMap[this.data.activeType] || null
  },

  generatePolicyImage(type) {
    // Implementation of generatePolicyImage method
  },

  getPolicyType(index) {
    const types = [
      'planting', 'machinery', 'animal', 
      'industry', 'land', 'green', 'insurance', 'finance'
    ];
    return types[index % types.length];
  },

  getRandomDate(startYear, endYear) {
    const start = new Date(startYear, 0, 1);
    const end = new Date(endYear, 11, 31);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
      .toISOString().split('T')[0];
  },

  // 修改switchCategory方法
  switchCategory(e) {
    const { id, type } = e.currentTarget.dataset;
    if (type === 'more') {
      this.showSubCategories();
      return;
    }
    
    this.setData({
      activeCategory: id,
      policyList: [],
      page: 1,
      hasMore: true
    }, () => this.loadPolicies());
  },

  // 显示子分类
  showSubCategories() {
    wx.showActionSheet({
      itemList: this.data.subCategories.more.map(item => item.name),
      success: (res) => {
        const selected = this.data.subCategories.more[res.tapIndex];
        this.setData({
          activeCategory: selected.id,
          policyList: [],
          page: 1,
          hasMore: true
        }, () => this.loadPolicies());
      }
    });
  },

  // 智能分类筛选
  filterPolicies() {
    const { activeCategory, categories } = this.data;
    const type = categories.find(c => c.id === activeCategory)?.type;
    
    const filtered = type === 'latest' 
      ? this.data.policies.sort((a,b) => new Date(b.date) - new Date(a.date))
      : this.data.policies.filter(p => p.type === type);
    
    this.setData({ filteredPolicies: filtered });
  },

  updateDashboard() {
    const validCount = this.data.allPolicies.filter(p => 
      new Date(p.publishDate) > new Date('2023-01-01')
    ).length;
    
    this.setData({
      dashboardItems: [
        { ...this.data.dashboardItems[0], value: this.data.allPolicies.length },
        { ...this.data.dashboardItems[1], value: validCount },
        { ...this.data.dashboardItems[2], value: Math.floor(Math.random() * 50) + 20 }
      ]
    });
  },

  getRandomType() {
    const types = ['planting', 'machinery', 'animal', 'industry', 'land', 'green'];
    return types[Math.floor(Math.random() * types.length)];
  },

  generatePolicyTitle(type, index) {
    const regions = ['湖北省', '湖南省', '江西省', '安徽省'];
    const crop = POLICY_TYPES[type].name;
    return `${regions[index % regions.length]}${crop}政策：${crop}种植补贴实施细则`;
  },

  generatePolicyContent(type, index) {
    const regions = ['湖北省', '湖南省', '江西省', '安徽省'];
    const crop = POLICY_TYPES[type].name;
    return `对${crop}种植户按实际种植面积给予每亩${Math.floor(Math.random() * (200 - 50)) + 50}元补贴，连片种植50亩以上额外奖励${Math.floor(Math.random() * (200 - 50) + 50 * 0.2)}元/亩...`;
  },

  getRandomRegion() {
    const regions = ['湖北省', '湖南省', '江西省', '安徽省'];
    return regions[Math.floor(Math.random() * regions.length)];
  },

  generateTags(type) {
    const tags = [POLICY_TYPES[type].name, '耕地保护', '直补到户'];
    return tags;
  },

  generateSummary(type, index) {
    const regions = ['湖北省', '湖南省', '江西省', '安徽省'];
    const crop = POLICY_TYPES[type].name;
    return `对${crop}种植户按实际种植面积给予每亩${Math.floor(Math.random() * (200 - 50)) + 50}元补贴，连片种植50亩以上额外奖励${Math.floor(Math.random() * (200 - 50) + 50 * 0.2)}元/亩...`;
  },

  toggleCollect(e) {
    const id = e.currentTarget.dataset.id;
    const policies = this.data.policies.map(p => 
      p.id === id ? { ...p, collected: !p.collected } : p
    );
    
    // 保存到本地
    wx.setStorageSync('collectedPolicies', 
      policies.filter(p => p.collected).map(p => p.id)
    );
    
    this.setData({ policies });
  },

  async fetchPolicies(page) {
    // Implementation of fetchPolicies method
  },

  // 加载最新政策
  loadNewPolicies() {
    const newPolicies = getPolicies('new', 1, 10).data;
    this.setData({ newPolicies });
  },

  // 查看最新政策更多
  viewNewPolicies() {
    wx.navigateTo({ url: '/pages/policy/list/list?type=new' });
  },

  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/policy/detail?id=${id}`
    });
  }
});
