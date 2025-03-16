const { generateNews } = require('../utils/news_generator');
const LocalDB = require('./LocalDB');

class NewsDB extends LocalDB {
  constructor() {
    super('news');
    this.initSampleData();
    this.validateData();
  }

  initSampleData() {
    if (this.find().length === 0) {
      generateNews().forEach(news => this.insert(news));
    }
  }

  validateData() {
    const data = this.find();
    if (data.length !== 100) {
      console.error('数据异常，重新生成...');
      this.clear();
      this.initSampleData();
    }
  }

  clear() {
    this._writeData([]);
  }
}

module.exports = new NewsDB(); 