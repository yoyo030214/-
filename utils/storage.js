const config = require('./config');
const util = require('./util');

// 错误处理函数
const handleError = (error) => {
  console.error('存储错误:', error);
  util.showError('存储操作失败');
  return null;
};

// 缓存管理工具
const storage = {
  // 设置缓存
  set(key, data, expire = 0) {
    try {
      const cache = {
        data,
        expire: expire ? Date.now() + expire * 1000 : 0
      };
      wx.setStorageSync(key, JSON.stringify(cache));
      return true;
    } catch (error) {
      if (error.errMsg && error.errMsg.includes('storage limit')) {
        // 存储空间不足,尝试清理过期数据
        this.clearExpired();
        // 重试存储
        try {
          const cache = {
            data,
            expire: expire ? Date.now() + expire * 1000 : 0
          };
          wx.setStorageSync(key, JSON.stringify(cache));
          return true;
        } catch (retryError) {
          return handleError(retryError);
        }
      }
      return handleError(error);
    }
  },

  // 获取缓存
  get(key) {
    try {
      const cache = wx.getStorageSync(key);
      if (!cache) return null;
      
      const { data, expire } = JSON.parse(cache);
      if (expire && expire < Date.now()) {
        this.remove(key);
        return null;
      }
      return data;
    } catch (error) {
      if (error.errMsg && error.errMsg.includes('parse')) {
        // JSON解析失败,删除无效数据
        this.remove(key);
      }
      return handleError(error);
    }
  },

  // 移除缓存
  remove(key) {
    try {
      wx.removeStorageSync(key);
      return true;
    } catch (error) {
      return handleError(error);
    }
  },

  // 清空缓存
  clear() {
    try {
      wx.clearStorageSync();
      return true;
    } catch (error) {
      return handleError(error);
    }
  },

  // 清理过期数据
  clearExpired() {
    try {
      const keys = wx.getStorageInfoSync().keys;
      keys.forEach(key => {
        const cache = wx.getStorageSync(key);
        if (cache) {
          try {
            const { expire } = JSON.parse(cache);
            if (expire && expire < Date.now()) {
              wx.removeStorageSync(key);
            }
          } catch (error) {
            // 解析失败,删除无效数据
            wx.removeStorageSync(key);
          }
        }
      });
      return true;
    } catch (error) {
      return handleError(error);
    }
  },

  // 获取token
  getToken() {
    return this.get(config.storage.tokenKey);
  },

  // 设置token
  setToken(token, expire = 7200) {
    return this.set(config.storage.tokenKey, token, expire);
  },

  // 移除token
  removeToken() {
    return this.remove(config.storage.tokenKey);
  },

  // 获取用户信息
  getUserInfo() {
    return this.get(config.storage.userInfoKey);
  },

  // 设置用户信息
  setUserInfo(info) {
    return this.set(config.storage.userInfoKey, info);
  },

  // 移除用户信息
  removeUserInfo() {
    return this.remove(config.storage.userInfoKey);
  },

  // 获取购物车
  getCart() {
    return this.get(config.storage.cartKey) || [];
  },

  // 设置购物车
  setCart(cart) {
    return this.set(config.storage.cartKey, cart);
  },

  // 移除购物车
  removeCart() {
    return this.remove(config.storage.cartKey);
  }
};

module.exports = storage; 