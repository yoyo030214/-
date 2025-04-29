// 语音API云函数 - 处理语音识别和语音合成请求
const cloud = require('wx-server-sdk');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('./config');
const speechRecognition = require('./recognition');
const speechSynthesis = require('./synthesis');
const emotionAnalysis = require('./emotion');
const { reduceNoise } = require('./noise_reduction');

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 临时文件目录
const TMP_DIR = os.tmpdir();

// 语音识别API配置
const VOICE_RECOGNIZE_API = {
  url: 'https://eastasia.api.cognitive.microsoft.com/speechtotext/v3.1/transcriptions',
  key: process.env.AZURE_SPEECH_KEY || 'your-azure-speech-key',
  region: process.env.AZURE_SPEECH_REGION || 'eastasia'
};

// 语音合成API配置
const VOICE_TTS_API = {
  url: 'https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1',
  key: process.env.AZURE_SPEECH_KEY || 'your-azure-speech-key',
  region: process.env.AZURE_SPEECH_REGION || 'eastasia'
};

/**
 * 处理语音识别请求
 * @param {Object} event 事件对象
 * @param {Object} context 上下文
 */
async function handleRecognize(event, context) {
  try {
    console.log('语音识别请求参数:', event);
    
    // 获取上传的音频文件
    const { fileID } = event;
    if (!fileID) {
      return { success: false, error: '缺少音频文件ID' };
    }
    
    // 下载云存储中的音频文件
    console.log('开始下载云存储文件:', fileID);
    const res = await cloud.downloadFile({
      fileID: fileID
    });
    
    const tempFilePath = path.join(TMP_DIR, `voice_${Date.now()}.wav`);
    fs.writeFileSync(tempFilePath, res.fileContent);
    console.log('文件已保存到:', tempFilePath);
    
    // 调用Azure语音识别API
    console.log('调用Azure语音识别API');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath));
    
    const recognizeResponse = await axios.post(
      VOICE_RECOGNIZE_API.url,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Ocp-Apim-Subscription-Key': VOICE_RECOGNIZE_API.key,
          'Content-Type': 'multipart/form-data'
        },
        params: {
          language: 'zh-CN'
        }
      }
    );
    
    console.log('语音识别API响应:', recognizeResponse.data);
    
    // 删除临时文件
    fs.unlinkSync(tempFilePath);
    
    // 返回识别结果
    return {
      success: true,
      text: recognizeResponse.data.DisplayText || recognizeResponse.data.text || '',
      confidence: recognizeResponse.data.Confidence || recognizeResponse.data.confidence || 0
    };
  } catch (error) {
    console.error('语音识别失败:', error);
    
    // 删除可能存在的临时文件
    try {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (e) {
      console.error('删除临时文件失败:', e);
    }
    
    return {
      success: false,
      error: error.message || '语音识别服务错误'
    };
  }
}

/**
 * 处理语音合成请求
 * @param {Object} event 事件对象
 * @param {Object} context 上下文
 */
async function handleTTS(event, context) {
  try {
    console.log('语音合成请求参数:', event);
    
    const { text, voice = 'zh-CN-XiaoxiaoNeural' } = event;
    if (!text) {
      return { success: false, error: '缺少文本内容' };
    }
    
    // SSML格式文本
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
        <voice name="${voice}">
          ${text}
        </voice>
      </speak>
    `;
    
    // 调用Azure TTS API
    console.log('调用Azure TTS API');
    const ttsResponse = await axios.post(
      VOICE_TTS_API.url,
      ssml,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': VOICE_TTS_API.key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
        },
        responseType: 'arraybuffer'
      }
    );
    
    console.log('获取到TTS音频数据, 长度:', ttsResponse.data.length);
    
    // 将音频数据上传到云存储
    const tempFilePath = path.join(TMP_DIR, `tts_${Date.now()}.mp3`);
    fs.writeFileSync(tempFilePath, ttsResponse.data);
    
    // 上传到云存储
    const uploadRes = await cloud.uploadFile({
      cloudPath: `audio/tts/${Date.now()}.mp3`,
      fileContent: fs.readFileSync(tempFilePath)
    });
    
    console.log('文件已上传到云存储:', uploadRes.fileID);
    
    // 获取文件下载链接
    const fileRes = await cloud.getTempFileURL({
      fileList: [uploadRes.fileID]
    });
    
    // 删除临时文件
    fs.unlinkSync(tempFilePath);
    
    // 返回合成结果
    return {
      success: true,
      fileID: uploadRes.fileID,
      url: fileRes.fileList[0].tempFileURL
    };
  } catch (error) {
    console.error('语音合成失败:', error);
    
    // 删除可能存在的临时文件
    try {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (e) {
      console.error('删除临时文件失败:', e);
    }
    
    return {
      success: false,
      error: error.message || '语音合成服务错误'
    };
  }
}

/**
 * 语音API云函数入口
 * @param {Object} event 事件对象
 * @param {string} event.action 操作类型：'speechToText'|'textToSpeech'|'voiceDialog'|'analyzeEmotion'|'reduceNoise'
 * @param {Object} event.params 操作参数
 * @param {Object} context 上下文
 */
exports.main = async (event, context) => {
  console.log('收到请求:', event);
  
  // 执行对应的操作
  try {
    const { action, params } = event;
    
    // 根据action调用不同的功能
    switch (action) {
      // 语音识别：将语音转换为文本
      case 'speechToText':
        return await speechRecognition.speechToText(params);
      
      // 语音合成：将文本转换为语音
      case 'textToSpeech':
        return await speechSynthesis.textToSpeech(params);
      
      // 语音对话：直接将语音输入转换为语音输出（语音识别+AI处理+语音合成）
      case 'voiceDialog':
        // 1. 先将语音转为文本
        const recognitionResult = await speechRecognition.speechToText(params);
        if (!recognitionResult.success) {
          return recognitionResult;
        }
        
        // 2. 根据语音识别结果调用AI处理（调用localAI云函数）
        const aiResult = await cloud.callFunction({
          name: 'localAI',
          data: {
            query: recognitionResult.text,
            sessionId: params.sessionId || 'default'
          }
        });
        
        // 3. 将AI回答转为语音
        return await speechSynthesis.textToSpeech({
          text: aiResult.result.answer,
          voice: params.voice || config.azure.speech.synthesis.voice,
          format: params.format || config.voiceService.defaultFormat
        });
      
      // 情感分析：分析语音中的情感
      case 'analyzeEmotion':
        return await emotionAnalysis.analyzeEmotion(params);
      
      // 降噪处理
      case 'reduceNoise':
        return await reduceNoise(params);
      
      default:
        return {
          success: false,
          error: '未知的操作类型: ' + action
        };
    }
  } catch (error) {
    console.error('处理请求失败:', error);
    return {
      success: false,
      error: error.message || '处理请求失败'
    };
  }
}; 