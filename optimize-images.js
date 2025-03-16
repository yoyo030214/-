const fs = require('fs');
const path = require('path');
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');

// 图片目录
const directories = ['images', '图片'];

// 处理每个目录
async function processDirectories() {
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`目录 ${dir} 不存在，跳过...`);
      continue;
    }

    console.log(`开始处理 ${dir} 目录的图片...`);
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      // 如果是目录，递归处理
      if (fs.statSync(filePath).isDirectory()) {
        await optimizeImagesInDirectory(filePath);
        continue;
      }
      
      // 如果是图片文件，进行优化
      if (['.jpg', '.jpeg', '.png', '.svg'].includes(path.extname(file).toLowerCase())) {
        await optimizeImage(filePath);
      }
    }
  }
}

// 优化指定目录中的图片
async function optimizeImagesInDirectory(directory) {
  console.log(`处理子目录: ${directory}`);
  
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    
    // 如果是目录，递归处理
    if (fs.statSync(filePath).isDirectory()) {
      await optimizeImagesInDirectory(filePath);
      continue;
    }
    
    // 如果是图片文件，进行优化
    if (['.jpg', '.jpeg', '.png', '.svg'].includes(path.extname(file).toLowerCase())) {
      await optimizeImage(filePath);
    }
  }
}

// 优化单个图片
async function optimizeImage(filePath) {
  console.log(`优化图片: ${filePath}`);
  
  try {
    const outputDir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    
    // 创建备份
    const backupPath = path.join(outputDir, `${fileName}.backup`);
    fs.copyFileSync(filePath, backupPath);
    
    // 执行优化
    const files = await imagemin([filePath], {
      destination: outputDir,
      plugins: [
        imageminJpegtran(),
        imageminPngquant({
          quality: [0.6, 0.8]
        }),
        imageminSvgo()
      ]
    });
    
    // 输出结果
    const originalSize = fs.statSync(backupPath).size;
    const optimizedSize = fs.statSync(filePath).size;
    const savingsPercentage = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
    
    console.log(`图片 ${filePath} 优化完成: ${originalSize} -> ${optimizedSize} bytes (节省 ${savingsPercentage}%)`);
    
    // 如果优化后的图片比原始图片大，则还原
    if (optimizedSize > originalSize) {
      fs.copyFileSync(backupPath, filePath);
      console.log(`优化后体积增大，已还原为原始图片`);
    }
    
    // 删除备份
    fs.unlinkSync(backupPath);
  } catch (error) {
    console.error(`优化图片 ${filePath} 时出错:`, error);
  }
}

// 主函数
(async () => {
  try {
    console.log('开始图片优化过程...');
    await processDirectories();
    console.log('所有图片优化完成!');
  } catch (error) {
    console.error('优化过程中发生错误:', error);
  }
})(); 