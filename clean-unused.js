const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 需要扫描的文件类型
const CODE_FILES = ['**/*.js', '**/*.wxml', '**/*.wxss', '**/*.json'];
// 需要检查的资源类型
const ASSET_FILES = ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'];
// 要排除的目录
const EXCLUDE_DIRS = ['node_modules/**', 'miniprogram_npm/**'];

// 获取所有代码文件
function getCodeFiles() {
  let files = [];
  
  CODE_FILES.forEach(pattern => {
    const matches = glob.sync(pattern, { ignore: EXCLUDE_DIRS });
    files = files.concat(matches);
  });
  
  return files;
}

// 获取所有资源文件
function getAssetFiles() {
  let files = [];
  
  ASSET_FILES.forEach(pattern => {
    const matches = glob.sync(pattern, { ignore: EXCLUDE_DIRS });
    files = files.concat(matches);
  });
  
  return files;
}

// 读取所有代码文件内容
function readCodeFiles(files) {
  let allCode = '';
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      allCode += content;
    } catch (error) {
      console.error(`读取文件 ${file} 失败:`, error);
    }
  });
  
  return allCode;
}

// 检查资源是否被使用
function checkUsedAssets(allCode, assetFiles) {
  const unusedAssets = [];
  const usedAssets = [];
  
  assetFiles.forEach(assetFile => {
    // 获取文件名（不带路径）
    const fileName = path.basename(assetFile);
    // 也检查不带扩展名的文件名，因为有时候引用图片不带扩展名
    const fileNameWithoutExt = path.basename(assetFile, path.extname(assetFile));
    
    // 如果代码中包含文件名，则认为该资源被使用
    if (allCode.includes(fileName) || allCode.includes(fileNameWithoutExt)) {
      usedAssets.push(assetFile);
    } else {
      unusedAssets.push(assetFile);
    }
  });
  
  return { usedAssets, unusedAssets };
}

// 创建备份目录
function createBackupDir() {
  const backupDir = path.join(__dirname, 'unused-assets-backup');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  return backupDir;
}

// 移动未使用的资源到备份目录
function moveUnusedAssets(unusedAssets, backupDir) {
  unusedAssets.forEach(assetFile => {
    try {
      const fileName = path.basename(assetFile);
      const destPath = path.join(backupDir, fileName);
      
      // 如果备份目录已存在同名文件，加上原始路径的hash
      if (fs.existsSync(destPath)) {
        const hash = Buffer.from(assetFile).toString('base64').substring(0, 8);
        const destPathWithHash = path.join(backupDir, `${hash}_${fileName}`);
        fs.copyFileSync(assetFile, destPathWithHash);
      } else {
        fs.copyFileSync(assetFile, destPath);
      }
      
      // 删除原文件
      fs.unlinkSync(assetFile);
      
      console.log(`已移动未使用资源: ${assetFile} -> ${backupDir}`);
    } catch (error) {
      console.error(`移动文件 ${assetFile} 失败:`, error);
    }
  });
}

// 主函数
function main() {
  console.log('开始扫描代码文件...');
  const codeFiles = getCodeFiles();
  console.log(`找到 ${codeFiles.length} 个代码文件`);
  
  console.log('开始扫描资源文件...');
  const assetFiles = getAssetFiles();
  console.log(`找到 ${assetFiles.length} 个资源文件`);
  
  console.log('读取所有代码文件...');
  const allCode = readCodeFiles(codeFiles);
  
  console.log('检查资源使用情况...');
  const { usedAssets, unusedAssets } = checkUsedAssets(allCode, assetFiles);
  
  console.log(`总共资源: ${assetFiles.length}`);
  console.log(`已使用资源: ${usedAssets.length}`);
  console.log(`未使用资源: ${unusedAssets.length}`);
  
  if (unusedAssets.length > 0) {
    console.log('\n未使用的资源列表:');
    unusedAssets.forEach(asset => console.log(asset));
    
    const backupDir = createBackupDir();
    console.log(`\n将未使用的资源移动到备份目录: ${backupDir}`);
    
    const confirmation = 'y'; // 在实际使用时，可以添加用户确认步骤
    
    if (confirmation.toLowerCase() === 'y') {
      moveUnusedAssets(unusedAssets, backupDir);
      console.log('清理完成!');
    } else {
      console.log('操作已取消');
    }
  } else {
    console.log('没有找到未使用的资源，无需清理');
  }
}

main(); 