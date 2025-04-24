// subpackages/others/pages/developing/developing.js
const localAI = require('../../../../services/local-ai');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputMessage: '',
    messages: [
      {
        role: 'ai',
        content: '您好，我是楚农电商智能助手，有什么可以帮您？'
      }
    ],
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 页面加载时可以初始化一些数据
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 输入框内容变化
   */
  onInputChange(e) {
    this.setData({
      inputMessage: e.detail.value
    });
  },

  /**
   * 发送消息
   */
  async sendMessage() {
    const { inputMessage, messages } = this.data;
    
    // 检查消息是否为空
    if (!inputMessage.trim()) {
      return;
    }
    
    // 添加用户消息到对话列表
    const userMessage = {
      role: 'user',
      content: inputMessage
    };
    
    this.setData({
      messages: [...messages, userMessage],
      inputMessage: '',
      loading: true
    });
    
    try {
      // 调用AI服务获取回复
      const aiResponse = await localAI.getLocalAIResponse(inputMessage);
      
      // 添加AI回复到对话列表
      const aiMessage = {
        role: 'ai',
        content: aiResponse
      };
      
      this.setData({
        messages: [...this.data.messages, aiMessage],
        loading: false
      });
      
      // 滚动到底部
      this.scrollToBottom();
    } catch (error) {
      console.error('获取AI回复失败:', error);
      
      // 使用备用回答
      const fallbackResponse = localAI.getFallbackAnswer(inputMessage);
      const fallbackMessage = {
        role: 'ai',
        content: '抱歉，我遇到了一些问题。' + fallbackResponse
      };
      
      this.setData({
        messages: [...this.data.messages, fallbackMessage],
        loading: false
      });
      
      // 滚动到底部
      this.scrollToBottom();
    }
  },
  
  /**
   * 滚动到对话底部
   */
  scrollToBottom() {
    wx.createSelectorQuery()
      .select('.chat-messages')
      .boundingClientRect(rect => {
        wx.pageScrollTo({
          scrollTop: rect.height,
          duration: 300
        });
      })
      .exec();
  }
})