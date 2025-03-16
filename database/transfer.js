const fs = require('fs');
const path = require('path');
const { policies, users } = require('./index');
import deepseek from '../services/deepseek';

class DataTransfer {
  // 导出数据
  static exportData(collection, format = 'json') {
    const data = policies[collection] ? policies[collection].find() : users.find();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(DB_PATH, 'exports', `${collection}_${timestamp}.${format}`);

    if (!fs.existsSync(path.dirname(exportPath))) {
      fs.mkdirSync(path.dirname(exportPath), { recursive: true });
    }

    if (format === 'json') {
      fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
    } else if (format === 'csv') {
      const csvContent = this._convertToCSV(data);
      fs.writeFileSync(exportPath, csvContent);
    }

    return exportPath;
  }

  // 导入数据
  static importData(collection, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    let data = [];

    if (ext === '.json') {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else if (ext === '.csv') {
      data = this._convertFromCSV(fs.readFileSync(filePath, 'utf8'));
    }

    if (policies[collection]) {
      data.forEach(doc => policies[collection].insert(doc));
    } else {
      data.forEach(doc => users.insert(doc));
    }

    return data.length;
  }

  static _convertToCSV(data) {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(v => 
        typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
      ).join(',')
    );
    return [headers, ...rows].join('\n');
  }

  static _convertFromCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      return headers.reduce((obj, header, index) => {
        let value = values[index] || '';
        value = value.replace(/^"(.*)"$/, '$1').replace(/""/g, '"');
        obj[header] = isNaN(value) ? value : Number(value);
        return obj;
      }, {});
    });
  }
}

async function migrateChatHistory() {
  const oldChats = await getOldChatHistory();
  
  for (const chat of oldChats) {
    const newResponse = await deepseek.chat(chat.prompt);
    await saveNewChat({
      ...chat,
      response: newResponse.choices[0].message.content
    });
  }
}

migrateChatHistory()
  .then(() => console.log('数据迁移完成'))
  .catch(err => console.error('数据迁移失败:', err));

module.exports = DataTransfer; 