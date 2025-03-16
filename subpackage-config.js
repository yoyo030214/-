/**
 * 小程序分包配置辅助工具
 * 用于生成分包配置并更新app.json
 */

const fs = require('fs');
const path = require('path');

// 主包必须保留的页面（tabBar页面和首页）
const MAIN_PACKAGE_PAGES = [
  'pages/index/index',
  'pages/weather/weather',
  'pages/policy/policy',
  'pages/user/user'
];

// 分包配置建议
const SUBPACKAGE_SUGGESTIONS = [
  {
    name: 'order',
    root: 'subpackages/order',
    pages: [
      'pages/order/list',
      'pages/favorites/favorites',
      'pages/address/list'
    ]
  },
  {
    name: 'policy',
    root: 'subpackages/policy',
    pages: [
      'pages/policy/detail'
    ]
  },
  {
    name: 'common',
    root: 'subpackages/common',
    pages: [
      'pages/customer-service/customer-service',
      'pages/developing/developing',
      'pages/more/more'
    ]
  }
];

/**
 * 创建分包目录结构
 */
function createSubpackageDirectories() {
  SUBPACKAGE_SUGGESTIONS.forEach(pkg => {
    // 创建分包根目录
    if (!fs.existsSync(pkg.root)) {
      fs.mkdirSync(pkg.root, { recursive: true });
      console.log(`创建分包目录: ${pkg.root}`);
    }

    // 处理每个页面
    pkg.pages.forEach(page => {
      // 源页面路径和目标路径
      const sourcePath = path.join(process.cwd(), page);
      const pageBaseName = path.basename(page);
      const targetDir = path.join(process.cwd(), pkg.root);
      const targetPath = path.join(targetDir, pageBaseName);

      // 确保页面存在
      if (!fs.existsSync(sourcePath)) {
        console.warn(`警告: 页面 ${sourcePath} 不存在，跳过...`);
        return;
      }

      // 获取页面相关的所有文件 (.js, .wxml, .wxss, .json)
      const pageFiles = fs.readdirSync(path.dirname(sourcePath))
        .filter(file => file.startsWith(path.basename(sourcePath, path.extname(sourcePath))))
        .map(file => path.join(path.dirname(sourcePath), file));

      // 复制页面文件到分包目录
      pageFiles.forEach(file => {
        const targetFile = path.join(targetDir, path.basename(file));
        
        // 只读取并日志记录，不实际移动文件
        console.log(`将复制: ${file} -> ${targetFile}`);
      });
    });
  });
}

/**
 * 生成分包配置
 */
function generateSubpackageConfig() {
  // 读取现有的app.json
  const appJsonPath = path.join(process.cwd(), 'app.json');
  let appJson;
  
  try {
    appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  } catch (error) {
    console.error('读取app.json失败:', error);
    return;
  }

  // 提取当前页面列表
  const allPages = [...appJson.pages];

  // 将页面分配到主包和分包
  const mainPackagePages = allPages.filter(page => 
    MAIN_PACKAGE_PAGES.includes(page)
  );

  // 构建分包配置
  const subPackages = SUBPACKAGE_SUGGESTIONS.map(pkg => {
    // 将路径从pages/xxx形式转换为相对于分包root的路径
    const subPages = pkg.pages.map(page => {
      // 从完整路径中提取页面名称（不含路径前缀）
      const pageName = page.replace(/^pages\//, '');
      return pageName;
    });

    return {
      root: pkg.root,
      pages: subPages
    };
  });

  // 生成新的app.json配置（不修改原始文件，只返回建议配置）
  const newAppJson = {
    ...appJson,
    pages: mainPackagePages,
    subPackages
  };

  return newAppJson;
}

/**
 * 显示分包建议
 */
function showSubpackageSuggestions() {
  console.log('\n=== 小程序分包建议 ===');
  console.log('根据分析，建议的分包方案如下:');
  
  // 主包页面
  console.log('\n主包页面:');
  MAIN_PACKAGE_PAGES.forEach(page => {
    console.log(`- ${page}`);
  });
  
  // 分包建议
  SUBPACKAGE_SUGGESTIONS.forEach(pkg => {
    console.log(`\n${pkg.name}分包 (root: ${pkg.root}):`);
    pkg.pages.forEach(page => {
      console.log(`- ${page}`);
    });
  });
  
  console.log('\n注意: 这只是建议配置，请根据实际情况调整。');
  console.log('要应用分包配置，请按照以下步骤操作:');
  console.log('1. 创建对应的分包目录结构');
  console.log('2. 将页面移动到相应分包目录');
  console.log('3. 更新app.json中的页面路径');
  console.log('4. 检查并修复可能的路径引用问题');
}

// 导出函数
module.exports = {
  createSubpackageDirectories,
  generateSubpackageConfig,
  showSubpackageSuggestions
};

// 如果直接运行此脚本，则显示分包建议
if (require.main === module) {
  showSubpackageSuggestions();
} 