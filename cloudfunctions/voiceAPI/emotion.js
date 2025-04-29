// 语音情感分析模块 - 分析语音中的情感
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cloud = require('wx-server-sdk');
const config = require('./config');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

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
    
    // The temporary file path
    const tempFilePath = path.join(config.tempFile.dir, `emotion_${Date.now()}.wav`);
    
    // Write to temporary file
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
    // Azure 认知服务令牌端点
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
 * 分析音频情感
 * @param {Object} options 分析选项
 * @param {string} options.fileID 云存储文件ID
 * @param {string} [options.language] 语言，默认为 'zh-CN'
 * @returns {Promise<Object>} 情感分析结果
 */
async function analyzeEmotion(options) {
  let tempFilePath = null;
  
  try {
    // 参数验证
    if (!options || !options.fileID) {
      throw new Error('缺少必要参数: fileID');
    }
    
    // 设置默认参数
    const language = options.language || config.azure.speech.recognition.language;
    
    // 下载文件到临时路径
    tempFilePath = await downloadFromCloudStorage(options.fileID);
    if (!tempFilePath) {
      throw new Error(config.errorMessages.fileDownloadFailed);
    }
    
    // 获取访问令牌
    const accessToken = await getAzureAccessToken();
    
    // 文件数据
    const audioData = fs.readFileSync(tempFilePath);
    
    // 构建请求URL - 使用Azure Speech情感分析API或兼容的端点
    const requestUrl = `https://${config.azure.speech.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;
    
    console.log('发送情感分析请求到:', requestUrl);
    
    // 发送分析请求
    const response = await axios({
      method: 'post',
      url: requestUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'audio/wav',
        'Accept': 'application/json',
        'Ocp-Apim-Subscription-Key': config.azure.speech.key
      },
      params: {
        'language': language,
        'format': 'detailed',
        'profanity': 'masked',
        'enableAudioTracking': 'true',
        'enableWordLevelTimestamps': 'true',
        'enableSentimentAnalysis': 'true' // 启用情感分析
      },
      data: audioData,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    // 处理情感分析结果
    const result = {
      success: true,
      text: '',
      emotions: {},
      language: language
    };
    
    if (response.data.NBest && response.data.NBest.length > 0) {
      result.text = response.data.NBest[0].Display || response.data.NBest[0].Lexical || '';
      
      // 这里我们模拟情感分析结果，因为直接的情感分析需要额外的API支持
      // 在实际应用中，你可能需要将语音识别结果发送到文本情感分析API获取真实结果
      
      // 基于文本内容进行简单的情感分析模拟
      const text = result.text.toLowerCase();
      const emotionScores = simulateEmotionAnalysis(text);
      
      result.emotions = {
        dominant: getDominantEmotion(emotionScores),
        scores: emotionScores
      };
      
      result.details = response.data;
    } else if (response.data.DisplayText) {
      result.text = response.data.DisplayText || '';
      
      // 模拟情感分析
      const text = result.text.toLowerCase();
      const emotionScores = simulateEmotionAnalysis(text);
      
      result.emotions = {
        dominant: getDominantEmotion(emotionScores),
        scores: emotionScores
      };
      
      result.details = response.data;
    } else {
      result.success = false;
      result.error = '无法识别语音内容或分析情感';
    }
    
    return result;
  } catch (error) {
    console.error('情感分析失败:', error);
    return {
      success: false,
      error: error.message || '情感分析服务异常'
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

/**
 * 模拟情感分析
 * 注意：这是一个简单的模拟实现，实际应用中应使用专业的情感分析API
 * @param {string} text 需分析的文本
 * @returns {Object} 情感分数
 */
function simulateEmotionAnalysis(text) {
  // 情感关键词字典
  const emotionKeywords = {
    happy: ['开心', '高兴', '快乐', '欢喜', '笑', '哈哈', '嘻嘻', '棒', '好', '喜欢', '爱'],
    sad: ['伤心', '难过', '哭', '悲', '痛', '失望', '遗憾', '不好', '糟糕', '难受'],
    angry: ['生气', '愤怒', '讨厌', '烦', '恨', '滚', '混蛋', '可恶', '过分', '不爽'],
    fear: ['害怕', '恐惧', '担心', '紧张', '怕', '惊', '吓', '危险'],
    surprise: ['惊讶', '震惊', '惊喜', '没想到', '意外', '哇', '啊', '居然', '竟然'],
    neutral: []
  };
  
  // 初始情感分数
  const scores = {
    happy: 0.1,
    sad: 0.1,
    angry: 0.1,
    fear: 0.1,
    surprise: 0.1,
    neutral: 0.5
  };
  
  // 分析文本中的情感关键词
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[emotion] += 0.1;
        scores.neutral -= 0.05;
      }
    }
  }
  
  // 确保所有分数都在0-1范围内
  for (const emotion in scores) {
    scores[emotion] = Math.max(0, Math.min(1, scores[emotion]));
  }
  
  // 确保所有分数总和为1
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  for (const emotion in scores) {
    scores[emotion] = scores[emotion] / total;
  }
  
  return scores;
}

/**
 * 获取主导情感
 * @param {Object} scores 情感分数
 * @returns {string} 主导情感
 */
function getDominantEmotion(scores) {
  let dominant = 'neutral';
  let maxScore = 0;
  
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      dominant = emotion;
    }
  }
  
  return dominant;
}

module.exports = {
  analyzeEmotion
}; 