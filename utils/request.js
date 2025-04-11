const config = require('./config');
const storage = require('./storage');
const util = require('./util');

// 请求拦截器
const requestInterceptors = [];
const responseInterceptors = [];

// 添加请求拦截器
const addRequestInterceptor = (interceptor) => {
  requestInterceptors.push(interceptor);
};

// 添加响应拦截器
const addResponseInterceptor = (interceptor) => {
  responseInterceptors.push(interceptor);
};

// 错误处理函数
const handleError = (error) => {
  console.error('请求错误:', error);
  util.showError(error.message || '请求失败');
  return Promise.reject(error);
};

// 检查网络状态
const checkNetwork = () => {
  return new Promise((resolve, reject) => {
    wx.getNetworkType({
      success: (res) => {
        if (res.networkType === 'none') {
          reject(new Error('网络连接已断开'));
        } else {
          resolve(res.networkType);
        }
      },
      fail: (error) => {
        reject(error);
      }
    });
  });
};

// 请求工具类
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 检查网络状态
    checkNetwork().catch(error => {
      handleError(error);
      return Promise.reject(error);
    });

    // 执行请求拦截器
    let requestOptions = { ...options };
    for (const interceptor of requestInterceptors) {
      requestOptions = interceptor(requestOptions);
    }

    const token = storage.getToken();
    
    // 显示加载提示
    util.showLoading('加载中...');
    
    // 设置超时
    const timeout = setTimeout(() => {
      util.hideLoading();
      handleError(new Error('请求超时'));
    }, config.api.timeout);
    
    wx.request({
      url: `${config.api.baseUrl}${requestOptions.url}`,
      method: requestOptions.method || 'GET',
      data: requestOptions.data,
      header: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...requestOptions.header
      },
      success: (res) => {
        // 清除超时定时器
        clearTimeout(timeout);
        
        // 隐藏加载提示
        util.hideLoading();
        
        // 执行响应拦截器
        let response = res;
        for (const interceptor of responseInterceptors) {
          response = interceptor(response);
        }
        
        if (response.statusCode === 200) {
          resolve(response.data);
        } else if (response.statusCode === 401) {
          // token过期,清除登录信息并跳转到登录页
          storage.removeToken();
          storage.removeUserInfo();
          util.showError('登录已过期,请重新登录');
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }, 1500);
          handleError(new Error('登录已过期'));
        } else {
          handleError(new Error(response.data.message || '请求失败'));
        }
      },
      fail: (err) => {
        // 清除超时定时器
        clearTimeout(timeout);
        
        // 隐藏加载提示
        util.hideLoading();
        handleError(new Error('网络错误'));
      }
    });
  });
};

module.exports = {
  request,
  addRequestInterceptor,
  addResponseInterceptor
}; 