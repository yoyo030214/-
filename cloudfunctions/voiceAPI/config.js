// 语音服务配置文件
module.exports = {
  // 临时文件配置
  tempFile: {
    dir: '/tmp', // 云函数环境中可写的临时目录
    maxSize: 10 * 1024 * 1024 // 10MB，临时文件最大大小
  },
  
  // 语音服务通用配置
  voiceService: {
    maxTextLength: 5000, // 最大文本长度限制
    maxAudioDuration: 60, // 秒，最大音频长度
    defaultFormat: 'mp3',
    supportedFormats: ['mp3', 'wav', 'ogg', 'm4a'],
    supportedSampleRates: [8000, 16000, 24000, 44100, 48000]
  },
  
  // Azure 语音服务配置
  azure: {
    speech: {
      key: process.env.AZURE_SPEECH_KEY || '请在环境变量中设置 AZURE_SPEECH_KEY',
      endpoint: process.env.AZURE_SPEECH_ENDPOINT || 'https://eastasia.api.cognitive.microsoft.com/sts/v1.0',
      region: process.env.AZURE_SPEECH_REGION || 'eastasia',
      
      // 语音识别配置
      recognition: {
        language: 'zh-CN', // 默认语言
        format: 'detailed', // simple 或 detailed
        profanityOption: 'masked', // raw, masked, removed
        endpoint: '/speech/recognition/conversation/cognitiveservices/v1'
      },
      
      // 语音合成配置
      synthesis: {
        language: 'zh-CN', // 默认语言
        voice: 'zh-CN-XiaoxiaoNeural', // 默认语音
        outputFormat: 'audio-24khz-96kbitrate-mono-mp3', // 默认输出格式
        endpoint: '/cognitiveservices/v1'
      }
    }
  },
  
  // 百度语音服务配置（备用）
  baidu: {
    speech: {
      appId: process.env.BAIDU_SPEECH_APP_ID,
      apiKey: process.env.BAIDU_SPEECH_API_KEY,
      secretKey: process.env.BAIDU_SPEECH_SECRET_KEY,
      endpoint: 'https://vop.baidu.com/server_api'
    }
  },
  
  // 错误消息
  errorMessages: {
    noApiKey: '未配置API密钥，请检查环境变量',
    fileDownloadFailed: '音频文件下载失败',
    audioProcessFailed: '音频处理失败',
    textTooLong: '文本长度超出限制',
    unsupportedFormat: '不支持的音频格式',
    recognitionFailed: '语音识别失败',
    synthesisFailed: '语音合成失败'
  }
}; 