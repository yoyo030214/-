const newsDB = require('../../database/news');
const userDB = require('../../database/users');

Page({
  data: {
    newsList: [],
    loading: true,
    categories: [
      { id: 0, name: '全部', type: 'all' },
      { id: 1, name: '种植技术', type: 'planting' },
      { id: 2, name: '市场行情', type: 'market' },
      { id: 3, name: '政策解读', type: 'policy' }
    ],
    activeCategory: 0
  },

  onLoad() {
    this.loadNews();
  },

  loadNews() {
    const news = newsDB.find().map(item => ({
      ...item,
      cover: item.images[0] || '/images/news-default.jpg',
      collected: false
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    this.setData({
      newsList: news,
      loading: false
    });
  },

  // 切换分类
  switchCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({
      activeCategory: categoryId,
      loading: true
    }, () => this.filterNews());
  },

  // 筛选资讯
  filterNews() {
    const { activeCategory, categories } = this.data;
    const type = categories.find(c => c.id === activeCategory)?.type;
    
    const filtered = type === 'all' 
      ? newsDB.find() 
      : newsDB.find({ tags: [type] });
    
    this.setData({
      newsList: filtered.sort((a, b) => new Date(b.date) - new Date(a.date)),
      loading: false
    });
  },

  toggleCollect(e) {
    const newsId = e.currentTarget.dataset.id;
    const collections = userDB.toggleCollection('current_user', newsId);
    
    this.setData({
      newsList: this.data.newsList.map(item => ({
        ...item,
        collected: collections.includes(item.id)
      }))
    });
  },

  onSearch(e) {
    const keyword = e.detail.value.trim();
    const results = newsDB.find().filter(item =>
      item.title.includes(keyword) ||
      item.content.includes(keyword) ||
      item.tags.some(tag => tag.includes(keyword))
    );
    
    this.setData({
      newsList: results,
      isSearching: !!keyword
    });
  }
}); 