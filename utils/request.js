const config = require('./config');

const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(config.storage.tokenKey);
    
    wx.request({
      url: `${config.baseUrl}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res);
        } else if (res.statusCode === 401) {
          // token 过期，需要重新登录
          wx.removeStorageSync(config.storage.tokenKey);
          wx.removeStorageSync(config.storage.userInfoKey);
          getApp().login().then(resolve).catch(reject);
        } else {
          reject(res);
        }
      },
      fail: reject
    });
  });
};

module.exports = {
  request
}; 