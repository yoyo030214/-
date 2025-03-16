const aiService = require('../../services/ai-service');
const { getAIResponse, getLocalReply, DEFAULT_RESPONSES } = aiService;

// 简化客服页面，不依赖外部AI服务
Page({
  data: {
    inputValue: '',
    messages: [],
    faqs: [
      { id: 1, question: '如何查看订单状态？', answer: '您可以在"我的订单"页面查看所有订单的状态和详情。' },
      { id: 2, question: '如何申请退款？', answer: '在订单详情页面，点击"申请退款"按钮，填写退款原因后提交即可。' },
      { id: 3, question: '如何修改收货地址？', answer: '您可以在"我的"-"地址管理"中添加或修改收货地址。' },
      { id: 4, question: '如何联系商家？', answer: '在订单详情页面，点击"联系卖家"即可与商家沟通。' }
    ],
    isLoading: false,
    errorMessage: '',
    showError: false,
    useAI: true, // 默认使用AI模式
    freeMode: true // 默认使用自由对话模式
  },

  onLoad() {
    console.log('客服页面加载...');
    console.log('AI服务:', aiService ? '已加载' : '未加载');
    
    try {
      // 显示欢迎消息
      this.addMessage('assistant', DEFAULT_RESPONSES.greeting);
      console.log('欢迎消息已添加');
      
      // 尝试加载历史消息
      // this.loadMessagesFromStorage();
      
      // 添加调试消息
      if (this.data.useAI && this.data.freeMode) {
        this.addMessage('system', '自由对话模式已启用，您可以向AI询问任何问题，DeepSeek API将不受限制地回答。');
      }
      
    } catch (error) {
      console.error('初始化错误:', error);
      wx.showToast({
        title: '页面加载异常',
        icon: 'none'
      });
    }
  },

  // 添加消息到列表
  addMessage(type, content) {
    try {
      console.log(`添加消息: ${type} - ${content?.substring(0, 20)}...`);
      
      const messages = [...this.data.messages, {
        type,
        content,
        time: new Date().toLocaleTimeString('zh-CN', { hour12: false })
      }];
      
      this.setData({ messages });
      console.log('消息数量:', messages.length);
      
      // 保存消息历史
      this.saveMessagesToStorage(messages);
      
      // 滚动到底部
      this.scrollToBottom();
    } catch (error) {
      console.error('添加消息错误:', error);
    }
  },
  
  // 保存消息到本地存储
  saveMessagesToStorage(messages) {
    try {
      wx.setStorageSync('chat_history', messages.slice(-20)); // 只保留最近20条消息
    } catch (e) {
      console.error('保存聊天历史失败:', e);
    }
  },
  
  // 从本地存储加载消息
  loadMessagesFromStorage() {
    try {
      const messages = wx.getStorageSync('chat_history') || [];
      console.log('加载历史消息:', messages.length);
      if (messages.length > 0) {
        this.setData({ messages });
        this.scrollToBottom();
      }
    } catch (e) {
      console.error('加载聊天历史失败:', e);
    }
  },

  // 发送消息
  async sendMessage() {
    try {
      const { inputValue, useAI, freeMode } = this.data;
      if (!inputValue.trim()) return;
  
      console.log(`发送消息: ${inputValue}`);
      console.log(`当前模式: ${useAI ? (freeMode ? 'AI自由模式' : 'AI标准模式') : '本地模式'}`);
  
      // 清空输入框并添加用户消息
      this.setData({ inputValue: '', isLoading: true, showError: false });
      this.addMessage('user', inputValue);
  
      let reply;
  
      if (useAI) {
        try {
          // 尝试获取AI回复
          console.log('请求AI回复...');
          
          // 直接使用OpenAI格式调用DeepSeek API
          const messages = freeMode ? 
            [{ role: 'user', content: inputValue }] : 
            [
              { role: 'system', content: '你是楚农智能助手，一个专业的农产品电商顾问。' },
              { role: 'user', content: inputValue }
            ];
          
          const url = 'https://api.deepseek.com/v1/chat/completions';
          console.log('发送请求到URL:', url);
          
          // 显示请求数据
          const requestData = {
            model: "deepseek-chat",
            messages: messages,
            temperature: 0.7,
            max_tokens: 800
          };
          console.log('请求数据:', JSON.stringify(requestData));
          
          // 直接使用wx.request进行API调用
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url: url,
              method: 'POST',
              header: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-027edfd83447463b8ce69ce1c11759bd'
              },
              data: requestData,
              success: res => {
                console.log('API请求结果状态:', res.statusCode);
                console.log('API响应数据:', JSON.stringify(res.data).substring(0, 100) + '...');
                
                if (res.statusCode === 200) {
                  resolve(res.data);
                } else {
                  console.error('API错误响应:', res.data);
                  reject({
                    statusCode: res.statusCode,
                    errMsg: `请求失败，状态码: ${res.statusCode}`,
                    data: res.data
                  });
                }
              },
              fail: err => {
                console.error('请求失败:', err);
                reject(err);
              }
            });
          });
          
          console.log('完整响应:', JSON.stringify(response));
          
          if (response.choices && response.choices.length > 0 && response.choices[0].message) {
            reply = response.choices[0].message.content;
            console.log('获取到回复:', reply.substring(0, 50) + '...');
          } else {
            throw new Error('无效的API响应格式');
          }
          
        } catch (apiError) {
          console.error('AI调用失败:', apiError);
          
          // 显示错误详情
          let errorMessage = '获取AI回复失败';
          if (apiError.statusCode) {
            errorMessage += `(状态码: ${apiError.statusCode})`;
          }
          if (apiError.errMsg) {
            errorMessage += `: ${apiError.errMsg}`;
          }
          
          this.setData({
            errorMessage: errorMessage,
            showError: true
          });
          
          // 降级到本地模式
          reply = getLocalReply(inputValue);
          console.log('使用本地回复:', reply);
        }
      } else {
        // 使用本地回复
        console.log('使用本地回复...');
        reply = getLocalReply(inputValue);
      }
  
      // 添加回复消息
      this.addMessage('assistant', reply);
    } catch (error) {
      console.error('获取回复失败:', error);
      
      // 显示错误信息
      this.setData({
        errorMessage: '获取回复失败，已切换到本地模式',
        showError: true
      });
      
      // 使用本地回复作为备选
      try {
        const localReply = getLocalReply(inputValue);
        this.addMessage('assistant', localReply);
      } catch (e) {
        console.error('本地回复也失败了:', e);
        this.addMessage('assistant', '很抱歉，服务暂时不可用');
      }
      
      // 降级到本地模式
      this.setData({ useAI: false, freeMode: false });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 重试上一条消息
  async retryLastMessage() {
    try {
      console.log('尝试重试上一条消息');
      const lastUserMessage = [...this.data.messages]
        .reverse()
        .find(msg => msg.type === 'user');
        
      if (lastUserMessage) {
        console.log('找到上一条用户消息:', lastUserMessage.content);
        // 移除上一条错误消息
        const messages = this.data.messages.slice(0, -1);
        this.setData({ messages, useAI: true });
        
        // 重新发送消息
        this.setData({ inputValue: lastUserMessage.content });
        this.sendMessage();
      } else {
        console.log('未找到可重试的消息');
      }
    } catch (error) {
      console.error('重试消息失败:', error);
    }
  },

  // 输入框内容变化
  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  // 滚动到底部
  scrollToBottom() {
    setTimeout(() => {
      try {
        wx.createSelectorQuery()
          .select('#message-list')
          .boundingClientRect(rect => {
            if (rect) {
              wx.pageScrollTo({
                scrollTop: rect.bottom,
                duration: 300
              });
            }
          })
          .exec();
      } catch (error) {
        console.error('滚动到底部失败:', error);
      }
    }, 100);
  },

  // 选择常见问题并提问
  selectFAQ(e) {
    try {
      const id = parseInt(e.currentTarget.dataset.id);
      console.log('选择FAQ:', id);
      const faq = this.data.faqs.find(faq => faq.id === id);
      
      if (faq) {
        // 直接显示问题和回答
        this.addMessage('user', faq.question);
        
        // 添加短暂延迟，提升用户体验
        this.setData({ isLoading: true });
        setTimeout(() => {
          this.addMessage('assistant', faq.answer);
          this.setData({ isLoading: false });
        }, 500);
      }
    } catch (error) {
      console.error('选择FAQ失败:', error);
    }
  },

  // 切换AI/本地模式
  toggleAIMode() {
    try {
      const currentMode = this.data.useAI;
      const newMode = !currentMode;
      
      console.log(`切换模式: ${currentMode ? 'AI' : '本地'} -> ${newMode ? 'AI' : '本地'}`);
      
      // 如果切换到本地模式，自动关闭自由模式
      const freeMode = newMode ? this.data.freeMode : false;
      
      this.setData({ 
        useAI: newMode,
        freeMode: freeMode
      });
      
      const message = newMode ? 
        '已切换到AI模式，回答更智能' : 
        '已切换到本地模式，回答更快速';
        
      wx.showToast({
        title: message,
        icon: 'none',
        duration: 2000
      });
    } catch (error) {
      console.error('切换模式失败:', error);
    }
  },
  
  // 切换自由对话模式
  toggleFreeMode() {
    try {
      // 只有在AI模式下才能切换自由模式
      if (!this.data.useAI) {
        wx.showToast({
          title: '请先开启AI模式',
          icon: 'none'
        });
        return;
      }
      
      const currentFreeMode = this.data.freeMode;
      const newFreeMode = !currentFreeMode;
      
      console.log(`切换自由模式: ${currentFreeMode ? '开启' : '关闭'} -> ${newFreeMode ? '开启' : '关闭'}`);
      
      this.setData({ freeMode: newFreeMode });
      
      const message = newFreeMode ? 
        '已开启自由对话模式，AI将不受限制回答' : 
        '已关闭自由对话模式';
        
      wx.showToast({
        title: message,
        icon: 'none',
        duration: 2000
      });
      
      // 如果开启自由模式，添加提示消息
      if (newFreeMode) {
        this.addMessage('system', '您已开启自由对话模式，AI将不受限制地回答您的问题。请注意，在此模式下AI可能会生成与楚农电商无关的内容。');
      }
    } catch (error) {
      console.error('切换自由模式失败:', error);
    }
  },

  // 打开在线客服
  openOnlineService() {
    wx.showToast({
      title: '人工客服即将上线',
      icon: 'none'
    });
  },

  // 拨打电话
  makePhoneCall() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail(err) {
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none'
        });
      }
    });
  },

  // 查看常见问题
  viewFAQ(e) {
    this.selectFAQ(e);
  },
  
  // 页面分享
  onShareAppMessage() {
    return {
      title: '楚农智能客服',
      path: '/pages/index/index'
    };
  }
}); 