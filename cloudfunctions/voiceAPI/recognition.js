// 语音识别模块 - 将语音转换为文本
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const cloud = require('wx-server-sdk');
const config = require('./config');

// 初始化云函数
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

/**
 * 获取临时文件路径
 * @param {string} fileExt 文件扩展名，不含点，如 'mp3'
 * @returns {string} 临时文件路径
 */
function getTempFilePath(fileExt) {
  const randomString = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  return path.join(config.tempFile.dir, `voice_${timestamp}_${randomString}.${fileExt}`);
}

/**
 * 下载云存储文件到临时路径
 * @param {string} fileId 云存储文件ID
 * @returns {Promise<string>} 临时文件路径
 */
async function downloadFromCloudStorage(fileId) {
  try {
    const result = await cloud.downloadFile({
      fileID: fileId
    });
    
    // 获取文件扩展名
    const fileExt = path.extname(fileId).slice(1) || 'wav';
    const tempFilePath = getTempFilePath(fileExt);
    
    // 写入临时文件
    fs.writeFileSync(tempFilePath, result.fileContent);
    
    return tempFilePath;
  } catch (error) {
    console.error('下载云存储文件失败:', error);
    throw new Error(config.errorMessages.fileDownloadFailed);
  }
}

/**
 * 获取Azure访问令牌
 * @returns {Promise<string>} 访问令牌
 */
async function getAzureAccessToken() {
  try {
    const tokenUrl = `https://${config.azure.speech.region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
    console.log('获取访问令牌URL:', tokenUrl);
    
    const response = await axios({
      method: 'post',
      url: tokenUrl,
      headers: {
        'Ocp-Apim-Subscription-Key': config.azure.speech.key,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`获取访问令牌失败，状态码：${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('获取Azure访问令牌失败:', error);
    throw new Error('获取Azure访问令牌失败');
  }
}

/**
 * 语音识别函数
 * @param {Object} options 识别选项
 * @param {string} options.fileId 云存储文件ID
 * @param {string} options.language 识别语言，默认为 'zh-CN'
 * @param {string} options.format 结果格式，默认为 'detailed'
 * @param {string} options.profanityOption 敏感内容处理方式，默认为 'masked'
 * @param {string} options.mode 识别模式：'fast'快速模式，'standard'标准模式，'accurate'精确模式
 * @returns {Promise<Object>} 识别结果
 */
async function speechToText(options) {
  // 参数检查
  if (!options || !options.fileID) {
    throw new Error('缺少必要参数: fileID');
  }
  
  // 设置默认参数
  const language = options.language || config.azure.speech.recognition.language;
  const format = options.format || config.azure.speech.recognition.format;
  const profanityOption = options.profanityOption || config.azure.speech.recognition.profanityOption;
  const mode = options.mode || 'standard'; // 新增: 识别模式
  
  let tempFilePath = null;
  
  try {
    // 下载文件到临时路径
    tempFilePath = await downloadFromCloudStorage(options.fileID);
    if (!tempFilePath) {
      throw new Error(config.errorMessages.fileDownloadFailed);
    }
    
    // 获取访问令牌
    const accessToken = await getAzureAccessToken();
    
    // 文件数据
    const audioData = fs.readFileSync(tempFilePath);
    
    // 获取文件扩展名
    const fileExt = path.extname(tempFilePath).slice(1);
    if (!config.voiceService.supportedFormats.includes(fileExt)) {
      throw new Error(`${config.errorMessages.unsupportedFormat}: ${fileExt}`);
    }
    
    // 根据模式调整请求参数
    let endpointPath = config.azure.speech.recognition.endpoint;
    let additionalParams = {};
    
    switch (mode) {
      case 'fast':
        // 快速模式：降低质量提高速度
        additionalParams = {
          initialSilenceTimeoutMs: 1000, // 快速超时
          endSilenceTimeoutMs: 500,
          enableAudioLogging: false,
          wordLevelTimings: false,
          diarizationEnabled: false
        };
        break;
        
      case 'accurate':
        // 精确模式：提高质量，可能降低速度
        additionalParams = {
          initialSilenceTimeoutMs: 5000, // 较长超时
          endSilenceTimeoutMs: 2000,
          enableAudioLogging: true,
          wordLevelTimings: true,
          diarizationEnabled: true,
          phraseDetection: 'strict'
        };
        break;
        
      case 'standard':
      default:
        // 标准模式：平衡质量和速度
        additionalParams = {
          initialSilenceTimeoutMs: 3000,
          endSilenceTimeoutMs: 1000
        };
        break;
    }
    
    // 构建请求URL
    const requestUrl = `https://${config.azure.speech.region}.stt.speech.microsoft.com${endpointPath}`;
    
    console.log(`发送语音识别请求到: ${requestUrl}，模式: ${mode}`);
    
    // 发送识别请求
    const response = await axios({
      method: 'post',
      url: requestUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `audio/${fileExt}`,
        'Accept': 'application/json',
        'Ocp-Apim-Subscription-Key': config.azure.speech.key
      },
      params: {
        'language': language,
        'format': format,
        'profanity': profanityOption,
        ...additionalParams
      },
      data: audioData,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    // 处理识别结果
    const result = {
      success: true,
      text: '',
      details: null,
      language: language,
      mode: mode  // 在结果中包含使用的模式
    };
    
    if (format === 'detailed' && response.data.NBest && response.data.NBest.length > 0) {
      result.text = response.data.NBest[0].Display || response.data.NBest[0].Lexical || '';
      result.details = response.data;
    } else if (response.data.DisplayText || response.data.RecognitionStatus === 'Success') {
      result.text = response.data.DisplayText || '';
      result.details = response.data;
    } else {
      result.success = false;
      result.error = '无法识别语音内容';
    }
    
    return result;
  } catch (error) {
    console.error(`语音识别失败(${mode}模式):`, error);
    return {
      success: false,
      error: error.message || config.errorMessages.recognitionFailed,
      mode: mode
    };
  } finally {
    // 清理临时文件
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (error) {
        console.error('删除临时文件失败:', error);
      }
    }
  }
}

module.exports = {
  speechToText
}; 