const newsDB = require('../../../database/news');
const userDB = require('../../../database/users');

Page({
  data: {
    news: null,
    collected: false
  },

  onLoad(options) {
    const news = newsDB.find({ id: parseInt(options.id) })[0];
    if (news) {
      this.setData({
        news: {
          ...news,
          collected: userDB.checkCollection('current_user', news.id)
        }
      });
      this._recordView(news.id);
    } else {
      wx.navigateBack();
    }
  },

  _recordView(id) {
    newsDB.update(id, {
      views: { $inc: 1 }
    });
  },

  toggleCollect() {
    const collections = userDB.toggleCollection('current_user', this.data.news.id);
    this.setData({
      'news.collected': collections.includes(this.data.news.id)
    });
  }
}); 