const BACKUP_DIR = path.join(DB_PATH, 'backups');

class LocalDB {
  // ...原有方法...

  constructor(collection) {
    this.filePath = path.join(DB_PATH, `${collection}.json`);
    this._initDB();
    this._initAutoBackup();
  }

  _initAutoBackup() {
    // 每天凌晨2点自动备份
    setInterval(() => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(BACKUP_DIR, `${path.basename(this.filePath)}_${timestamp}.bak`);
      
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      }
      
      fs.copyFileSync(this.filePath, backupPath);
      console.log(`自动备份完成：${backupPath}`);
      
      // 保留最近7天备份
      this._cleanOldBackups();
    }, 24 * 60 * 60 * 1000); // 24小时
  }

  _cleanOldBackups() {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith(path.basename(this.filePath)))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // 删除7天前的备份
    files.slice(7).forEach(f => {
      fs.unlinkSync(path.join(BACKUP_DIR, f.name));
    });
  }
} 