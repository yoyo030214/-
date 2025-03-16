const LocalDB = require('./LocalDB');

class UserDB extends LocalDB {
  constructor() {
    super('users');
  }

  toggleCollection(userId, newsId) {
    const user = this.find({ id: userId })[0] || { id: userId, collections: [] };
    
    const index = user.collections.indexOf(newsId);
    if (index > -1) {
      user.collections.splice(index, 1);
    } else {
      user.collections.push(newsId);
    }
    
    this.update(userId, { collections: user.collections });
    return user.collections;
  }

  checkCollection(userId, newsId) {
    const user = this.find({ id: userId })[0];
    return user?.collections?.includes(newsId) || false;
  }
}

module.exports = new UserDB(); 