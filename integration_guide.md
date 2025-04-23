# 商家管理系统前后端集成指南

本文档提供了将现有前端页面与后端API服务进行集成的详细步骤。

## 1. 准备工作

### 1.1 安装后端依赖项

后端API服务器基于Python的Flask框架，首先需要安装相关依赖：

```bash
pip install flask flask-cors werkzeug
```

### 1.2 添加API连接器

将`merchant_api_connector.js`文件添加到您的前端项目中，建议放在`js`目录下。然后在HTML页面中引入此脚本：

```html
<script src="js/merchant_api_connector.js"></script>
```

## 2. 启动后端服务

运行后端API服务：

```bash
python merchant_server.py
```

服务默认在`http://localhost:5000`上运行，可以通过浏览器访问此地址测试API是否正常工作。

## 3. 前端集成步骤

### 3.1 登录功能

在您的登录表单中添加以下JavaScript代码：

```javascript
// 获取登录表单元素
const loginForm = document.getElementById('login-form');

// 添加提交事件监听器
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    // 调用API连接器的登录方法
    await merchantApi.login(username, password);
    
    // 登录成功后跳转到商品管理页面
    window.location.href = 'products.html';
  } catch (error) {
    // 显示错误消息
    alert('登录失败: ' + error.message);
  }
});

// 监听登录成功事件
document.addEventListener('login-success', (event) => {
  console.log('登录成功:', event.detail.data);
});

// 监听已登录状态事件
document.addEventListener('already-logged-in', (event) => {
  // 如果用户已登录，直接跳转到商品管理页面
  window.location.href = 'products.html';
});
```

### 3.2 注册功能

在您的注册表单中添加以下JavaScript代码：

```javascript
// 获取注册表单元素
const registerForm = document.getElementById('register-form');

// 添加提交事件监听器
registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  
  try {
    // 调用API连接器的注册方法
    await merchantApi.register(username, password);
    
    // 注册成功后提示用户
    alert('注册成功，请登录');
    
    // 跳转到登录页面
    window.location.href = 'login.html';
  } catch (error) {
    // 显示错误消息
    alert('注册失败: ' + error.message);
  }
});
```

### 3.3 商品列表功能

在您的商品列表页面中添加以下JavaScript代码：

```javascript
// 在页面加载时获取商品列表
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 检查登录状态
    const isLoggedIn = await merchantApi.checkLoginStatus();
    if (!isLoggedIn) {
      // 如果未登录，跳转到登录页面
      window.location.href = 'login.html';
      return;
    }
    
    // 获取商品列表
    await merchantApi.getProducts();
  } catch (error) {
    console.error('加载商品列表失败:', error);
  }
});

// 监听商品列表更新事件
document.addEventListener('products-updated', (event) => {
  const products = event.detail.data;
  
  // 获取商品列表容器
  const productsList = document.getElementById('products-list');
  
  // 清空当前列表
  productsList.innerHTML = '';
  
  // 没有商品时显示提示
  if (products.length === 0) {
    productsList.innerHTML = '<div class="no-products">暂无商品</div>';
    return;
  }
  
  // 遍历商品并创建列表项
  products.forEach(product => {
    const productItem = document.createElement('div');
    productItem.className = 'product-item';
    productItem.dataset.id = product.id;
    
    productItem.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="price">¥${product.price.toFixed(2)}</p>
        <p class="description">${product.description}</p>
      </div>
      <div class="product-actions">
        <button class="edit-btn" data-id="${product.id}">编辑</button>
        <button class="delete-btn" data-id="${product.id}">删除</button>
      </div>
    `;
    
    productsList.appendChild(productItem);
  });
  
  // 添加编辑按钮点击事件
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = btn.dataset.id;
      // 跳转到编辑页面
      window.location.href = `edit-product.html?id=${productId}`;
    });
  });
  
  // 添加删除按钮点击事件
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('确定要删除此商品吗？')) {
        const productId = btn.dataset.id;
        try {
          await merchantApi.deleteProduct(productId);
          // 删除成功后重新加载商品列表
          await merchantApi.getProducts();
        } catch (error) {
          alert('删除商品失败: ' + error.message);
        }
      }
    });
  });
});
```

### 3.4 添加商品功能

在您的添加商品表单中添加以下JavaScript代码：

```javascript
// 获取添加商品表单元素
const addProductForm = document.getElementById('add-product-form');

// 添加提交事件监听器
addProductForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const name = document.getElementById('product-name').value;
  const price = document.getElementById('product-price').value;
  const description = document.getElementById('product-description').value;
  const imageFile = document.getElementById('product-image').files[0];
  
  if (!name || !price || !imageFile) {
    alert('请填写商品名称、价格并上传图片');
    return;
  }
  
  try {
    // 构建商品数据
    const productData = {
      name,
      price,
      description
    };
    
    // 调用API连接器的添加商品方法
    await merchantApi.addProduct(productData, imageFile);
    
    // 添加成功后提示用户
    alert('商品添加成功');
    
    // 跳转到商品列表页面
    window.location.href = 'products.html';
  } catch (error) {
    // 显示错误消息
    alert('添加商品失败: ' + error.message);
  }
});
```

### 3.5 编辑商品功能

在您的编辑商品页面中添加以下JavaScript代码：

```javascript
// 获取URL中的商品ID
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// 获取编辑商品表单元素
const editProductForm = document.getElementById('edit-product-form');

// 在页面加载时获取商品信息
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 检查登录状态
    const isLoggedIn = await merchantApi.checkLoginStatus();
    if (!isLoggedIn) {
      // 如果未登录，跳转到登录页面
      window.location.href = 'login.html';
      return;
    }
    
    if (!productId) {
      alert('缺少商品ID');
      window.location.href = 'products.html';
      return;
    }
    
    // 获取商品列表
    const response = await merchantApi.getProducts();
    const products = response.data;
    
    // 查找当前编辑的商品
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      alert('商品不存在');
      window.location.href = 'products.html';
      return;
    }
    
    // 填充表单
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-description').value = product.description || '';
    
    // 显示当前图片
    const currentImage = document.getElementById('current-image');
    if (currentImage) {
      currentImage.src = product.image;
      currentImage.style.display = 'block';
    }
    
  } catch (error) {
    console.error('加载商品信息失败:', error);
  }
});

// 添加提交事件监听器
editProductForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const name = document.getElementById('product-name').value;
  const price = document.getElementById('product-price').value;
  const description = document.getElementById('product-description').value;
  const imageInput = document.getElementById('product-image');
  
  if (!name || !price) {
    alert('请填写商品名称和价格');
    return;
  }
  
  try {
    // 构建商品数据
    const productData = {
      name,
      price,
      description
    };
    
    // 检查是否有新图片上传
    let imageFile = null;
    if (imageInput.files.length > 0) {
      imageFile = imageInput.files[0];
    }
    
    // 调用API连接器的更新商品方法
    await merchantApi.updateProduct(productId, productData, imageFile);
    
    // 更新成功后提示用户
    alert('商品更新成功');
    
    // 跳转到商品列表页面
    window.location.href = 'products.html';
  } catch (error) {
    // 显示错误消息
    alert('更新商品失败: ' + error.message);
  }
});
```

### 3.6 注销功能

在您的页面中添加以下注销按钮的处理代码：

```javascript
// 获取注销按钮元素
const logoutBtn = document.getElementById('logout-btn');

// 添加点击事件监听器
logoutBtn.addEventListener('click', async () => {
  try {
    // 调用API连接器的注销方法
    await merchantApi.logout();
    
    // 注销成功后跳转到登录页面
    window.location.href = 'login.html';
  } catch (error) {
    // 显示错误消息
    alert('注销失败: ' + error.message);
  }
});

// 监听注销成功事件
document.addEventListener('logout-success', () => {
  console.log('已成功注销');
});
```

### 3.7 通知功能

在您的页面中添加以下通知功能代码：

```javascript
// 获取通知容器元素
const notificationsContainer = document.getElementById('notifications');
const notificationsBadge = document.getElementById('notifications-badge');

// 监听通知更新事件
document.addEventListener('notifications-updated', (event) => {
  const notificationsData = event.detail.data;
  const notifications = notificationsData.data;
  
  // 更新通知角标数量
  const unreadCount = notifications.filter(n => !n.read).length;
  if (unreadCount > 0) {
    notificationsBadge.textContent = unreadCount;
    notificationsBadge.style.display = 'block';
  } else {
    notificationsBadge.style.display = 'none';
  }
  
  // 如果通知列表可见，则显示通知
  if (notificationsContainer.style.display !== 'none') {
    // 清空当前列表
    notificationsContainer.innerHTML = '';
    
    // 遍历通知并创建列表项
    notifications.forEach(notification => {
      const notificationItem = document.createElement('div');
      notificationItem.className = 'notification-item';
      if (!notification.read) {
        notificationItem.classList.add('unread');
      }
      
      notificationItem.innerHTML = `
        <div class="notification-content">${notification.message}</div>
        <div class="notification-time">${formatDate(notification.created_at)}</div>
      `;
      
      notificationsContainer.appendChild(notificationItem);
    });
  }
});

// 格式化日期函数
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// 在登录成功后开始轮询通知
document.addEventListener('login-success', () => {
  merchantApi.startNotificationPolling();
});
```

### 3.8 统计数据功能

在您的仪表盘页面中添加以下统计数据代码：

```javascript
// 在页面加载时获取统计数据
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 检查登录状态
    const isLoggedIn = await merchantApi.checkLoginStatus();
    if (!isLoggedIn) {
      // 如果未登录，跳转到登录页面
      window.location.href = 'login.html';
      return;
    }
    
    // 获取统计数据
    await merchantApi.getStatistics();
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
});

// 监听统计数据更新事件
document.addEventListener('statistics-updated', (event) => {
  const stats = event.detail.data;
  
  // 更新统计卡片
  document.getElementById('total-products').textContent = stats.total_products;
  
  if (stats.active_products !== undefined) {
    // 商家视图
    document.getElementById('active-products').textContent = stats.active_products;
    document.getElementById('total-orders').textContent = stats.total_orders;
    document.getElementById('revenue').textContent = `¥${stats.revenue.toFixed(2)}`;
  } else {
    // 管理员视图
    document.getElementById('total-merchants').textContent = stats.total_merchants;
    document.getElementById('total-orders').textContent = stats.total_orders;
    document.getElementById('revenue').textContent = `¥${stats.revenue.toFixed(2)}`;
  }
});
```

## 4. 页面访问权限控制

为确保只有登录用户才能访问受保护的页面，在每个页面添加以下代码：

```javascript
// 在页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 检查登录状态
    const isLoggedIn = await merchantApi.checkLoginStatus();
    if (!isLoggedIn) {
      // 如果未登录，跳转到登录页面
      window.location.href = 'login.html';
      return;
    }
  } catch (error) {
    console.error('检查登录状态失败:', error);
    window.location.href = 'login.html';
  }
});
```

## 5. 常见问题与解决方案

### 5.1 跨域问题

如果前端和后端部署在不同的域名下，可能会遇到跨域问题。后端服务已经启用了CORS支持，但如果仍有问题，可以尝试以下解决方案：

1. 确保正确配置了后端的CORS设置
2. 使用代理服务器转发请求
3. 在开发环境中使用浏览器扩展禁用CORS限制

### 5.2 文件上传限制

默认文件上传大小限制为16MB，如需修改，请在`merchant_server.py`中调整以下配置：

```python
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 修改为所需大小
```

### 5.3 服务器地址配置

如果API服务器不是运行在默认的`http://localhost:5000`上，需要在初始化API连接器时指定正确的地址：

```javascript
// 自定义API服务器地址
const merchantApi = new MerchantApiConnector('http://your-server-address/api');
```

## 6. 后续步骤

### 6.1 数据持久化

当前实现使用内存存储数据，服务器重启后数据会丢失。建议实现数据持久化，可以考虑：

1. 使用SQLite、MySQL或PostgreSQL等关系型数据库
2. 使用MongoDB等NoSQL数据库
3. 简单情况下，可以使用JSON文件存储数据

### 6.2 实时通知

目前使用轮询方式获取通知，可以考虑升级为WebSocket实现真正的实时通知：

1. 在后端添加WebSocket支持（如使用Flask-SocketIO）
2. 在前端使用WebSocket连接接收实时更新

### 6.3 安全增强

建议实施以下安全措施：

1. 使用HTTPS加密通信
2. 实现更复杂的身份验证机制，如JWT
3. 添加请求频率限制，防止暴力攻击
4. 实现输入验证和防XSS攻击措施

## 7. 技术支持

如有任何问题，请联系技术支持团队：

- 邮箱：support@example.com
- 电话：12345678910 