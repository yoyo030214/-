const config = require('../config/api');

class DeepSeekService {
  constructor() {
    this.config = config.deepseek;
    console.log('DeepSeek配置:', JSON.stringify({
      baseUrl: this.config.baseUrl,
      endpoints: this.config.endpoints,
      apiKeyLength: this.config.apiKey ? this.config.apiKey.length : 0
    }));
  }

  async chat(prompt, options = {}) {
    // 兼容单字符串和结构化消息
    let messages = options.messages || [];
    
    if (!messages.length && prompt) {
      messages = [{ role: 'user', content: prompt }];
    }
    
    return this._request('chat', {
      model: options.model || 'deepseek-v3',
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 500
    });
  }

  async _request(endpoint, data) {
    const url = `${this.config.baseUrl}${this.config.endpoints[endpoint]}`;
    
    console.log(`准备向 ${url} 发送请求`);
    console.log('请求数据:', JSON.stringify(data));
    
    try {
      console.log('发起请求...');
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          data,
          success: res => {
            console.log('请求成功, 状态码:', res.statusCode);
            if (res.statusCode !== 200) {
              console.error('API请求失败, 状态码:', res.statusCode);
              console.error('错误响应:', JSON.stringify(res.data));
              reject({ 
                statusCode: res.statusCode,
                errMsg: `API请求失败: ${res.statusCode}`,
                data: res.data
              });
            } else {
              resolve(res.data);
            }
          },
          fail: err => {
            console.error('请求失败:', err);
            reject({
              errMsg: err.errMsg || '请求失败',
              code: 'NETWORK_ERROR'
            });
          }
        });
      });

      console.log('处理响应...');
      console.log('响应数据:', JSON.stringify(response));
      
      // 检查响应是否有效
      if (!response || !response.choices || !response.choices.length) {
        console.error('无效响应结构:', response);
        throw new Error('API返回无效响应');
      }
      
      return response;
    } catch (error) {
      console.error('DeepSeek API调用错误:', error);
      throw error;
    }
  }
}

module.exports = new DeepSeekService(); 