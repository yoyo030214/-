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
    aiLoading: false,
    
    // 语音交互相关
    isRecording: false,
    showVoiceResult: false,
    voiceResult: '',
    isPlaying: false,
    playingMessageIndex: -1,
    recorderManager: null,
    innerAudioContext: null,
    
    // 语音连续对话模式相关
    continuousVoiceMode: false, // 是否开启连续语音对话模式
    autoPlayResponse: true, // 是否自动播放AI回复
    voiceSessionId: '', // 语音对话会话ID
    waitingForResponse: false, // 是否正在等待AI响应
    silenceTimer: null, // 静音检测定时器
    silenceThreshold: 2000, // 静音阈值（毫秒）
    listeningStatus: 'idle', // 'idle'|'listening'|'processing'|'speaking' 语音状态
    isAudioStopped: true, // 音频播放是否停止
    lastRecordTime: 0, // 上次录音时间戳
    
    // 语音识别实时反馈相关
    showRecognitionFeedback: false, // 是否显示语音识别反馈
    voiceWaveData: [20, 30, 40, 50, 40, 30, 20, 30, 40, 60, 70, 60, 50, 40, 30, 20], // 语音波形数据
    recognitionFeedbackText: '', // 语音识别反馈文本
    recognitionFeedbackTimer: null, // 语音识别反馈定时器
    streamingRecognitionActive: false, // 是否开启了流式识别
    
    // 音频播放进度相关
    audioProgress: 0, // 音频播放进度（百分比）
    audioProgressTimer: null, // 音频播放进度定时器
    audioCurrentTime: '0:00', // 当前播放时间
    audioDuration: '0:00', // 音频总时长
    
    // 多语言支持相关
    currentLanguage: 'zh-CN', // 当前语言：'zh-CN'(中文)、'en-US'(英语)
    currentLanguageName: '中文', // 添加当前语言名称
    showLanguageSelector: false, // 是否显示语言选择器
    supportedLanguages: [
      { code: 'zh-CN', name: '中文', voiceName: 'zh-CN-XiaoxiaoNeural' },
      { code: 'en-US', name: 'English', voiceName: 'en-US-JennyNeural' },
      { code: 'zh-HK', name: '粤语', voiceName: 'zh-HK-HiuGaaiNeural' },
      { code: 'zh-TW', name: '闽南语', voiceName: 'zh-TW-HsiaoChenNeural' }
    ],
    
    // 离线语音功能
    offlineCommandsEnabled: false,
    offlineCommands: [
      { command: "帮助", action: "help", description: "显示帮助信息" },
      { command: "清空", action: "clear", description: "清空对话记录" },
      { command: "回到首页", action: "home", description: "回到小程序首页" },
      { command: "设置", action: "settings", description: "打开设置页面" },
      { command: "关闭", action: "quit", description: "关闭当前页面" }
    ],
    showOfflineCommandHelp: false,
    
    // 缓存语音回复
    audioCacheEnabled: false,
    audioCacheList: [],
    maxAudioCacheSize: 10, // 最多缓存10条回复
    
    // 语音识别优化相关
    optimizedRecognition: false,
    recognitionBuffer: [],
    maxBufferLength: 3,
    
    // 语音质量控制
    voiceQuality: 'standard', // 可选值: 'high', 'standard', 'low'
    voiceRate: 0, // 语速，范围 -100 到 100
    voicePitch: 0, // 音调，范围 -50 到 50
    showVoiceQualitySettings: false,
    optimizeFileSize: false, // 优化文件大小
    
    // 情感分析相关
    emotionAnalysisEnabled: false,
    currentEmotion: 'neutral',
    emotionScores: null,
    formattedEmotionScores: null, // 添加格式化的情感分数，用于界面显示
    emotionColors: {
      happy: '#FFD700',     // 金色
      sad: '#6495ED',       // 蓝色
      angry: '#FF4500',     // 红色
      fear: '#9932CC',      // 紫色
      surprise: '#32CD32',  // 绿色
      neutral: '#A9A9A9'    // 灰色
    },
    
    // 降噪处理相关
    noiseReductionEnabled: false,
    noiseReductionLevel: 'medium', // 'low', 'medium', 'high'
    preserveVoice: true,
    showNoiseReductionSettings: false,
    showNoiseReductionResults: false,
    noiseReductionStats: {
      totalProcessed: 0,
      totalSaved: 0,
      averageReduction: 0,
      successRate: 100,
      formattedTotalSaved: '0.00', // 添加格式化后的数据
      formattedAverageReduction: '0.0' // 添加格式化后的数据
    },
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
      
      // 初始化语音相关功能
      this.initVoiceFeatures();
      
      // 初始化语音会话ID
      this.setData({
        voiceSessionId: `voice_session_${Date.now()}`
      });
      
      // 初始化语音波形动画
      this.initVoiceWaveAnimation();
      
      // 加载语言设置
      this.loadLanguageSettings();
      this.initOfflineCommands();
      this.initAudioCache();
      this.initOptimizedRecognition();
      this.initVoiceQualitySettings();
      this.initEmotionAnalysis();
      this.initNoiseReduction();
      
    } catch (error) {
      console.error('初始化错误:', error);
      wx.showToast({
        title: '页面加载异常',
        icon: 'none'
      });
    }
  },

  // 初始化语音相关功能
  initVoiceFeatures() {
    // 初始化录音管理器
    this.recorderManager = wx.getRecorderManager();
    
    // 设置录音结束回调
    this.recorderManager.onStop(res => {
      console.log('录音结束回调');
      this.onRecorderStop(res);
    });
    
    // 设置录音错误回调
    this.recorderManager.onError(res => {
      console.error('录音错误:', res);
      wx.showToast({
        title: '录音失败: ' + res.errMsg,
        icon: 'none'
      });
      this.setData({
        isRecording: false,
        listeningStatus: 'idle'
      });
    });
    
    // 设置录音中断回调
    this.recorderManager.onInterruptionBegin(() => {
      console.log('录音被中断');
      this.recorderManager.stop();
    });
    
    // 设置录音恢复回调
    this.recorderManager.onInterruptionEnd(() => {
      console.log('录音中断结束');
      // 如果是连续对话模式，则恢复录音
      if (this.data.continuousVoiceMode && this.data.listeningStatus === 'listening') {
        setTimeout(() => {
          this.startContinuousListening();
        }, 1000);
      }
    });
    
    // 设置录音帧回调，用于更新音量动画
    this.recorderManager.onFrameRecorded(res => {
      // 更新最后录音时间，用于静音检测
      this.data.lastRecordTime = Date.now();
    });
    
    // 初始化音频播放上下文
    this.innerAudioContext = wx.createInnerAudioContext();
    this.innerAudioContext.onPlay(() => {
      console.log('开始播放语音');
      this.setData({
        isPlaying: true
      });
    });
    
    this.innerAudioContext.onTimeUpdate(() => {
      // 更新播放进度
      if (this.data.isPlaying) {
        const currentTime = this.innerAudioContext.currentTime;
        const duration = this.innerAudioContext.duration;
        
        // 计算进度百分比
        const progress = (currentTime / duration) * 100;
        
        this.setData({
          audioProgress: progress,
          audioCurrentTime: this.formatTime(currentTime),
          audioDuration: this.formatTime(duration)
        });
      }
    });
    
    this.innerAudioContext.onEnded(() => {
      console.log('语音播放结束');
      this.setData({
        isPlaying: false,
        playingMessageIndex: -1,
        audioProgress: 0,
        audioCurrentTime: '0:00'
      });
      
      // 如果是连续对话模式且正在等待响应播放完毕，则开始下一轮录音
      if (this.data.continuousVoiceMode && this.data.listeningStatus === 'speaking') {
        console.log('语音播放结束，开始下一轮录音');
        this.setData({ listeningStatus: 'idle' });
        setTimeout(() => {
          this.startContinuousListening();
        }, 1000);
      }
    });
    
    this.innerAudioContext.onError(res => {
      console.error('语音播放错误:', res);
      wx.showToast({
        title: '语音播放失败',
        icon: 'none'
      });
      this.setData({
        isPlaying: false,
        playingMessageIndex: -1
      });
      
      // 如果是连续对话模式，则尝试恢复录音
      if (this.data.continuousVoiceMode && this.data.listeningStatus === 'speaking') {
        this.setData({ listeningStatus: 'idle' });
        setTimeout(() => {
          this.startContinuousListening();
        }, 1000);
      }
    });
  },
  
  // 切换连续对话模式
  toggleContinuousVoiceMode() {
    const newMode = !this.data.continuousVoiceMode;
    this.setData({ 
      continuousVoiceMode: newMode
    });
    
    if (newMode) {
      wx.showToast({
        title: '已开启连续对话模式',
        icon: 'none'
      });
    } else {
      // 停止可能正在进行的连续对话
      this.stopContinuousListening();
      wx.showToast({
        title: '已关闭连续对话模式',
        icon: 'none'
      });
    }
  },
  
  // 切换自动播放回复
  toggleAutoPlayResponse() {
    this.setData({
      autoPlayResponse: !this.data.autoPlayResponse
    });
    
    wx.showToast({
      title: this.data.autoPlayResponse ? '已开启自动播放' : '已关闭自动播放',
      icon: 'none'
    });
  },
  
  // 切换语言选择器显示状态
  toggleLanguageSelector() {
    this.setData({
      showLanguageSelector: !this.data.showLanguageSelector
    });
  },
  
  // 选择语言
  selectLanguage(e) {
    const langCode = e.currentTarget.dataset.langCode;
    const currentLang = this.data.currentLanguage;
    
    // 如果选择的语言与当前语言相同，则只关闭选择器
    if (langCode === currentLang) {
      this.setData({
        showLanguageSelector: false
      });
      return;
    }
    
    // 获取语言名称
    const langItem = this.data.supportedLanguages.find(item => item.code === langCode);
    const langName = langItem ? langItem.name : langCode;
    
    // 更新语言设置
    this.setData({
      currentLanguage: langCode,
      currentLanguageName: langName,
      showLanguageSelector: false
    });
    
    // 显示语言切换提示
    wx.showToast({
      title: `已切换到${langName}`,
      icon: 'none'
    });
    
    // 存储语言设置到本地存储
    wx.setStorageSync('currentLanguage', langCode);
    
    // 为AI添加一条系统消息，告知语言变更
    const systemMessage = this.getLanguageChangeMessage(langCode);
    this.addAIMessage('ai', systemMessage);
  },
  
  // 根据语言代码获取语言变更提示消息
  getLanguageChangeMessage(langCode) {
    const messages = {
      'zh-CN': '已切换到中文，您可以用中文与我对话。',
      'en-US': 'Switched to English. You can now talk to me in English.',
      'zh-HK': '已切換到粵語，您可以用粵語同我傾偈。',
      'zh-TW': '已切換到閩南語，您可以用閩南語和我對話。'
    };
    
    return messages[langCode] || '语言已切换';
  },
  
  // 从存储中加载语言设置
  loadLanguageSettings() {
    try {
      // 从本地存储加载语言设置
      const currentLanguage = wx.getStorageSync('currentLanguage');
      if (currentLanguage) {
        // 设置当前语言
        this.setData({ currentLanguage });
      }
      
      // 找到当前语言对应的名称
      const currentLang = this.data.supportedLanguages.find(lang => lang.code === this.data.currentLanguage);
      if (currentLang) {
        this.setData({
          currentLanguageName: currentLang.name
        });
      }
      
      console.log('当前语言:', this.data.currentLanguage, this.data.currentLanguageName);
    } catch (error) {
      console.error('加载语言设置失败:', error);
    }
  },
  
  // 添加消息到AI消息列表
  addAIMessage(role, content) {
    const aiMessages = [...this.data.aiMessages, {
      role,
      content
    }];
    
    this.setData({ aiMessages });
    
    // 滚动到底部
    this.scrollToBottom('ai-message-list');
  },
  
  // 开始连续语音监听
  startContinuousListening() {
    // 如果不是连续对话模式或已经在监听，则不执行
    if (!this.data.continuousVoiceMode || 
        this.data.listeningStatus === 'listening' || 
        this.data.listeningStatus === 'processing' ||
        this.data.listeningStatus === 'speaking' ||
        this.data.isRecording) {
      return;
    }
    
    console.log('开始连续语音监听');
    
    // 更新状态
    this.setData({ 
      listeningStatus: 'listening',
      showRecognitionFeedback: true 
    });
    
    // 开始波形动画
    this.updateVoiceWaveAnimation();
    
    // 开始转写反馈
    this.startRecognitionFeedback();
    
    // 检查录音授权
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        // 开始录音
        this.recorderManager.start({
          duration: 60000, // 最长录制60秒
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 64000,
          format: 'mp3'
        });
        
        // 设置静音检测
        this.startSilenceDetection();
      },
      fail: () => {
        this.setData({ 
          listeningStatus: 'idle',
          showRecognitionFeedback: false
        });
        wx.showModal({
          title: '提示',
          content: '需要您授权录音功能',
          confirmText: '前往设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            }
          }
        });
      }
    });
  },
  
  // 停止连续语音监听
  stopContinuousListening() {
    if (this.data.isRecording) {
      this.recorderManager.stop();
    }
    
    // 清除静音检测
    this.clearSilenceDetection();
    
    // 停止转写反馈
    this.stopRecognitionFeedback();
    
    // 更新状态
    this.setData({ 
      listeningStatus: 'idle',
      isRecording: false,
      showRecognitionFeedback: false
    });
  },
  
  // 切换连续监听状态
  toggleContinuousListening() {
    if (this.data.listeningStatus === 'listening') {
      // 如果正在监听，则停止
      this.stopContinuousListening();
    } else if (this.data.listeningStatus === 'idle') {
      // 如果空闲，则开始监听
      this.startContinuousListening();
    }
    // 其他状态（processing, speaking）不做处理
  },
  
  // 开始静音检测
  startSilenceDetection() {
    // 清除可能存在的定时器
    this.clearSilenceDetection();
    
    // 设置新的定时器，检测静音超过阈值时自动停止录音
    this.data.silenceTimer = setInterval(() => {
      if (this.data.isRecording) {
        const now = Date.now();
        const elapsed = now - this.data.lastRecordTime;
        
        // 如果超过静音阈值，自动停止录音
        if (elapsed > this.data.silenceThreshold) {
          console.log('检测到静音，自动停止录音');
          this.recorderManager.stop();
          this.clearSilenceDetection();
        }
      }
    }, 500);
  },
  
  // 清除静音检测
  clearSilenceDetection() {
    if (this.data.silenceTimer) {
      clearInterval(this.data.silenceTimer);
      this.data.silenceTimer = null;
    }
  },
  
  // 处理连续对话模式下的语音输入
  handleContinuousVoiceInput(text) {
    if (!text.trim()) {
      // 如果识别结果为空，继续监听
      this.setData({ listeningStatus: 'idle' });
      setTimeout(() => {
        this.startContinuousListening();
      }, 500);
      return;
    }
    
    console.log('连续对话模式处理语音输入:', text);
    
    // 检查是否为离线指令
    if (this.processOfflineCommand(text)) {
      this.clearSilenceDetection();
      return; // 如果是离线指令，不继续处理语音输入
    }
    
    // 添加用户消息到对话列表
    const userMessage = {
      role: 'user',
      content: text
    };
    
    this.setData({
      aiMessages: [...this.data.aiMessages, userMessage],
      aiLoading: true,
      listeningStatus: 'processing',
      waitingForResponse: true
    });
    
    // 滚动到底部
    this.scrollToBottom('ai-message-list');
    
    // 调用AI获取回复
    this.getContinuousVoiceAIResponse(text);
  },
  
  // 获取连续对话的AI回复
  async getContinuousVoiceAIResponse(text) {
    try {
      // 调用优化后的农业知识库增强的AI服务获取回复
      const aiResponse = await localAI.getLocalAIResponse(text, this.data.voiceSessionId);
      
      // 添加AI回复到对话列表
      const aiMessage = {
        role: 'ai',
        content: aiResponse
      };
      
      this.setData({
        aiMessages: [...this.data.aiMessages, aiMessage],
        aiLoading: false,
        waitingForResponse: false,
        listeningStatus: 'speaking'
      });
      
      // 滚动到底部
      this.scrollToBottom('ai-message-list');
      
      // 如果开启了自动播放，则播放AI回复
      if (this.data.autoPlayResponse) {
        const messageIndex = this.data.aiMessages.length - 1;
        this.playAIResponse({ currentTarget: { dataset: { content: aiResponse, index: messageIndex } } });
      } else {
        // 未开启自动播放时，直接进入下一轮监听
        this.setData({ listeningStatus: 'idle' });
        setTimeout(() => {
          this.startContinuousListening();
        }, 1000);
      }
    } catch (error) {
      console.error('获取AI回复失败:', error);
      
      // 使用备用回答
      const fallbackResponse = localAI.getFallbackAnswer(text);
      const fallbackMessage = {
        role: 'ai',
        content: '抱歉，我遇到了一些问题。' + fallbackResponse
      };
      
      this.setData({
        aiMessages: [...this.data.aiMessages, fallbackMessage],
        aiLoading: false,
        waitingForResponse: false,
        listeningStatus: 'idle'
      });
      
      // 滚动到底部
      this.scrollToBottom('ai-message-list');
      
      // 恢复监听
      setTimeout(() => {
        this.startContinuousListening();
      }, 1500);
    }
  },
  
  // 播放AI回复的语音
  playAIResponse(e) {
    const content = e.currentTarget.dataset.content;
    const index = e.currentTarget.dataset.index !== undefined 
      ? e.currentTarget.dataset.index 
      : this.data.aiMessages.findIndex(msg => msg.content === content);
    
    console.log('准备播放AI回复', content.substring(0, 20) + '...');
    
    // 如果正在播放，停止播放
    if (this.data.isPlaying) {
      this.innerAudioContext.stop();
      this.setData({
        isPlaying: false,
        playingMessageIndex: -1,
        audioProgress: 0,
        audioCurrentTime: '0:00'
      });
      return;
    }
    
    // 获取当前语言的声音配置
    const currentLangConfig = this.data.supportedLanguages.find(lang => lang.code === this.data.currentLanguage);
    const voiceName = currentLangConfig ? currentLangConfig.voiceName : 'zh-CN-XiaoxiaoNeural';
    
    // 检查是否有缓存
    const cachedAudio = this.findAudioInCache(content, this.data.currentLanguage, voiceName);
    
    if (cachedAudio) {
      // 使用缓存的音频
      wx.cloud.getTempFileURL({
        fileList: [cachedAudio.fileID],
        success: tempRes => {
          const tempFileURL = tempRes.fileList[0].tempFileURL;
          console.log('从缓存获取临时文件URL成功', tempFileURL);
          
          // 重置播放进度
          this.setData({
            audioProgress: 0,
            audioCurrentTime: '0:00',
            audioDuration: '加载中...'
          });
          
          // 播放语音
          this.innerAudioContext.src = tempFileURL;
          this.innerAudioContext.play();
          
          this.setData({
            isPlaying: true,
            playingMessageIndex: index
          });
        },
        fail: err => {
          console.error('获取缓存音频URL失败:', err);
          // 缓存访问失败，使用云函数合成
          this.synthesizeAndPlayAudio(content, voiceName, index);
        }
      });
    } else {
      // 没有缓存，调用语音合成服务
      this.synthesizeAndPlayAudio(content, voiceName, index);
    }
  },
  
  // 合成并播放音频
  synthesizeAndPlayAudio(content, voiceName, index) {
    wx.showLoading({ title: '语音生成中...' });
    
    // 调用语音合成云函数
    wx.cloud.callFunction({
      name: 'voiceAPI',
      data: {
        action: 'textToSpeech',
        params: {
          text: content,
          voice: voiceName,
          language: this.data.currentLanguage,
          format: 'mp3',
          quality: this.data.voiceQuality,
          rate: this.data.voiceRate,
          pitch: this.data.voicePitch,
          optimizeSize: this.data.optimizeFileSize
        }
      },
      success: res => {
        wx.hideLoading();
        
        if (res.result && res.result.success && res.result.fileID) {
          console.log('语音合成成功', res.result.fileID);
          
          // 如果包含文件大小信息，显示优化结果
          if (res.result.optimized && res.result.sizeReduction > 0) {
            wx.showToast({
              title: `文件大小减小了${res.result.sizeReduction}%`,
              icon: 'none',
              duration: 2000
            });
          }
          
          // 保存到缓存
          this.saveAudioToCache(content, res.result.fileID, this.data.currentLanguage, voiceName);
          
          // 获取临时文件链接
          wx.cloud.getTempFileURL({
            fileList: [res.result.fileID],
            success: tempRes => {
              const tempFileURL = tempRes.fileList[0].tempFileURL;
              console.log('获取临时文件URL成功', tempFileURL);
              
              // 重置播放进度
              this.setData({
                audioProgress: 0,
                audioCurrentTime: '0:00',
                audioDuration: '加载中...'
              });
              
              // 播放语音
              this.innerAudioContext.src = tempFileURL;
              this.innerAudioContext.play();
              
              this.setData({
                isPlaying: true,
                playingMessageIndex: index
              });
            },
            fail: err => {
              console.error('获取临时文件URL失败:', err);
              wx.showToast({
                title: '播放失败，请重试',
                icon: 'none'
              });
              
              this.setData({
                isPlaying: false,
                playingMessageIndex: -1
              });
            }
          });
        } else {
          wx.showToast({
            title: '语音合成失败',
            icon: 'none'
          });
          
          this.setData({
            isPlaying: false,
            playingMessageIndex: -1
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        console.error('调用语音合成云函数失败:', err);
        
        wx.showToast({
          title: '语音合成服务异常',
          icon: 'none'
        });
        
        this.setData({
          isPlaying: false,
          playingMessageIndex: -1
        });
      }
    });
  },
  
  // 格式化时间
  formatTime(seconds) {
    seconds = Math.floor(seconds || 0);
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
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
      // 调用优化后的农业知识库增强的AI服务获取回复
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
  onShareAppMessage() {},

  // 初始化语音波形动画
  initVoiceWaveAnimation() {
    // 初始化语音波形数据
    const initialWaveData = [];
    for (let i = 0; i < 16; i++) {
      initialWaveData.push(Math.floor(Math.random() * 30) + 20);
    }
    
    this.setData({
      voiceWaveData: initialWaveData
    });
  },
  
  // 更新语音波形动画
  updateVoiceWaveAnimation() {
    if (!this.data.isRecording && this.data.listeningStatus !== 'listening') {
      return;
    }
    
    const newWaveData = [];
    for (let i = 0; i < 16; i++) {
      newWaveData.push(Math.floor(Math.random() * 50) + 20);
    }
    
    this.setData({
      voiceWaveData: newWaveData
    });
    
    // 定时更新波形
    setTimeout(() => {
      this.updateVoiceWaveAnimation();
    }, 150);
  },
  
  // 开始语音录制
  startVoiceRecord(e) {
    console.log('开始录音');
    
    // 检查录音授权
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        // 开始录音
        this.recorderManager.start({
          duration: 60000, // 最长录制60秒
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 64000,
          format: 'mp3'
        });
        
        // 显示语音识别反馈
        this.setData({ 
          isRecording: true,
          showRecognitionFeedback: true,
          recognitionFeedbackText: '正在聆听...'
        });
        
        // 开始波形动画
        this.updateVoiceWaveAnimation();
        
        // 实时转写反馈（模拟）
        this.startRecognitionFeedback();
      },
      fail: () => {
        wx.showModal({
          title: '提示',
          content: '需要您授权录音功能',
          confirmText: '前往设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            }
          }
        });
      }
    });
  },
  
  // 结束语音录制
  async stopVoiceRecord(e) {
    console.log('停止录音');
    if (this.data.isRecording) {
      this.recorderManager.stop();
      
      // 停止转写反馈
      this.stopRecognitionFeedback();
      
      setTimeout(() => {
        // 隐藏语音识别反馈
        this.setData({
          showRecognitionFeedback: false
        });
      }, 500);
    }
  },

  // 开始语音识别反馈
  startRecognitionFeedback() {
    // 清除可能存在的定时器
    this.stopRecognitionFeedback();
    
    // 设置初始反馈文本
    this.setData({
      recognitionFeedbackText: '正在聆听...'
    });
    
    // 模拟实时语音识别过程
    const mockWords = ['我', '我想', '我想问一下', '我想问一下，'];
    let wordIndex = 0;
    
    this.data.recognitionFeedbackTimer = setInterval(() => {
      if (!this.data.isRecording && this.data.listeningStatus !== 'listening') {
        this.stopRecognitionFeedback();
        return;
      }
      
      wordIndex = (wordIndex + 1) % mockWords.length;
      this.setData({
        recognitionFeedbackText: mockWords[wordIndex]
      });
    }, 800);
  },
  
  // 停止语音识别反馈
  stopRecognitionFeedback() {
    if (this.data.recognitionFeedbackTimer) {
      clearInterval(this.data.recognitionFeedbackTimer);
      this.data.recognitionFeedbackTimer = null;
    }
  },
  
  // 更新语音识别反馈文本
  updateRecognitionFeedbackText(text) {
    this.setData({
      recognitionFeedbackText: text
    });
  },

  // 初始化离线语音指令
  initOfflineCommands() {
    // 从本地存储加载离线指令设置
    const offlineCommandsEnabled = wx.getStorageSync('offlineCommandsEnabled');
    if (offlineCommandsEnabled !== '') {
      this.setData({
        offlineCommandsEnabled
      });
    }
    
    console.log('离线语音指令' + (this.data.offlineCommandsEnabled ? '已启用' : '未启用'));
  },
  
  // 切换离线语音指令
  toggleOfflineCommands() {
    const newValue = !this.data.offlineCommandsEnabled;
    this.setData({
      offlineCommandsEnabled: newValue,
      showOfflineCommandHelp: newValue && this.data.showOfflineCommandHelp
    });
    wx.setStorageSync('offlineCommandsEnabled', newValue);
      wx.showToast({
      title: newValue ? '离线指令已启用' : '离线指令已关闭',
          icon: 'none'
        });
  },
  
  // 显示/隐藏离线指令帮助
  toggleOfflineCommandHelp() {
    this.setData({
      showOfflineCommandHelp: !this.data.showOfflineCommandHelp
    });
  },
  
  // 处理离线语音指令
  processOfflineCommand(text) {
    if (!this.data.offlineCommandsEnabled) return false;
    
    // 检查文本是否匹配任何离线指令
    const command = this.data.offlineCommands.find(cmd => text.includes(cmd.command));
    if (!command) return false;
    
    console.log('检测到离线指令:', command.command, command.action);
    
    // 执行对应的操作
    switch (command.action) {
      case 'help':
        this.showOfflineCommandHelp();
        break;
        
      case 'clear':
        this.clearCurrentConversation();
        break;
        
      case 'home':
        wx.switchTab({
          url: '/pages/index/index'
        });
        break;
        
      case 'settings':
        wx.navigateTo({
          url: '/pages/settings/settings'
        });
        break;
        
      case 'quit':
        wx.navigateBack();
        break;
        
      default:
        return false;
    }
    
    // 指令已处理
    return true;
  },
  
  // 显示离线指令帮助
  showOfflineCommandHelp() {
    let helpContent = '离线语音指令列表：\n';
    this.data.offlineCommands.forEach(cmd => {
      helpContent += `"${cmd.command}": ${cmd.description}\n`;
    });
    
    wx.showModal({
      title: '语音指令帮助',
      content: helpContent,
      showCancel: false,
      confirmText: '我知道了'
    });
    
    this.setData({
      showOfflineCommandHelp: true
    });
  },
  
  // 清空当前对话
  clearCurrentConversation() {
    if (this.data.activeTab === 'service') {
      this.setData({
        messages: []
      });
      this.saveMessagesToStorage([]);
    } else {
      this.setData({
        aiMessages: []
      });
      wx.setStorageSync('aiMessages', []);
    }
        
      wx.showToast({
      title: '对话记录已清空',
      icon: 'success'
    });
  },

  // 录音结束回调函数
  onRecorderStop(res) {
    const { tempFilePath } = res;
    console.log('录音文件：', tempFilePath);
    
    // 如果启用了降噪处理，先进行降噪
    if (this.data.noiseReductionEnabled) {
      this.processNoiseReduction(tempFilePath);
    } else {
      // 使用优化的语音识别处理
      if (this.data.optimizedRecognition) {
        this.handleOptimizedRecognition(tempFilePath);
      } else {
        // 使用原始处理方式
        this.uploadAndRecognize(tempFilePath);
      }
      
      // 如果启用了情感分析，分析录音的情感
      if (this.data.emotionAnalysisEnabled) {
        this.analyzeVoiceEmotion(tempFilePath);
      }
    }
  },

  // 初始化音频缓存
  initAudioCache() {
    try {
      // 从本地存储加载缓存设置
      const audioCacheEnabled = wx.getStorageSync('audioCacheEnabled');
      if (audioCacheEnabled !== '') {
        this.setData({
          audioCacheEnabled
        });
      }
      
      // 加载缓存的音频列表
      const audioCacheList = wx.getStorageSync('audioCacheList');
      if (audioCacheList) {
        this.setData({
          audioCacheList: JSON.parse(audioCacheList) || []
        });
      }
      
      console.log('音频缓存' + (this.data.audioCacheEnabled ? '已启用' : '未启用'), 
                  '缓存数量:', this.data.audioCacheList.length);
    } catch (error) {
      console.error('初始化音频缓存失败:', error);
    }
  },
  
  // 切换音频缓存功能
  toggleAudioCache() {
    const newValue = !this.data.audioCacheEnabled;
    this.setData({
      audioCacheEnabled: newValue
    });
    wx.setStorageSync('audioCacheEnabled', newValue);
    wx.showToast({
      title: newValue ? '音频缓存已启用' : '音频缓存已关闭',
      icon: 'none'
    });
    
    // 如果关闭缓存，清除现有缓存
    if (!newValue) {
      this.clearAudioCache();
    }
  },
  
  // 清除音频缓存
  clearAudioCache() {
    this.setData({
      audioCacheList: []
    });
    wx.setStorageSync('audioCacheList', JSON.stringify([]));
    
        wx.showToast({
      title: '音频缓存已清除',
      icon: 'success'
    });
  },
  
  // 保存音频到缓存
  saveAudioToCache(text, fileID, language, voice) {
    if (!this.data.audioCacheEnabled) return;
    
    // 检查是否已经缓存了相同内容
    const existingAudio = this.data.audioCacheList.find(item => 
      item.text === text && item.language === language && item.voice === voice
    );
    
    if (existingAudio) {
      console.log('已存在相同内容的缓存:', text.substring(0, 20));
      return;
    }
    
    // 创建缓存条目
    const cacheItem = {
      id: Date.now().toString(),
      text,
      fileID,
      language,
      voice,
      timestamp: Date.now()
    };
    
    // 如果缓存已满，移除最旧的项目
    let updatedCache = [...this.data.audioCacheList];
    if (updatedCache.length >= this.data.maxAudioCacheSize) {
      // 按时间戳排序
      updatedCache.sort((a, b) => a.timestamp - b.timestamp);
      // 移除最旧的一项
      updatedCache.shift();
    }
    
    // 添加新项目
    updatedCache.push(cacheItem);
    
    // 更新状态并保存到本地存储
    this.setData({
      audioCacheList: updatedCache
    });
    wx.setStorageSync('audioCacheList', JSON.stringify(updatedCache));
    
    console.log('音频已缓存:', text.substring(0, 20), '当前缓存数量:', updatedCache.length);
  },
  
  // 从缓存中查找音频
  findAudioInCache(text, language, voice) {
    if (!this.data.audioCacheEnabled) return null;
    
    // 查找完全匹配的缓存
    const exactMatch = this.data.audioCacheList.find(item => 
      item.text === text && item.language === language && item.voice === voice
    );
    
    if (exactMatch) {
      console.log('命中精确缓存:', text.substring(0, 20));
      return exactMatch;
    }
    
    // 未找到缓存
    return null;
  },

  // 初始化优化的语音识别
  initOptimizedRecognition() {
    try {
      // 从本地存储加载优化设置
      const optimizedRecognition = wx.getStorageSync('optimizedRecognition');
      if (optimizedRecognition !== '') {
        this.setData({
          optimizedRecognition
        });
      }
      
      console.log('语音识别优化' + (this.data.optimizedRecognition ? '已启用' : '未启用'));
    } catch (error) {
      console.error('初始化语音识别优化失败:', error);
    }
  },
  
  // 切换优化的语音识别
  toggleOptimizedRecognition() {
    const newValue = !this.data.optimizedRecognition;
    this.setData({
      optimizedRecognition: newValue,
      recognitionBuffer: []
    });
    wx.setStorageSync('optimizedRecognition', newValue);
        wx.showToast({
      title: newValue ? '语音优化已启用' : '语音优化已关闭',
          icon: 'none'
        });
  },
  
  // 优化的语音识别处理
  handleOptimizedRecognition(tempFilePath) {
    if (!this.data.optimizedRecognition) {
      // 如果未启用优化，使用普通上传和识别流程
      return this.uploadAndRecognize(tempFilePath);
    }
    
    // 使用优化流程
    // 1. 添加到缓冲区
    const buffer = [...this.data.recognitionBuffer];
    buffer.push({
      filePath: tempFilePath,
      timestamp: Date.now()
    });
    
    // 2. 如果达到最大缓冲区长度，或者静音检测到结束，则合并并识别
    if (buffer.length >= this.data.maxBufferLength) {
      // 清空缓冲区
      this.setData({
        recognitionBuffer: []
      });
      
      // 合并音频文件（简化版，实际中可能需要更复杂的处理）
      this.mergeAndRecognizeBufferedAudio(buffer);
    } else {
      // 更新缓冲区
      this.setData({
        recognitionBuffer: buffer
      });
      
      // 快速上传当前片段并尝试预识别
      this.preRecognizeAudio(tempFilePath);
    }
  },
  
  // 合并和识别缓冲的音频
  mergeAndRecognizeBufferedAudio(buffer) {
    console.log('合并音频缓冲区，共有片段:', buffer.length);
    
    // 在实际应用中，这里可能需要使用音频处理API来合并多个文件
    // 简化版：我们使用最后一个录制的文件进行识别
    const lastAudio = buffer[buffer.length - 1];
    
    // 进行识别
    this.uploadAndRecognize(lastAudio.filePath, true);
  },
  
  // 预识别音频（快速但可能不太准确）
  preRecognizeAudio(tempFilePath) {
    // 使用较低质量设置快速上传
    const uploadTask = wx.cloud.uploadFile({
      cloudPath: `audio/pre_${Date.now()}.mp3`,
      filePath: tempFilePath,
      success: uploadRes => {
        const fileID = uploadRes.fileID;
        
        // 调用语音识别云函数，使用快速模式
        wx.cloud.callFunction({
          name: 'voiceAPI',
          data: {
            action: 'speechToText',
            params: {
              fileID: fileID,
              language: this.data.currentLanguage,
              mode: 'fast' // 快速模式，优先速度而非准确性
            }
          },
          success: res => {
            if (res.result && res.result.success && res.result.text) {
              const voiceResult = res.result.text;
              console.log('预识别结果:', voiceResult);
              
              // 更新识别反馈，但不发送给AI
              this.updateRecognitionFeedbackText(voiceResult);
            }
          }
        });
      }
    });
  },
  
  // 上传并识别音频（标准流程）
  uploadAndRecognize(tempFilePath, isHighQuality = false) {
    wx.showLoading({ title: '识别中...' });
    
    const uploadTask = wx.cloud.uploadFile({
      cloudPath: `audio/${Date.now()}.mp3`,
      filePath: tempFilePath,
      success: uploadRes => {
        const fileID = uploadRes.fileID;
        console.log('上传成功，文件ID:', fileID);
        
        // 调用语音识别云函数
        wx.cloud.callFunction({
          name: 'voiceAPI',
          data: {
            action: 'speechToText',
            params: {
              fileID: fileID,
              language: this.data.currentLanguage,
              mode: isHighQuality ? 'accurate' : 'standard' // 根据需要设置识别模式
            }
          },
          success: res => {
            wx.hideLoading();
            
            if (res.result && res.result.success && res.result.text) {
              const voiceResult = res.result.text;
              console.log('语音识别结果:', voiceResult);
              
              // 检查是否为离线指令
              if (this.data.offlineCommandsEnabled && this.processOfflineCommand(voiceResult)) {
                // 如果是离线指令，不继续处理语音输入
                this.setData({
                  isRecording: false,
                  showVoiceResult: false,
                  voiceResult: ''
        });
        return;
      }
      
              if (this.data.continuousVoiceMode) {
                // 在连续对话模式下直接发送识别的文本
                this.setData({ 
                  isRecording: false,
                  showVoiceResult: false,
                  voiceResult: ''
                });
                this.handleContinuousVoiceInput(voiceResult);
              } else {
                // 在普通模式下显示识别结果，让用户确认
                this.setData({
                  isRecording: false,
                  showVoiceResult: true,
                  voiceResult: voiceResult
                });
              }
            } else {
              wx.showToast({
                title: '语音识别失败',
                icon: 'none'
              });
              this.setData({
                isRecording: false
              });
            }
          },
          fail: err => {
            wx.hideLoading();
            console.error('调用语音识别失败:', err);
            wx.showToast({
              title: '语音识别服务异常',
              icon: 'none'
            });
            this.setData({
              isRecording: false
            });
          }
        });
      },
      fail: err => {
        wx.hideLoading();
        console.error('上传录音失败:', err);
        wx.showToast({
          title: '上传录音失败',
          icon: 'none'
        });
        this.setData({
          isRecording: false
        });
      }
    });
  },

  // 初始化语音质量设置
  initVoiceQualitySettings() {
    try {
      // 从本地存储加载语音质量设置
      const voiceQuality = wx.getStorageSync('voiceQuality');
      if (voiceQuality) {
        this.setData({ voiceQuality });
      }
      
      // 从本地存储加载语速设置
      const voiceRate = wx.getStorageSync('voiceRate');
      if (voiceRate !== '') {
        this.setData({ voiceRate: parseInt(voiceRate) });
      }
      
      // 从本地存储加载音调设置
      const voicePitch = wx.getStorageSync('voicePitch');
      if (voicePitch !== '') {
        this.setData({ voicePitch: parseInt(voicePitch) });
      }
      
      // 从本地存储加载文件大小优化设置
      const optimizeFileSize = wx.getStorageSync('optimizeFileSize');
      if (optimizeFileSize !== '') {
        this.setData({ optimizeFileSize });
      }
      
      console.log('语音质量设置已加载:', this.data.voiceQuality, '语速:', this.data.voiceRate, '音调:', this.data.voicePitch, '文件大小优化:', this.data.optimizeFileSize);
    } catch (error) {
      console.error('初始化语音质量设置失败:', error);
    }
  },
  
  // 保存语音质量设置到本地存储
  saveVoiceQualitySettings() {
    wx.setStorageSync('voiceQuality', this.data.voiceQuality);
    wx.setStorageSync('voiceRate', this.data.voiceRate.toString());
    wx.setStorageSync('voicePitch', this.data.voicePitch.toString());
    wx.setStorageSync('optimizeFileSize', this.data.optimizeFileSize);
  },
  
  // 切换语音质量设置面板
  toggleVoiceQualitySettings() {
    this.setData({
      showVoiceQualitySettings: !this.data.showVoiceQualitySettings
    });
  },
  
  // 设置语音质量
  setVoiceQuality(e) {
    const quality = e.currentTarget.dataset.quality;
    this.setData({ voiceQuality: quality });
    this.saveVoiceQualitySettings();
        
      wx.showToast({
      title: `语音质量已设置为${quality === 'high' ? '高' : quality === 'low' ? '低' : '标准'}`,
      icon: 'none'
    });
  },
  
  // 调整语速
  adjustVoiceRate(e) {
    const rate = parseInt(e.detail.value);
    this.setData({ voiceRate: rate });
    this.saveVoiceQualitySettings();
  },
  
  // 调整音调
  adjustVoicePitch(e) {
    const pitch = parseInt(e.detail.value);
    this.setData({ voicePitch: pitch });
    this.saveVoiceQualitySettings();
  },

  // 切换文件大小优化
  toggleOptimizeFileSize() {
    this.setData({
      optimizeFileSize: !this.data.optimizeFileSize
    });
    this.saveVoiceQualitySettings();
    
    wx.showToast({
      title: this.data.optimizeFileSize ? '文件大小优化已启用' : '文件大小优化已关闭',
      icon: 'none'
    });
  },

  // 初始化情感分析
  initEmotionAnalysis() {
    try {
      // 从本地存储加载情感分析设置
      const emotionAnalysisEnabled = wx.getStorageSync('emotionAnalysisEnabled');
      if (emotionAnalysisEnabled !== '') {
        this.setData({ emotionAnalysisEnabled });
      }
      
      console.log('情感分析' + (this.data.emotionAnalysisEnabled ? '已启用' : '未启用'));
    } catch (error) {
      console.error('初始化情感分析失败:', error);
    }
  },
  
  // 切换情感分析
  toggleEmotionAnalysis() {
    const newValue = !this.data.emotionAnalysisEnabled;
    this.setData({
      emotionAnalysisEnabled: newValue
    });
    wx.setStorageSync('emotionAnalysisEnabled', newValue);
    wx.showToast({
      title: newValue ? '情感分析已启用' : '情感分析已关闭',
      icon: 'none'
    });
  },
  
  // 分析语音情感
  analyzeVoiceEmotion(tempFilePath) {
    // 上传语音文件到云存储
    wx.cloud.uploadFile({
      cloudPath: `audio/emotion_${Date.now()}.mp3`,
      filePath: tempFilePath,
      success: uploadRes => {
        const fileID = uploadRes.fileID;
        console.log('情感分析上传成功，文件ID:', fileID);
        
        // 调用语音情感分析云函数
        wx.cloud.callFunction({
          name: 'voiceAPI',
          data: {
            action: 'analyzeEmotion',
            params: {
              fileID: fileID,
              language: this.data.currentLanguage
            }
          },
          success: res => {
            if (res.result && res.result.success) {
              const emotionResult = res.result;
              console.log('情感分析结果:', emotionResult);
              
              // 计算格式化的情感得分，用于显示
              const scores = emotionResult.emotions.scores;
              const formattedScores = {};
              
              // 为每个情感计算百分比和格式化的文本值
              Object.keys(scores).forEach(emotion => {
                formattedScores[emotion] = {
                  percent: scores[emotion] * 100,
                  text: (scores[emotion] * 100).toFixed(0)
                };
              });
              
              // 更新情感分析结果
              this.setData({
                currentEmotion: emotionResult.emotions.dominant,
                emotionScores: scores,
                formattedEmotionScores: formattedScores
              });
              
              // 显示情感反馈
              this.showEmotionFeedback(emotionResult.emotions.dominant);
            } else {
              console.error('情感分析失败:', res.result ? res.result.error : '未知错误');
            }
          },
          fail: err => {
            console.error('调用情感分析云函数失败:', err);
          }
        });
      },
      fail: err => {
        console.error('上传情感分析录音失败:', err);
      }
    });
  },
  
  // 显示情感反馈
  showEmotionFeedback(emotion) {
    // 情感映射到中文
    const emotionNames = {
      happy: '开心',
      sad: '伤心',
      angry: '生气',
      fear: '害怕',
      surprise: '惊讶',
      neutral: '平静'
    };
    
    const emotionName = emotionNames[emotion] || '未知情感';
    const emotionColor = this.data.emotionColors[emotion] || '#A9A9A9';
    
    // 显示情感提示
    wx.showToast({
      title: `检测到情感: ${emotionName}`,
        icon: 'none',
        duration: 2000
      });
      
    // 可以在这里添加更多情感反馈，比如更改UI元素颜色等
  },
  
  // 获取情感颜色
  getEmotionColor(emotion) {
    return this.data.emotionColors[emotion] || this.data.emotionColors.neutral;
  },

  // 初始化降噪处理
  initNoiseReduction() {
    try {
      // 从本地存储加载降噪设置
      const noiseReductionEnabled = wx.getStorageSync('noiseReductionEnabled');
      if (noiseReductionEnabled !== '') {
        this.setData({ noiseReductionEnabled });
      }
      
      const noiseReductionLevel = wx.getStorageSync('noiseReductionLevel');
      if (noiseReductionLevel) {
        this.setData({ noiseReductionLevel });
      }
      
      const preserveVoice = wx.getStorageSync('preserveVoice');
      if (preserveVoice !== '') {
        this.setData({ preserveVoice });
      }
      
      // 加载降噪处理统计数据
      const noiseReductionStats = wx.getStorageSync('noiseReductionStats');
      if (noiseReductionStats) {
        const stats = JSON.parse(noiseReductionStats) || {
          totalProcessed: 0,
          totalSaved: 0,
          averageReduction: 0,
          successRate: 100
        };
        
        // 确保有格式化后的数据
        stats.formattedTotalSaved = (stats.totalSaved / 1024 / 1024).toFixed(2);
        stats.formattedAverageReduction = stats.averageReduction.toFixed(1);
        
        this.setData({ noiseReductionStats: stats });
      }
      
      console.log('降噪处理' + (this.data.noiseReductionEnabled ? '已启用' : '未启用'),
        '级别:', this.data.noiseReductionLevel,
        '保留语音:', this.data.preserveVoice);
    } catch (error) {
      console.error('初始化降噪处理失败:', error);
    }
  },
  
  // 切换降噪处理
  toggleNoiseReduction() {
    const newValue = !this.data.noiseReductionEnabled;
    this.setData({
      noiseReductionEnabled: newValue
    });
    wx.setStorageSync('noiseReductionEnabled', newValue);
    wx.showToast({
      title: newValue ? '降噪处理已启用' : '降噪处理已关闭',
      icon: 'none'
    });
  },

  // 设置降噪级别
  setNoiseReductionLevel(e) {
    const level = e.currentTarget.dataset.level;
    this.setData({
      noiseReductionLevel: level
    });
    wx.setStorageSync('noiseReductionLevel', level);
        wx.showToast({
      title: `降噪级别已设置为${level === 'high' ? '高' : level === 'low' ? '低' : '中'}`,
          icon: 'none'
        });
  },
  
  // 切换保留语音
  togglePreserveVoice() {
    const newValue = !this.data.preserveVoice;
    this.setData({
      preserveVoice: newValue
    });
    wx.setStorageSync('preserveVoice', newValue);
    wx.showToast({
      title: newValue ? '已启用保留语音' : '已关闭保留语音',
      icon: 'none'
    });
  },

  // 切换降噪设置面板
  toggleNoiseReductionSettings() {
    this.setData({
      showNoiseReductionSettings: !this.data.showNoiseReductionSettings
    });
  },
  
  // 更新降噪处理统计数据
  updateNoiseReductionStats(result) {
    if (!result || !result.success) return;
    
    // 计算文件大小减少的百分比
    const sizeChangeString = result.sizeChange || "0%";
    const sizeChangePercent = parseFloat(sizeChangeString.replace('%', ''));
    
    // 获取现有统计数据
    const stats = this.data.noiseReductionStats || {
      totalProcessed: 0,
      totalSaved: 0,
      averageReduction: 0,
      successRate: 100
    };
    
    // 更新统计数据
    stats.totalProcessed += 1;
    
    // 计算节省的大小（字节）
    const savedBytes = result.originalSize - result.processedSize;
    stats.totalSaved += savedBytes;
    
    // 计算平均降噪率
    const totalReduction = stats.averageReduction * (stats.totalProcessed - 1);
    stats.averageReduction = (totalReduction + Math.abs(sizeChangePercent)) / stats.totalProcessed;
    
    // 添加格式化后的数据
    stats.formattedTotalSaved = (stats.totalSaved / 1024 / 1024).toFixed(2);
    stats.formattedAverageReduction = stats.averageReduction.toFixed(1);
    
    // 保存更新后的统计数据
    this.setData({
      noiseReductionStats: stats
    });
    wx.setStorageSync('noiseReductionStats', JSON.stringify(stats));
    
    console.log('降噪处理统计已更新:', stats);
  },
  
  // 显示降噪处理结果
  showNoiseReductionResult(result) {
    if (!result || !result.success) return;
    
    // 计算大小变化百分比
    const originalSizeKB = Math.round(result.originalSize / 1024);
    const processedSizeKB = Math.round(result.processedSize / 1024);
    
    let message = `降噪处理完成\n`;
    message += `处理前: ${originalSizeKB}KB\n`;
    message += `处理后: ${processedSizeKB}KB\n`;
    message += `变化率: ${result.sizeChange}`;
    
    // 显示结果窗口
    wx.showModal({
      title: '降噪处理结果',
      content: message,
      showCancel: false,
      confirmText: '确定'
    });
  },
  
  // 处理降噪
  processNoiseReduction(tempFilePath) {
    wx.showLoading({ title: '降噪处理中...' });
    
    // 上传语音文件到云存储
    wx.cloud.uploadFile({
      cloudPath: `audio/original_${Date.now()}.mp3`,
      filePath: tempFilePath,
      success: uploadRes => {
        const fileID = uploadRes.fileID;
        console.log('降噪处理上传成功，文件ID:', fileID);
        
        // 调用降噪处理云函数
        wx.cloud.callFunction({
          name: 'voiceAPI',
          data: {
            action: 'reduceNoise',
            params: {
              fileID: fileID,
              level: this.data.noiseReductionLevel,
              preserveVoice: this.data.preserveVoice
            }
          },
          success: res => {
            wx.hideLoading();
            
            if (res.result && res.result.success && res.result.fileID) {
              console.log('降噪处理成功:', res.result);
              
              // 更新统计数据
              this.updateNoiseReductionStats(res.result);
              
              // 可选：显示处理结果
              if (this.data.showNoiseReductionResults) {
                this.showNoiseReductionResult(res.result);
              }
              
              // 下载降噪后的文件
              wx.cloud.downloadFile({
                fileID: res.result.fileID,
                success: downloadRes => {
                  const noiselessFilePath = downloadRes.tempFilePath;
                  
                  // 使用降噪后的文件进行识别
                  if (this.data.optimizedRecognition) {
                    this.handleOptimizedRecognition(noiselessFilePath);
                  } else {
                    this.uploadAndRecognize(noiselessFilePath);
                  }
                  
                  // 如果启用了情感分析，分析录音的情感
                  if (this.data.emotionAnalysisEnabled) {
                    this.analyzeVoiceEmotion(noiselessFilePath);
                  }
                },
                fail: err => {
                  console.error('下载降噪后的文件失败:', err);
                  wx.showToast({
                    title: '降噪文件下载失败',
                    icon: 'none'
                  });
                  
                  // 使用原始文件继续处理
                  if (this.data.optimizedRecognition) {
                    this.handleOptimizedRecognition(tempFilePath);
                  } else {
                    this.uploadAndRecognize(tempFilePath);
                  }
                }
              });
            } else {
              console.error('降噪处理失败:', res.result ? res.result.error : '未知错误');
              wx.showToast({
                title: '降噪处理失败',
                icon: 'none'
              });
              
              // 使用原始文件继续处理
              if (this.data.optimizedRecognition) {
                this.handleOptimizedRecognition(tempFilePath);
              } else {
                this.uploadAndRecognize(tempFilePath);
              }
            }
          },
          fail: err => {
            wx.hideLoading();
            console.error('调用降噪处理云函数失败:', err);
            wx.showToast({
              title: '降噪处理服务异常',
              icon: 'none'
            });
            
            // 使用原始文件继续处理
            if (this.data.optimizedRecognition) {
              this.handleOptimizedRecognition(tempFilePath);
            } else {
              this.uploadAndRecognize(tempFilePath);
            }
          }
        });
      },
      fail: err => {
        wx.hideLoading();
        console.error('上传降噪处理录音失败:', err);
        wx.showToast({
          title: '上传录音失败',
          icon: 'none'
        });
        
        // 使用原始文件继续处理
        if (this.data.optimizedRecognition) {
          this.handleOptimizedRecognition(tempFilePath);
        } else {
          this.uploadAndRecognize(tempFilePath);
        }
      }
    });
  },

  // 切换降噪结果显示
  toggleNoiseReductionResults() {
    const newValue = !this.data.showNoiseReductionResults;
    this.setData({
      showNoiseReductionResults: newValue
    });
    wx.setStorageSync('showNoiseReductionResults', newValue);
    wx.showToast({
      title: newValue ? '已启用降噪结果显示' : '已关闭降噪结果显示',
      icon: 'none'
    });
  },
}); 