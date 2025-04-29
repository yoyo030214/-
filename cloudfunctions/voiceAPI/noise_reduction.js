// 语音降噪模块 - 处理音频降噪
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cloud = require('wx-server-sdk');
const crypto = require('crypto');
const config = require('./config');
const util = require('util');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 设置ffmpeg路径
ffmpeg.setFfmpegPath(ffmpegPath);

// 异步化fs操作
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);
const mkdir = util.promisify(fs.mkdir);

/**
 * 获取临时文件路径
 * @param {string} prefix - 文件前缀
 * @param {string} extension - 文件扩展名
 * @returns {string} 临时文件路径
 */
function getTempFilePath(prefix, extension) {
  const tempDir = config.tempFile.dir;
  const filename = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}.${extension}`;
  return path.join(tempDir, filename);
}

/**
 * 下载云存储文件到临时路径
 * @param {string} fileID 云存储文件ID
 * @returns {Promise<string>} 临时文件路径
 */
async function downloadFromCloudStorage(fileID) {
  try {
    console.log(`开始从云存储下载文件: ${fileID}`);
    const res = await cloud.downloadFile({
      fileID: fileID
    });
    
    const tempFilePath = getTempFilePath('original', 'mp3');
    await writeFile(tempFilePath, res.fileContent);
    console.log(`文件已下载到: ${tempFilePath}`);
    return tempFilePath;
  } catch (error) {
    console.error('下载文件失败:', error);
    throw new Error(config.errorMessages.fileDownloadFailed);
  }
}

/**
 * 将文件上传到云存储
 * @param {string} filePath 文件路径
 * @param {string} cloudPath 云存储路径
 * @returns {Promise<string>} 云存储文件ID
 */
async function uploadToCloudStorage(filePath, cloudPath) {
  try {
    const fileContent = await readFile(filePath);
    const fileSize = fileContent.length;
    
    console.log(`开始上传文件到云存储: ${cloudPath}, 大小: ${fileSize} 字节`);
    const uploadResult = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: fileContent
    });
    
    console.log(`文件上传成功: ${uploadResult.fileID}`);
    return {
      fileID: uploadResult.fileID,
      fileSize: fileSize
    };
  } catch (error) {
    console.error('上传文件失败:', error);
    throw new Error('上传文件到云存储失败');
  }
}

/**
 * 应用音频降噪
 * 注意：这是一个模拟实现，实际应用需要使用专业的音频处理库或API
 * @param {string} inputPath 输入文件路径
 * @param {string} outputPath 输出文件路径
 * @param {string} level 降噪级别 (low, medium, high)
 * @param {boolean} preserveVoice 是否保留语音特性
 * @returns {Promise<void>}
 */
async function applyNoiseReduction(inputPath, outputPath, level, preserveVoice) {
  // 根据级别设置降噪参数
  let noiseReductionValue;
  switch (level) {
    case 'low':
      noiseReductionValue = 0.15;
      break;
    case 'medium':
      noiseReductionValue = 0.25;
      break;
    case 'high':
      noiseReductionValue = 0.35;
      break;
    default:
      noiseReductionValue = 0.25; // 默认为中等降噪
  }

  // 设置音频前处理参数
  let afftdnParams = `anlmdn=s=${noiseReductionValue}`;
  
  // 如果需要保留语音特性，添加额外的滤镜
  if (preserveVoice) {
    afftdnParams += `,highpass=f=100,lowpass=f=8000,dynaudnorm=f=75:g=25:p=0.55`;
  }

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(afftdnParams)
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('开始降噪处理，执行命令:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`降噪处理进度: ${Math.floor(progress.percent)}%`);
        }
      })
      .on('error', (err) => {
        console.error('降噪处理失败:', err);
        reject(new Error('降噪处理失败: ' + err.message));
      })
      .on('end', () => {
        console.log('降噪处理完成');
        resolve();
      })
      .run();
  });
}

/**
 * 语音降噪处理
 * @param {Object} params 降噪参数
 * @param {string} params.fileID 云存储文件ID
 * @param {string} params.level 降噪级别 (low, medium, high)
 * @param {boolean} params.preserveVoice 是否保留语音特性
 * @returns {Promise<Object>} 处理结果
 */
async function reduceNoise(params) {
  console.log('降噪处理开始, 参数:', JSON.stringify(params));
  let tempFilePaths = [];
  
  try {
    // 参数验证
    if (!params.fileID) {
      throw new Error('缺少文件ID参数');
    }
    
    const level = params.level || 'medium';
    if (!['low', 'medium', 'high'].includes(level)) {
      throw new Error('降噪级别无效，应为 low、medium 或 high');
    }
    
    const preserveVoice = params.preserveVoice !== undefined ? params.preserveVoice : true;
    
    // 下载需要处理的音频文件
    const inputFilePath = await downloadFromCloudStorage(params.fileID);
    tempFilePaths.push(inputFilePath);
    
    // 准备输出文件路径
    const outputFilePath = getTempFilePath('reduced_noise', 'mp3');
    tempFilePaths.push(outputFilePath);
    
    // 应用降噪处理
    console.log(`开始降噪处理, 级别: ${level}, 保留语音: ${preserveVoice}`);
    await applyNoiseReduction(inputFilePath, outputFilePath, level, preserveVoice);
    
    // 获取原始文件大小
    const originalFileStats = fs.statSync(inputFilePath);
    const originalSize = originalFileStats.size;
    
    // 上传处理后的文件
    const cloudPath = `audio/processed/noise_reduced_${Date.now()}.mp3`;
    const uploadResult = await uploadToCloudStorage(outputFilePath, cloudPath);
    
    // 获取处理后文件大小
    const processedSize = uploadResult.fileSize;
    
    // 计算文件大小变化百分比
    const sizeChange = ((processedSize - originalSize) / originalSize * 100).toFixed(2);
    
    return {
      success: true,
      fileID: uploadResult.fileID,
      originalSize: originalSize,
      processedSize: processedSize,
      sizeChange: `${sizeChange}%`,
      level: level,
      preserveVoice: preserveVoice
    };
  } catch (error) {
    console.error('降噪处理失败:', error);
    return {
      success: false,
      error: error.message || '降噪处理失败'
    };
  } finally {
    // 清理临时文件
    for (const filePath of tempFilePaths) {
      try {
        if (fs.existsSync(filePath)) {
          await unlink(filePath);
          console.log(`临时文件已删除: ${filePath}`);
        }
      } catch (err) {
        console.error(`删除临时文件失败: ${filePath}`, err);
      }
    }
  }
}

module.exports = {
  reduceNoise
}; 