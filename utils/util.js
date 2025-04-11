/**
 * 格式化时间
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = date => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`;
};

const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
};

/**
 * 格式化日期
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期字符串
 */
const formatDate = date => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${[year, month, day].map(formatNumber).join('-')}`;
};

/**
 * 格式化金额
 * @param {number} price 金额
 * @returns {string} 格式化后的金额字符串
 */
const formatPrice = price => {
  return (price / 100).toFixed(2);
};

/**
 * 防抖函数
 * @param {Function} fn 需要防抖的函数
 * @param {number} delay 延迟时间
 * @returns {Function} 防抖后的函数
 */
const debounce = (fn, delay = 500) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

/**
 * 节流函数
 * @param {Function} fn 需要节流的函数
 * @param {number} delay 延迟时间
 * @returns {Function} 节流后的函数
 */
const throttle = (fn, delay = 500) => {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last > delay) {
      fn.apply(this, args);
      last = now;
    }
  };
};

/**
 * 深拷贝
 * @param {Object} obj 需要拷贝的对象
 * @returns {Object} 拷贝后的对象
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [] : {};
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  return clone;
};

/**
 * 检查登录状态
 * @returns {boolean} 是否已登录
 */
const checkLogin = () => {
  const token = wx.getStorageSync('token');
  if (!token) {
    wx.navigateTo({
      url: '/pages/login/login'
    });
    return false;
  }
  return true;
};

/**
 * 显示成功提示
 * @param {string} title 提示标题
 */
const showSuccess = (title = '操作成功') => {
  wx.showToast({
    title,
    icon: 'success',
    duration: 2000
  });
};

/**
 * 显示错误提示
 * @param {string} title 提示标题
 */
const showError = (title = '操作失败') => {
  wx.showToast({
    title,
    icon: 'error',
    duration: 2000
  });
};

/**
 * 显示加载提示
 * @param {string} title 提示标题
 */
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title,
    mask: true
  });
};

/**
 * 隐藏加载提示
 */
const hideLoading = () => {
  wx.hideLoading();
};

// 工具函数库
const util = {
  // 格式化时间
  formatTime(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    return [year, month, day].map(this.formatNumber).join('/') + ' ' +
      [hour, minute, second].map(this.formatNumber).join(':');
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return [year, month, day].map(this.formatNumber).join('-');
  },

  // 格式化数字
  formatNumber(n) {
    n = n.toString();
    return n[1] ? n : `0${n}`;
  },

  // 格式化金额
  formatPrice(price) {
    return (price / 100).toFixed(2);
  },

  // 防抖函数
  debounce(func, wait = 500) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(this, args);
      }, wait);
    };
  },

  // 节流函数
  throttle(func, wait = 500) {
    let previous = 0;
    return function (...args) {
      let now = Date.now();
      if (now - previous > wait) {
        func.apply(this, args);
        previous = now;
      }
    };
  },

  // 深拷贝
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    const clone = Array.isArray(obj) ? [] : {};
    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clone[key] = this.deepClone(obj[key]);
      }
    }
    return clone;
  },

  // 检查登录状态
  checkLogin() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return false;
    }
    return true;
  },

  // 显示成功提示
  showSuccess(title = '操作成功') {
    wx.showToast({
      title,
      icon: 'success',
      duration: 2000
    });
  },

  // 显示错误提示
  showError(title = '操作失败') {
    wx.showToast({
      title,
      icon: 'error',
      duration: 2000
    });
  },

  // 显示加载提示
  showLoading(title = '加载中...') {
    wx.showLoading({
      title,
      mask: true
    });
  },

  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading();
  },

  // 检查手机号
  checkPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  },

  // 检查邮箱
  checkEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  },

  // 检查身份证号
  checkIdCard(idCard) {
    return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard);
  },

  // 生成随机字符串
  randomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // 获取文件扩展名
  getFileExt(filename) {
    return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
  },

  // 检查文件类型
  checkFileType(file, acceptTypes) {
    const ext = this.getFileExt(file.name);
    return acceptTypes.includes(ext);
  },

  // 检查文件大小
  checkFileSize(file, maxSize) {
    return file.size <= maxSize;
  }
};

module.exports = util; 