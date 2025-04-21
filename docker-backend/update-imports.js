const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');
const files = fs.readdirSync(modelsDir);

files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 替换数据库配置导入路径
    content = content.replace(
      /const sequelize = require\('\.\.\/config\/database'\);/,
      "const sequelize = require('../../database/src/config/database');"
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}); 