const aiService = require('../../services/ai-service');
const localAI = require('../../services/local-ai');
const { getAIResponse, getLocalReply, DEFAULT_RESPONSES } = aiService;

// 智能客服与AI助手集成
Page({
  data: {
    // 通用数据
    activeTab: 'service', // 当前激活的选项卡：service - 客服, ai - AI助手
    
    // 客服页面数据
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
    freeMode: true, // 默认使用自由对话模式
    
    // AI助手页面数据
    aiInputMessage: '',
    aiMessages: [
      {
        role: 'ai',
        content: '您好，我是楚农电商智能助手，有什么可以帮您？'
      }
    ],
    aiLoading: false
  },

  onLoad() {
    console.log('智能客服页面加载...');
    
    try {
      // 显示欢迎消息
      this.addMessage('assistant', DEFAULT_RESPONSES.greeting);
      
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
  
  // 切换选项卡
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    
    // 切换后滚动到底部
    setTimeout(() => {
      if (tab === 'service') {
        this.scrollToBottom('message-list');
      } else {
        this.scrollToBottom('ai-message-list');
      }
    }, 300);
  },

  // 添加消息到客服列表
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
      this.scrollToBottom('message-list');
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
        this.scrollToBottom('message-list');
      }
    } catch (e) {
      console.error('加载聊天历史失败:', e);
    }
  },

  // 发送消息到客服
  async sendMessage() {
    try {
      const { inputValue, useAI, freeMode } = this.data;
      if (!inputValue.trim()) return;
  
      console.log(`发送消息: ${inputValue}`);
      console.log(`当前模式: ${useAI ? (freeMode ? 'AI自由模式' : 'AI标准模式') : '本地模式'}`);
  
      // 清空输入框并添加用户消息
      this.setData({ inputValue: '', isLoading: true, showError: false });
      this.addMessage('user', inputValue);
  
      // 检查调试命令
      if (inputValue.startsWith('/debug')) {
        const debugCommand = inputValue.split(' ')[1];
        if (debugCommand === 'api') {
          // 显示API信息
          const apiInfo = `DeepSeek API配置:
URL: ${require('../../config/api').deepseek.baseUrl}
模型: ${require('../../config/api').deepseek.model}
API密钥: ${require('../../config/api').deepseek.apiKey.substring(0, 8)}...
备用模型: ${JSON.stringify(require('../../config/api').deepseek.fallbackModels || [])}`;
          
          this.addMessage('system', apiInfo);
          this.setData({ isLoading: false });
          return;
        } else if (debugCommand === 'test') {
          // 发送简单测试
          this.addMessage('system', '发送API测试请求...');
          const testResponse = await getAIResponse('你好，这是一个测试', { freeMode: true });
          this.addMessage('system', `API测试响应: ${testResponse}`);
          this.setData({ isLoading: false });
          return;
        } else if (debugCommand === 'help') {
          const helpText = `调试命令:
/debug api - 显示API配置信息
/debug test - 发送测试请求
/debug local - 切换到本地模式
/debug ai - 切换到AI模式
/debug free - 切换自由模式
/debug help - 显示此帮助`;
          
          this.addMessage('system', helpText);
          this.setData({ isLoading: false });
          return;
        } else if (debugCommand === 'local') {
          this.setData({ useAI: false });
          this.addMessage('system', '已切换到本地模式');
          this.setData({ isLoading: false });
          return;
        } else if (debugCommand === 'ai') {
          this.setData({ useAI: true });
          this.addMessage('system', '已切换到AI模式');
          this.setData({ isLoading: false });
          return;
        } else if (debugCommand === 'free') {
          if (this.data.useAI) {
            this.setData({ freeMode: !this.data.freeMode });
            this.addMessage('system', `已${this.data.freeMode ? '开启' : '关闭'}自由模式`);
          } else {
            this.addMessage('system', '请先切换到AI模式');
          }
          this.setData({ isLoading: false });
          return;
        }
      }
  
      let reply;
  
      if (useAI) {
        try {
          // 尝试使用AI服务
          console.log('通过AI服务获取回复...');
          
          // 设置完整的参数
          const options = {
            freeMode: freeMode,
            context: this.data.messages.slice(-6).map(msg => ({ 
              type: msg.type, 
              content: msg.content 
            })),
            temperature: 0.7,
            max_tokens: 1000
          };
          
          // 调用AI服务
          console.log('准备调用getAIResponse...');
          reply = await getAIResponse(inputValue, options);
          console.log('AI回复结果:', reply ? reply.substring(0, 30) + '...' : 'undefined');
          
        } catch (apiError) {
          console.error('AI服务调用失败:', apiError);
          
          // 显示详细错误信息
          let errorMessage = '获取AI回复失败';
          if (apiError.statusCode) {
            errorMessage += ` (状态码: ${apiError.statusCode})`;
          }
          if (apiError.errMsg) {
            errorMessage += `: ${apiError.errMsg}`;
          }
          
          this.setData({
            errorMessage: errorMessage,
            showError: true
          });
          
          // 降级到本地模式
          console.log('降级使用本地回复');
          reply = getLocalReply(inputValue);
        }
      } else {
        // 使用本地回复
        console.log('使用本地回复...');
        reply = getLocalReply(inputValue);
      }
  
      // 添加回复消息
      if (!reply) {
        console.error('没有获取到有效回复');
        reply = '很抱歉，我暂时无法回答这个问题。';
      }
      
      this.addMessage('assistant', reply);
      
    } catch (error) {
      console.error('发送消息失败:', error);
      
      // 显示错误信息
      this.setData({
        errorMessage: '获取回复失败，已切换到本地模式',
        showError: true
      });
      
      // 使用本地回复作为备选
      try {
        const localReply = getLocalReply(this.data.inputValue || '帮助');
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
      
      if (!lastUserMessage) {
        console.warn('未找到最近的用户消息');
        return;
      }
      
      console.log('找到最近的用户消息:', lastUserMessage.content);
      this.setData({ inputValue: lastUserMessage.content });
      this.sendMessage();
    } catch (error) {
      console.error('重试失败:', error);
      wx.showToast({
        title: '重试失败',
        icon: 'none'
      });
    }
  },

  // 客服输入框内容变化
  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  // 滚动到底部
  scrollToBottom(selector) {
    setTimeout(() => {
      wx.createSelectorQuery()
        .select(`#${selector}`)
        .boundingClientRect(rect => {
          if (rect) {
            wx.pageScrollTo({
              scrollTop: rect.height,
              duration: 300
            });
          }
        })
        .exec();
    }, 100);
  },

  // 选择常见问题
  selectFAQ(e) {
    const faqId = e.currentTarget.dataset.id;
    const faq = this.data.faqs.find(item => item.id === faqId);
    
    if (faq) {
      // 添加用户问题
      this.addMessage('user', faq.question);
      
      // 直接添加预设答案
      setTimeout(() => {
        this.addMessage('assistant', faq.answer);
      }, 500);
    }
  },

  // 切换AI模式
  toggleAIMode() {
    this.setData({ 
      useAI: !this.data.useAI 
    }, () => {
      // 添加模式切换提示
      if (this.data.useAI) {
        this.addMessage('system', '已切换到AI模式，可以获得更智能的回复。');
      } else {
        this.addMessage('system', '已切换到本地模式，回复速度更快但功能有限。');
      }
    });
  },

  // 切换自由对话模式
  toggleFreeMode() {
    // 只有在AI模式下才能切换自由对话模式
    if (!this.data.useAI) return;
    
    this.setData({ 
      freeMode: !this.data.freeMode 
    }, () => {
      // 添加模式切换提示
      if (this.data.freeMode) {
        this.addMessage('system', '已开启自由对话模式，可以询问任何问题。');
      } else {
        this.addMessage('system', '已关闭自由对话模式，回复将更专注于楚农电商相关问题。');
      }
    });
  },

  // 打开在线客服
  openOnlineService() {
    wx.showToast({
      title: '正在连接人工客服...',
      icon: 'loading',
      duration: 2000
    });
    
    // 这里应该连接到真实的在线客服系统
    // 微信小程序提供了 button open-type="contact" 可直接使用微信客服
    // 这里仅做演示
    setTimeout(() => {
      wx.showToast({
        title: '暂无在线客服',
        icon: 'none'
      });
    }, 2000);
  },

  // 拨打客服电话
  makePhoneCall() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567', // 替换为实际客服电话
      fail(err) {
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        });
        console.error('拨打电话失败:', err);
      }
    });
  },
  
  // ===== AI助手功能 =====
  
  // AI助手输入框内容变化
  onAIInputChange(e) {
    this.setData({
      aiInputMessage: e.detail.value
    });
  },
  
  // 发送消息到AI助手
  async sendAIMessage() {
    const { aiInputMessage, aiMessages } = this.data;
    
    // 检查消息是否为空
    if (!aiInputMessage.trim()) {
      return;
    }
    
    // 添加用户消息到对话列表
    const userMessage = {
      role: 'user',
      content: aiInputMessage
    };
    
    this.setData({
      aiMessages: [...aiMessages, userMessage],
      aiInputMessage: '',
      aiLoading: true
    });
    
    try {
      // 调用AI服务获取回复
      const aiResponse = await localAI.getLocalAIResponse(aiInputMessage);
      
      // 添加AI回复到对话列表
      const aiMessage = {
        role: 'ai',
        content: aiResponse
      };
      
      this.setData({
        aiMessages: [...this.data.aiMessages, aiMessage],
        aiLoading: false
      });
      
      // 滚动到底部
      this.scrollToBottom('ai-message-list');
    } catch (error) {
      console.error('获取AI回复失败:', error);
      
      // 使用备用回答
      const fallbackResponse = localAI.getFallbackAnswer(aiInputMessage);
      const fallbackMessage = {
        role: 'ai',
        content: '抱歉，我遇到了一些问题。' + fallbackResponse
      };
      
      this.setData({
        aiMessages: [...this.data.aiMessages, fallbackMessage],
        aiLoading: false
      });
      
      // 滚动到底部
      this.scrollToBottom('ai-message-list');
    }
  },

  // 其他生命周期函数
  onReady() {},
  onShow() {},
  onHide() {},
  onUnload() {},
  onPullDownRefresh() {},
  onReachBottom() {},
  onShareAppMessage() {}
}); 