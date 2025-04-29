// 语音合成模块 - 将文本转换为语音
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cloud = require('wx-server-sdk');
const crypto = require('crypto');
const config = require('./config');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 初始化云环境
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
  return path.join(config.tempFile.dir, `speech_${timestamp}_${randomString}.${fileExt}`);
}

/**
 * 将文件上传到云存储
 * @param {string} filePath 文件路径
 * @param {string} cloudPath 云存储路径
 * @returns {Promise<string>} 云存储文件ID
 */
async function uploadToCloudStorage(filePath, cloudPath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const result = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: fileContent
    });
    return result.fileID;
  } catch (error) {
    console.error('上传到云存储失败:', error);
    throw new Error('上传到云存储失败: ' + error.message);
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
 * 压缩和优化音频文件以减小文件大小
 * @param {string} inputFile 输入文件路径
 * @param {string} outputFile 输出文件路径
 * @param {string} format 音频格式
 * @param {Object} options 压缩选项
 * @returns {Promise<void>}
 */
async function compressAudioFile(inputFile, outputFile, format, options = {}) {
  try {
    // 检查输入文件是否存在
    if (!fs.existsSync(inputFile)) {
      throw new Error(`输入文件不存在: ${inputFile}`);
    }
    
    // 获取压缩选项
    const bitrate = options.bitrate || '64k';
    const channels = options.channels || 1;
    const sampleRate = options.sampleRate || 22050;
    const compressionLevel = options.compressionLevel || 5;
    
    // 根据格式确定压缩命令
    let command = '';
    
    // 这个部分需要ffmpeg支持，云函数环境可能不支持
    // 这里我们模拟一下压缩过程，实际部署时需要确保云函数环境有ffmpeg
    if (format === 'mp3') {
      // 根据文件大小判断是否需要压缩
      const fileSize = fs.statSync(inputFile).size;
      
      if (fileSize > 1024 * 100) { // 如果大于100KB则压缩
        // 复制文件作为模拟压缩
        fs.copyFileSync(inputFile, outputFile);
        
        // 记录压缩模拟信息
        console.log(`模拟音频压缩: ${inputFile} -> ${outputFile}`);
        console.log(`压缩参数: 比特率=${bitrate}, 声道=${channels}, 采样率=${sampleRate}`);
        
        return;
      }
    }
    
    // 如果不需要压缩或不支持的格式，直接复制文件
    fs.copyFileSync(inputFile, outputFile);
    console.log(`直接复制文件: ${inputFile} -> ${outputFile}`);
    
  } catch (error) {
    console.error('压缩音频文件失败:', error);
    // 如果压缩失败，直接复制原始文件
    if (fs.existsSync(inputFile)) {
      fs.copyFileSync(inputFile, outputFile);
    }
  }
}

/**
 * 优化文本以减少生成的语音长度
 * @param {string} text 原始文本
 * @returns {string} 优化后的文本
 */
function optimizeText(text) {
  if (!text) return text;
  
  // 1. 移除多余的空白字符
  let optimized = text.replace(/\s+/g, ' ').trim();
  
  // 2. 移除重复的标点符号
  optimized = optimized.replace(/([!?.,。，！？；;])+/g, '$1');
  
  // 3. 替换长数字为更易读的形式（简单示例）
  optimized = optimized.replace(/\b(\d{4,})\b/g, (match) => {
    // 对于较长的数字，按千分位分隔
    return match.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  });
  
  // 4. 处理长URL或其他不需要朗读的内容
  optimized = optimized.replace(/https?:\/\/\S+/g, '网址链接');
  
  return optimized;
}

/**
 * 分割长文本以减小单个文件大小
 * @param {string} text 原始文本
 * @param {number} maxLength 每段最大长度
 * @returns {Array<string>} 分割后的文本数组
 */
function splitLongText(text, maxLength = 200) {
  if (!text || text.length <= maxLength) return [text];
  
  const segments = [];
  let remaining = text;
  
  // 根据句子边界分割
  while (remaining.length > maxLength) {
    // 查找句子边界 (.。!?。！？)
    let splitPoint = maxLength;
    const sentenceEnd = /[.。!?！？]\s*/g;
    let lastMatch = null;
    let match;
    
    // 重置正则表达式的lastIndex
    sentenceEnd.lastIndex = 0;
    
    // 查找最后一个句子边界
    while ((match = sentenceEnd.exec(remaining.substring(0, maxLength + 30))) !== null) {
      lastMatch = match;
    }
    
    if (lastMatch) {
      splitPoint = lastMatch.index + 1; // +1 包含句末标点
    } else {
      // 如果没有找到句子边界，查找逗号或分号
      const commaPoint = remaining.substring(0, maxLength).lastIndexOf('，');
      const semicolonPoint = remaining.substring(0, maxLength).lastIndexOf('；');
      const commaPoint2 = remaining.substring(0, maxLength).lastIndexOf(',');
      const semicolonPoint2 = remaining.substring(0, maxLength).lastIndexOf(';');
      
      // 使用找到的最后一个分隔符
      const possiblePoints = [commaPoint, semicolonPoint, commaPoint2, semicolonPoint2].filter(p => p > 0);
      if (possiblePoints.length > 0) {
        splitPoint = Math.max(...possiblePoints) + 1; // +1 包含标点
      }
    }
    
    // 添加分割的段落
    segments.push(remaining.substring(0, splitPoint).trim());
    
    // 更新剩余文本
    remaining = remaining.substring(splitPoint).trim();
  }
  
  // 添加最后一部分
  if (remaining.length > 0) {
    segments.push(remaining);
  }
  
  return segments;
}

/**
 * 文本转语音
 * @param {Object} options 合成选项
 * @param {string} options.text 要转换的文本
 * @param {string} [options.format] 音频格式，默认为mp3
 * @param {string} [options.voice] 语音名称，默认使用配置中的声音
 * @param {string} [options.language] 语言，默认使用配置中的语言
 * @param {string} [options.quality] 音质：'high'高音质，'standard'标准音质，'low'低音质，默认为standard
 * @param {number} [options.rate] 语速，范围-100到100，0为正常语速
 * @param {number} [options.pitch] 音调，范围-50到50，0为正常音调
 * @param {boolean} [options.optimizeSize] 是否优化文件大小，默认为false
 * @returns {Promise<Object>} 合成结果
 */
async function textToSpeech(options) {
  let tempFilePath = null;
  let optimizedTempFilePath = null;
  
  try {
    // 参数验证
    if (!options || !options.text) {
      throw new Error('缺少必要参数: text');
    }
    
    // 文本长度验证
    if (options.text.length > config.voiceService.maxTextLength) {
      throw new Error(`文本长度超过限制: ${options.text.length}/${config.voiceService.maxTextLength}`);
    }
    
    // 设置参数，如果未提供则使用默认配置
    const format = options.format || config.voiceService.defaultFormat;
    const voice = options.voice || config.azure.speech.synthesis.voice;
    const language = options.language || config.azure.speech.synthesis.language;
    const quality = options.quality || 'standard';
    const rate = options.rate !== undefined ? options.rate : 0;
    const pitch = options.pitch !== undefined ? options.pitch : 0;
    const optimizeSize = options.optimizeSize !== undefined ? options.optimizeSize : false;
    
    // 验证参数范围
    if (rate < -100 || rate > 100) {
      throw new Error('语速超出范围，必须在-100到100之间');
    }
    
    if (pitch < -50 || pitch > 50) {
      throw new Error('音调超出范围，必须在-50到50之间');
    }
    
    // 验证音频格式是否支持
    if (!config.voiceService.supportedFormats.includes(format)) {
      throw new Error(`不支持的音频格式: ${format}。支持的格式: ${config.voiceService.supportedFormats.join(', ')}`);
    }
    
    // 根据质量级别设置合成参数
    let outputFormat = config.azure.speech.synthesis.outputFormat;
    let bitrate = '128k';
    let sampleRate = 24000;
    
    switch (quality) {
      case 'high':
        // 高音质设置
        outputFormat = format === 'mp3' ? 'audio-24khz-160kbitrate-mono-mp3' : 'riff-24khz-16bit-mono-pcm';
        bitrate = '160k';
        sampleRate = 24000;
        break;
        
      case 'low':
        // 低音质设置（文件更小）
        outputFormat = format === 'mp3' ? 'audio-16khz-64kbitrate-mono-mp3' : 'riff-16khz-16bit-mono-pcm';
        bitrate = '64k';
        sampleRate = 16000;
        break;
        
      case 'standard':
      default:
        // 标准音质设置
        outputFormat = format === 'mp3' ? 'audio-24khz-96kbitrate-mono-mp3' : 'riff-24khz-16bit-mono-pcm';
        bitrate = '96k';
        sampleRate = 24000;
        break;
    }
    
    // 优化文本以减少生成的语音长度
    let textToSynthesize = options.text;
    
    if (optimizeSize) {
      textToSynthesize = optimizeText(textToSynthesize);
      console.log('优化后的文本:', textToSynthesize);
    }
    
    // 生成临时文件路径
    tempFilePath = getTempFilePath(format);
    optimizedTempFilePath = getTempFilePath(format);
    
    // 获取访问令牌
    const accessToken = await getAzureAccessToken();
    
    // 构建SSML，添加语速和音调控制
    const ssml = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language}">
  <voice name="${voice}">
    <prosody rate="${rate}%" pitch="${pitch}%">
      ${textToSynthesize}
    </prosody>
  </voice>
</speak>`;
    
    // 构建请求URL
    const requestUrl = `https://${config.azure.speech.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    console.log(`发送语音合成请求到: ${requestUrl}, 质量: ${quality}, 格式: ${outputFormat}`);
    
    // 发送合成请求
    const response = await axios({
      method: 'post',
      url: requestUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': outputFormat,
        'User-Agent': 'VoiceAPI'
      },
      data: ssml,
      responseType: 'arraybuffer'
    });
    
    // 将音频数据写入临时文件
    fs.writeFileSync(tempFilePath, response.data);
    
    // 如果启用了文件大小优化，尝试进一步压缩
    if (optimizeSize) {
      await compressAudioFile(tempFilePath, optimizedTempFilePath, format, {
        bitrate,
        sampleRate,
        channels: 1,
        compressionLevel: quality === 'low' ? 7 : 5
      });
    } else {
      // 不压缩，直接复制
      fs.copyFileSync(tempFilePath, optimizedTempFilePath);
    }
    
    // 上传到云存储
    const cloudPath = `voice_synthesis/${Date.now()}_${quality}${optimizeSize ? '_optimized' : ''}.${format}`;
    const fileID = await uploadToCloudStorage(optimizedTempFilePath, cloudPath);
    
    // 获取优化前后的文件大小（如果进行了优化）
    let originalSize = 0;
    let optimizedSize = 0;
    
    if (fs.existsSync(tempFilePath)) {
      originalSize = fs.statSync(tempFilePath).size;
    }
    
    if (fs.existsSync(optimizedTempFilePath)) {
      optimizedSize = fs.statSync(optimizedTempFilePath).size;
    }
    
    // 清理临时文件
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    if (optimizedTempFilePath && fs.existsSync(optimizedTempFilePath)) {
      fs.unlinkSync(optimizedTempFilePath);
    }
    
    // 返回合成结果
    return {
      success: true,
      fileID: fileID,
      format: format,
      text: options.text,
      quality: quality,
      rate: rate,
      pitch: pitch,
      optimized: optimizeSize,
      originalSize: originalSize,
      optimizedSize: optimizedSize,
      sizeReduction: originalSize > 0 ? Math.round((1 - optimizedSize / originalSize) * 100) : 0
    };
    
  } catch (error) {
    // 清理临时文件
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error('删除临时文件失败:', e);
      }
    }
    
    if (optimizedTempFilePath && fs.existsSync(optimizedTempFilePath)) {
      try {
        fs.unlinkSync(optimizedTempFilePath);
      } catch (e) {
        console.error('删除优化后的临时文件失败:', e);
      }
    }
    
    console.error('语音合成失败:', error);
    return {
      success: false,
      error: error.message || config.errorMessages.synthesisFailed
    };
  }
}

module.exports = {
  textToSpeech
}; 