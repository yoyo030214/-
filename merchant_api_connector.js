/**
 * 商家管理系统API连接器
 * 用于连接现有前端界面与后端API
 */

class MerchantApiConnector {
  constructor(baseUrl = 'http://localhost:5000/api') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('merchant_token') || null;
    this.user = JSON.parse(localStorage.getItem('merchant_user') || 'null');
    
    // 绑定事件监听器，当收到消息时更新通知
    this.setupEventListeners();
  }

  /**
   * 设置请求头
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = this.token;
    }
    
    return headers;
  }

  /**
   * 设置表单请求头（用于上传文件）
   */
  getFormHeaders() {
    const headers = {};
    
    if (this.token) {
      headers['Authorization'] = this.token;
    }
    
    return headers;
  }

  /**
   * 处理响应
   */
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  }

  /**
   * 登录
   * @param {string} username 用户名
   * @param {string} password 密码
   */
  async login(username, password) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ username, password })
      });
      
      const data = await this.handleResponse(response);
      
      // 保存token和用户信息
      this.token = data.token;
      this.user = data.user;
      
      localStorage.setItem('merchant_token', this.token);
      localStorage.setItem('merchant_user', JSON.stringify(this.user));
      
      // 触发登录成功事件
      this.triggerEvent('login-success', this.user);
      
      return data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  /**
   * 注销
   */
  async logout() {
    try {
      if (!this.token) {
        throw new Error('未登录状态');
      }
      
      const response = await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers: this.getHeaders()
      });
      
      await this.handleResponse(response);
      
      // 清除本地存储
      this.token = null;
      this.user = null;
      localStorage.removeItem('merchant_token');
      localStorage.removeItem('merchant_user');
      
      // 触发登出成功事件
      this.triggerEvent('logout-success');
      
      return { status: 'success', message: '已成功登出' };
    } catch (error) {
      console.error('登出失败:', error);
      throw error;
    }
  }

  /**
   * 注册
   * @param {string} username 用户名
   * @param {string} password 密码
   */
  async register(username, password) {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ username, password })
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser() {
    try {
      if (!this.token) {
        throw new Error('未登录状态');
      }
      
      const response = await fetch(`${this.baseUrl}/users/current`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await this.handleResponse(response);
      
      // 更新本地用户信息
      this.user = data.data;
      localStorage.setItem('merchant_user', JSON.stringify(this.user));
      
      return data;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取商品列表
   */
  async getProducts() {
    try {
      if (!this.token) {
        throw new Error('未登录状态');
      }
      
      const response = await fetch(`${this.baseUrl}/products`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await this.handleResponse(response);
      
      // 触发商品列表更新事件
      this.triggerEvent('products-updated', data.data);
      
      return data;
    } catch (error) {
      console.error('获取商品列表失败:', error);
      throw error;
    }
  }

  /**
   * 添加商品
   * @param {Object} productData 商品数据
   * @param {File} imageFile 商品图片文件
   */
  async addProduct(productData, imageFile) {
    try {
      if (!this.token) {
        throw new Error('未登录状态');
      }
      
      // 使用FormData处理文件上传
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('price', productData.price);
      formData.append('description', productData.description || '');
      formData.append('image', imageFile);
      
      const response = await fetch(`${this.baseUrl}/products`, {
        method: 'POST',
        headers: this.getFormHeaders(),
        body: formData
      });
      
      const data = await this.handleResponse(response);
      
      // 触发商品添加成功事件
      this.triggerEvent('product-added', data.data);
      
      return data;
    } catch (error) {
      console.error('添加商品失败:', error);
      throw error;
    }
  }

  /**
   * 更新商品
   * @param {string} productId 商品ID
   * @param {Object} productData 商品数据
   * @param {File} imageFile 商品图片文件（可选）
   */
  async updateProduct(productId, productData, imageFile = null) {
    try {
      if (!this.token) {
        throw new Error('未登录状态');
      }
      
      // 使用FormData处理文件上传
      const formData = new FormData();
      
      if (productData.name !== undefined) {
        formData.append('name', productData.name);
      }
      
      if (productData.price !== undefined) {
        formData.append('price', productData.price);
      }
      
      if (productData.description !== undefined) {
        formData.append('description', productData.description);
      }
      
      if (productData.status !== undefined) {
        formData.append('status', productData.status);
      }
      
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      const response = await fetch(`${this.baseUrl}/products/${productId}`, {
        method: 'PUT',
        headers: this.getFormHeaders(),
        body: formData
      });
      
      const data = await this.handleResponse(response);
      
      // 触发商品更新成功事件
      this.triggerEvent('product-updated', data.data);
      
      return data;
    } catch (error) {
      console.error('更新商品失败:', error);
      throw error;
    }
  }

  /**
   * 删除商品
   * @param {string} productId 商品ID
   */
  async deleteProduct(productId) {
    try {
      if (!this.token) {
        throw new Error('未登录状态');
      }
      
      const response = await fetch(`${this.baseUrl}/products/${productId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      const data = await this.handleResponse(response);
      
      // 触发商品删除成功事件
      this.triggerEvent('product-deleted', { productId });
      
      return data;
    } catch (error) {
      console.error('删除商品失败:', error);
      throw error;
    }
  }

  /**
   * 获取通知
   * @param {number} page 页码
   * @param {number} pageSize 每页数量
   */
  async getNotifications(page = 1, pageSize = 10) {
    try {
      if (!this.token) {
        throw new Error('未登录状态');
      }
      
      const response = await fetch(`${this.baseUrl}/notifications?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await this.handleResponse(response);
      
      // 触发通知更新事件
      this.triggerEvent('notifications-updated', data);
      
      return data;
    } catch (error) {
      console.error('获取通知失败:', error);
      throw error;
    }
  }

  /**
   * 获取统计数据
   */
  async getStatistics() {
    try {
      if (!this.token) {
        throw new Error('未登录状态');
      }
      
      const response = await fetch(`${this.baseUrl}/statistics`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await this.handleResponse(response);
      
      // 触发统计数据更新事件
      this.triggerEvent('statistics-updated', data.data);
      
      return data;
    } catch (error) {
      console.error('获取统计数据失败:', error);
      throw error;
    }
  }

  /**
   * 检查登录状态，如果还有有效token则自动恢复会话
   */
  async checkLoginStatus() {
    if (!this.token) {
      return false;
    }
    
    try {
      // 尝试获取当前用户信息，验证token是否有效
      await this.getCurrentUser();
      return true;
    } catch (error) {
      // token无效，清除登录状态
      this.token = null;
      this.user = null;
      localStorage.removeItem('merchant_token');
      localStorage.removeItem('merchant_user');
      return false;
    }
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 这里可以添加WebSocket连接来获取实时通知
    // 简化起见，我们使用轮询方式
    this.notificationInterval = null;
  }

  /**
   * 开始通知轮询
   * @param {number} interval 轮询间隔(毫秒)
   */
  startNotificationPolling(interval = 10000) {
    // 清除现有的轮询
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
    
    // 立即获取一次通知
    this.getNotifications();
    
    // 设置定时获取
    this.notificationInterval = setInterval(() => {
      if (this.token) {
        this.getNotifications();
      } else {
        // 如果用户已登出，停止轮询
        this.stopNotificationPolling();
      }
    }, interval);
  }

  /**
   * 停止通知轮询
   */
  stopNotificationPolling() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
      this.notificationInterval = null;
    }
  }

  /**
   * 触发自定义事件
   * @param {string} eventName 事件名称
   * @param {any} data 事件数据
   */
  triggerEvent(eventName, data = null) {
    const event = new CustomEvent(eventName, { 
      detail: { data } 
    });
    document.dispatchEvent(event);
  }
}

// 创建全局API连接器实例
const merchantApi = new MerchantApiConnector();

// 在页面加载完成后自动检查登录状态
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const isLoggedIn = await merchantApi.checkLoginStatus();
    if (isLoggedIn) {
      // 用户已登录，开始通知轮询
      merchantApi.startNotificationPolling();
      
      // 触发已登录事件，前端可以根据此事件显示对应界面
      merchantApi.triggerEvent('already-logged-in', merchantApi.user);
    } else {
      // 用户未登录，触发未登录事件
      merchantApi.triggerEvent('not-logged-in');
    }
  } catch (error) {
    console.error('检查登录状态失败:', error);
  }
}); 