// 简单服务器 - 使用本地文件存储数据
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

// 创建Express应用
const app = express();
const PORT = 8080; // 使用8080端口，避免与其他服务冲突

// 创建数据目录
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 基础数据文件
const policiesFile = path.join(dataDir, 'policies.json');
const productsFile = path.join(dataDir, 'products.json');
const usersFile = path.join(dataDir, 'users.json');
const ordersFile = path.join(dataDir, 'orders.json');

// 初始化数据文件
if (!fs.existsSync(policiesFile)) {
    fs.writeFileSync(policiesFile, JSON.stringify([
        { id: 1, title: '关于促进乡村产业振兴的指导意见', publishDate: '2025-01-15', category: '产业振兴', status: '已发布' },
        { id: 2, title: '2025年农业补贴政策解读', publishDate: '2025-02-23', category: '补贴政策', status: '已发布' },
        { id: 3, title: '优质农产品认证标准更新通知', publishDate: '2025-03-10', category: '产品标准', status: '待审核' }
    ], null, 2));
}

if (!fs.existsSync(productsFile)) {
    fs.writeFileSync(productsFile, JSON.stringify([
        { id: 1, name: '有机红富士苹果', price: '15.8', unit: 'kg', stock: 500, farmer: '张大山', status: '在售' },
        { id: 2, name: '生态散养土鸡', price: '68.0', unit: '只', stock: 50, farmer: '李小芳', status: '在售' },
        { id: 3, name: '农家自制腊肉', price: '85.0', unit: 'kg', stock: 0, farmer: '王老二', status: '缺货' }
    ], null, 2));
}

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([
        { id: 1, username: 'admin', password: '$2a$10$Oj2XGPuQZBNYPvHzaqBw/.HdcYFSVm9/d3wxYSdIrbz8hPVNZKB8u', role: '管理员', registerDate: '2025-01-01', status: '活跃' },
        { id: 2, username: 'zhangsan', password: '$2a$10$xJJJ9vHDUAL3vnTflSBjWePHDdtJ9FKFI4dXYLZ.U7qW43wPmkwhu', role: '农户', registerDate: '2025-01-15', status: '活跃' },
        { id: 3, username: 'lisi', password: '$2a$10$3R3iGzpWanIV7vFRlGFQ.O5SpZo2SjVFM0zJnMc/yKjFn.DO83JlO', role: '客户', registerDate: '2025-02-20', status: '待验证' }
    ], null, 2));
}

if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(ordersFile, JSON.stringify([
        { id: 'ORD2025030001', customer: '周小明', amount: 126.50, orderTime: '2025-03-15 09:23', status: '已付款' },
        { id: 'ORD2025030002', customer: '赵大海', amount: 258.00, orderTime: '2025-03-15 10:45', status: '已发货' },
        { id: 'ORD2025030003', customer: '林小花', amount: 75.20, orderTime: '2025-03-15 14:30', status: '待付款' }
    ], null, 2));
}

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 创建公共目录和管理员页面文件夹
const publicDir = path.join(__dirname, 'public');
const adminDir = path.join(publicDir, 'admin');

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

if (!fs.existsSync(adminDir)) {
    fs.mkdirSync(adminDir, { recursive: true });
}

// 编写主页HTML
const adminHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>农业应用商家管理后台</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f8f0; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c7d4c; color: white; padding: 20px; text-align: center; }
        .card { background: white; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin: 20px 0; padding: 20px; }
        .button { background: #2c7d4c; border: none; color: white; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        .button:hover { background: #1e5d36; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .tabs { display: flex; border-bottom: 1px solid #ddd; margin-bottom: 20px; }
        .tab { padding: 10px 15px; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { border-bottom-color: #2c7d4c; font-weight: bold; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        table { width: 100%; border-collapse: collapse; }
        table th, table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        table th { background-color: #f5f5f5; }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 12px;
            color: white;
        }
        .badge-success { background-color: #28a745; }
        .badge-warning { background-color: #ffc107; color: #212529; }
        .badge-danger { background-color: #dc3545; }
        .badge-info { background-color: #17a2b8; }
    </style>
</head>
<body>
    <div class="header">
        <h1>农业应用商家管理后台</h1>
        <p>本地服务器版 - 成功连接！</p>
    </div>
    
    <div class="container">
        <div class="card">
            <h2>系统状态</h2>
            <p>服务器状态: <strong style="color: green;">正常运行</strong></p>
            <p>当前时间: <span id="current-time"></span></p>
            <p>服务器端口: <span id="server-port">8080</span></p>
        </div>
        
        <div class="card">
            <div class="tabs">
                <div class="tab active" data-tab="policies">政策管理</div>
                <div class="tab" data-tab="products">商品管理</div>
                <div class="tab" data-tab="orders">订单管理</div>
                <div class="tab" data-tab="users">用户管理</div>
            </div>
            
            <!-- 政策管理面板 -->
            <div class="tab-content active" id="policies-tab">
                <h3>政策管理</h3>
                <div id="policies-content">正在加载数据...</div>
            </div>
            
            <!-- 商品管理面板 -->
            <div class="tab-content" id="products-tab">
                <h3>商品管理</h3>
                <div id="products-content">正在加载数据...</div>
            </div>
            
            <!-- 订单管理面板 -->
            <div class="tab-content" id="orders-tab">
                <h3>订单管理</h3>
                <div id="orders-content">正在加载数据...</div>
            </div>
            
            <!-- 用户管理面板 -->
            <div class="tab-content" id="users-tab">
                <h3>用户管理</h3>
                <div id="users-content">正在加载数据...</div>
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
        
        // 标签页切换
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                // 移除所有活动标签
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // 激活当前标签
                this.classList.add('active');
                const tabName = this.getAttribute('data-tab');
                document.getElementById(tabName + '-tab').classList.add('active');
                
                // 加载对应数据
                loadTabData(tabName);
            });
        });
        
        // 加载数据
        function loadTabData(tabName) {
            fetch('/api/' + tabName)
                .then(response => response.json())
                .then(data => {
                    // 创建表格
                    let tableHTML = createTable(data, tabName);
                    document.getElementById(tabName + '-content').innerHTML = tableHTML;
                })
                .catch(error => {
                    console.error('获取数据失败:', error);
                    document.getElementById(tabName + '-content').innerHTML = '加载数据失败，请刷新页面重试。';
                });
        }
        
        // 创建表格
        function createTable(data, type) {
            if (!data || data.length === 0) {
                return '<p>暂无数据</p>';
            }
            
            let html = '<button class="button" onclick="alert(\'此功能在演示版中不可用\')">添加新' + 
                        (type === 'policies' ? '政策' : 
                         type === 'products' ? '商品' : 
                         type === 'orders' ? '订单' : '用户') + 
                        '</button>';
            
            if (type === 'policies') {
                html += ' <button class="button" onclick="alert(\'此功能在演示版中不可用\')">抓取政策</button>';
            }
            
            html += '<table><thead><tr>';
            
            // 表头
            if (type === 'policies') {
                html += '<th>ID</th><th>标题</th><th>发布日期</th><th>分类</th><th>状态</th><th>操作</th>';
            } else if (type === 'products') {
                html += '<th>ID</th><th>商品名称</th><th>价格</th><th>库存</th><th>农户</th><th>状态</th><th>操作</th>';
            } else if (type === 'orders') {
                html += '<th>订单号</th><th>客户</th><th>订单金额</th><th>下单时间</th><th>状态</th><th>操作</th>';
            } else if (type === 'users') {
                html += '<th>ID</th><th>用户名</th><th>角色</th><th>注册时间</th><th>状态</th><th>操作</th>';
            }
            
            html += '</tr></thead><tbody>';
            
            // 表内容
            data.forEach(item => {
                html += '<tr>';
                
                if (type === 'policies') {
                    html += '<td>' + item.id + '</td>' +
                            '<td>' + item.title + '</td>' +
                            '<td>' + item.publishDate + '</td>' +
                            '<td>' + item.category + '</td>' +
                            '<td><span class="badge badge-' + 
                                (item.status === '已发布' ? 'success' : 
                                 item.status === '待审核' ? 'warning' : 'info') + 
                                '">' + item.status + '</span></td>' +
                            '<td>' +
                                '<button class="button" onclick="alert(\'此功能在演示版中不可用\')">编辑</button> ' +
                                '<button class="button" onclick="alert(\'此功能在演示版中不可用\')">删除</button>' +
                            '</td>';
                } else if (type === 'products') {
                    html += '<td>' + item.id + '</td>' +
                            '<td>' + item.name + '</td>' +
                            '<td>¥' + item.price + '/' + item.unit + '</td>' +
                            '<td>' + item.stock + item.unit + '</td>' +
                            '<td>' + item.farmer + '</td>' +
                            '<td><span class="badge badge-' + 
                                (item.status === '在售' ? 'success' : 
                                 item.status === '缺货' ? 'danger' : 'info') + 
                                '">' + item.status + '</span></td>' +
                            '<td>' +
                                '<button class="button" onclick="alert(\'此功能在演示版中不可用\')">编辑</button> ' +
                                '<button class="button" onclick="alert(\'此功能在演示版中不可用\')">' + 
                                (item.status === '在售' ? '下架' : '上架') + '</button>' +
                            '</td>';
                } else if (type === 'orders') {
                    html += '<td>' + item.id + '</td>' +
                            '<td>' + item.customer + '</td>' +
                            '<td>¥' + item.amount.toFixed(2) + '</td>' +
                            '<td>' + item.orderTime + '</td>' +
                            '<td><span class="badge badge-' + 
                                (item.status === '已发货' ? 'success' : 
                                 item.status === '已付款' ? 'info' :
                                 item.status === '待付款' ? 'warning' : 'danger') + 
                                '">' + item.status + '</span></td>' +
                            '<td>';
                    
                    if (item.status === '已付款') {
                        html += '<button class="button" onclick="alert(\'此功能在演示版中不可用\')">发货</button> ';
                    } else if (item.status === '待付款') {
                        html += '<button class="button" onclick="alert(\'此功能在演示版中不可用\')">提醒付款</button> ';
                    }
                    
                    html += '<button class="button" onclick="alert(\'此功能在演示版中不可用\')">详情</button></td>';
                } else if (type === 'users') {
                    html += '<td>' + item.id + '</td>' +
                            '<td>' + item.username + '</td>' +
                            '<td>' + item.role + '</td>' +
                            '<td>' + item.registerDate + '</td>' +
                            '<td><span class="badge badge-' + 
                                (item.status === '活跃' ? 'success' : 
                                 item.status === '待验证' ? 'warning' : 'danger') + 
                                '">' + item.status + '</span></td>' +
                            '<td>' +
                                '<button class="button" onclick="alert(\'此功能在演示版中不可用\')">编辑</button> ';
                    
                    if (item.status === '待验证') {
                        html += '<button class="button" onclick="alert(\'此功能在演示版中不可用\')">验证</button>';
                    } else if (item.role !== '管理员') {
                        html += '<button class="button" onclick="alert(\'此功能在演示版中不可用\')">禁用</button>';
                    }
                    
                    html += '</td>';
                }
                
                html += '</tr>';
            });
            
            html += '</tbody></table>';
            return html;
        }
        
        // 初始加载政策数据
        loadTabData('policies');
    </script>
</body>
</html>
`;

// 写入HTML文件
fs.writeFileSync(path.join(adminDir, 'index.html'), adminHtml);

// API路由
app.get('/api/policies', (req, res) => {
    const policies = JSON.parse(fs.readFileSync(policiesFile, 'utf8'));
    res.json(policies);
});

app.get('/api/products', (req, res) => {
    const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
    res.json(products);
});

app.get('/api/orders', (req, res) => {
    const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
    res.json(orders);
});

app.get('/api/users', (req, res) => {
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    res.json(users);
});

// 主页路由
app.get('/', (req, res) => {
    res.redirect('/admin');
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(adminDir, 'index.html'));
});

// 状态检查接口
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        serverTime: new Date().toISOString(),
        version: '1.0.0',
        port: PORT
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器成功启动 http://localhost:${PORT}`);
    console.log(`访问管理后台: http://localhost:${PORT}/admin`);
}); 