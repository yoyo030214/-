const newsDB = require('../../database/news');

Page({
  data: {
    rankings: []
  },

  onLoad() {
    const rankings = newsDB.find()
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
    
    this.setData({ rankings });
  }
}); 