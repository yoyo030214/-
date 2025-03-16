const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 图片目录
const imageDir = 'images';
// 压缩后的输出目录
const outputDir = 'images_compressed';

// 创建输出目录
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 递归获取所有文件
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 递归处理子目录
      getAllFiles(filePath, fileList);
    } else {
      // 只处理图片文件
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(file).toLowerCase())) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// 压缩图片
async function compressImage(filePath) {
  try {
    // 构建输出路径，保持相同的目录结构
    const relativePath = path.relative(imageDir, filePath);
    const outputPath = path.join(outputDir, relativePath);
    
    // 创建目标目录
    const outputDirPath = path.dirname(outputPath);
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
    }
    
    // 获取原始文件大小
    const originalSize = fs.statSync(filePath).size;
    
    // 使用sharp库压缩图片
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.png') {
      await sharp(filePath)
        .png({ quality: 70, compressionLevel: 9 })
        .toFile(outputPath);
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      await sharp(filePath)
        .jpeg({ quality: 70 })
        .toFile(outputPath);
    } else if (ext === '.webp') {
      await sharp(filePath)
        .webp({ quality: 70 })
        .toFile(outputPath);
    } else {
      // 直接复制其他格式
      fs.copyFileSync(filePath, outputPath);
    }
    
    // 获取压缩后文件大小
    const compressedSize = fs.statSync(outputPath).size;
    const savings = originalSize - compressedSize;
    const percentage = (savings / originalSize * 100).toFixed(2);
    
    console.log(`压缩 ${filePath}:`);
    console.log(`  原始大小: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`  压缩后: ${(compressedSize / 1024).toFixed(2)} KB`);
    console.log(`  节省: ${percentage}%`);
    
    return {
      file: filePath,
      originalSize,
      compressedSize,
      savings,
      percentage
    };
  } catch (error) {
    console.error(`处理 ${filePath} 时出错:`, error);
    return null;
  }
}

// 主函数
async function main() {
  console.log('开始压缩图片...');
  
  // 获取所有图片文件
  const imageFiles = getAllFiles(imageDir);
  console.log(`找到 ${imageFiles.length} 个图片文件`);
  
  // 压缩统计数据
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;
  let results = [];
  
  // 压缩所有图片
  for (const file of imageFiles) {
    const result = await compressImage(file);
    
    if (result) {
      results.push(result);
      totalOriginalSize += result.originalSize;
      totalCompressedSize += result.compressedSize;
    }
  }
  
  // 打印总结
  const totalSavings = totalOriginalSize - totalCompressedSize;
  const totalPercentage = (totalSavings / totalOriginalSize * 100).toFixed(2);
  
  console.log('\n压缩完成!');
  console.log(`总原始大小: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`总压缩后大小: ${(totalCompressedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`总节省: ${(totalSavings / 1024 / 1024).toFixed(2)} MB (${totalPercentage}%)`);
  
  // 排序显示最大的图片和节省最多的图片
  console.log('\n最大的5个原始图片:');
  results
    .sort((a, b) => b.originalSize - a.originalSize)
    .slice(0, 5)
    .forEach((item, index) => {
      console.log(`${index + 1}. ${item.file} - ${(item.originalSize / 1024).toFixed(2)} KB`);
    });
  
  console.log('\n压缩比例最高的5个图片:');
  results
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5)
    .forEach((item, index) => {
      console.log(`${index + 1}. ${item.file} - 节省 ${item.percentage}%`);
    });
  
  console.log('\n推荐后续操作:');
  console.log('1. 将压缩后的图片从images_compressed复制回images目录');
  console.log('2. 考虑使用CDN存储大型图片资源');
  console.log('3. 检查体积超过200KB的图片是否真的需要');
}

main().catch(error => {
  console.error('运行过程中出错:', error);
}); 