// 简单的Express服务器，不依赖数据库
const express = require('express');
const path = require('path');
const fs = require('fs');

// 创建Express应用
const app = express();
const PORT = 3000; // 使用不太常用的端口，避免冲突

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'docker-backend/public')));

// 创建管理员页面文件夹
const adminDir = path.join(__dirname, 'docker-backend/public/admin');
if (!fs.existsSync(adminDir)) {
    fs.mkdirSync(adminDir, { recursive: true });
}

// 创建简单的管理页面
const adminHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>农业应用管理后台</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f8f0; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c7d4c; color: white; padding: 20px; text-align: center; }
        .card { background: white; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin: 20px 0; padding: 20px; }
        .button { background: #2c7d4c; border: none; color: white; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        .button:hover { background: #1e5d36; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>农业应用商家管理后台</h1>
        <p>简易版 - 成功连接服务器</p>
    </div>
    
    <div class="container">
        <div class="card">
            <h2>系统状态</h2>
            <p>服务器状态: <strong style="color: green;">正常运行</strong></p>
            <p>当前时间: <span id="current-time"></span></p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>政策管理</h3>
                <p>管理农业相关政策信息</p>
                <button class="button">进入模块</button>
            </div>
            
            <div class="card">
                <h3>商品管理</h3>
                <p>管理农产品信息</p>
                <button class="button">进入模块</button>
            </div>
            
            <div class="card">
                <h3>订单管理</h3>
                <p>查看和处理订单</p>
                <button class="button">进入模块</button>
            </div>
            
            <div class="card">
                <h3>用户管理</h3>
                <p>管理用户账户</p>
                <button class="button">进入模块</button>
            </div>
        </div>
    </div>
    
    <script>
        // 更新当前时间
        function updateTime() {
            const now = new Date();
            document.getElementById('current-time').textContent = now.toLocaleString();
        }
        updateTime();
        setInterval(updateTime, 1000);
        
        // 模拟功能按钮
        document.querySelectorAll('.button').forEach(btn => {
            btn.addEventListener('click', function() {
                alert('此功能在简易版中不可用');
            });
        });
    </script>
</body>
</html>
`;

// 写入管理页面文件
fs.writeFileSync(path.join(adminDir, 'index.html'), adminHtml);

// 路由
app.get('/', (req, res) => {
    res.send('农业应用后端API服务运行正常');
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(adminDir, 'index.html'));
});

// API示例端点
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        time: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`访问管理后台: http://localhost:${PORT}/admin`);
}); 