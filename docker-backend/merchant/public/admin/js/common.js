// 全局变量
let token = localStorage.getItem('merchantToken');
let tokenExpireTime = localStorage.getItem('tokenExpireTime');

// 检查登录状态
function checkAuth() {
    return new Promise((resolve, reject) => {
        if (!token) {
            window.location.href = 'login.html';
            reject(new Error('未登录'));
            return;
        }
        
        // 检查token是否过期
        if (tokenExpireTime && Date.now() > parseInt(tokenExpireTime)) {
            logout();
            reject(new Error('Token已过期'));
            return;
        }
        
        resolve(true);
    });
}

// 退出登录
function logout() {
    localStorage.removeItem('merchantToken');
    localStorage.removeItem('merchantInfo');
    localStorage.removeItem('tokenExpireTime');
    window.location.href = 'login.html';
}

// 显示提示信息
function showAlert(message, type = 'success') {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    if (!alertPlaceholder) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertPlaceholder.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// 显示加载状态
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
    }
}

// 隐藏加载状态
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// 显示错误信息
function showError(message) {
    showAlert(message, 'danger');
}

// 显示成功信息
function showSuccess(message) {
    showAlert(message, 'success');
}

// API请求封装
async function apiRequest(url, method = 'GET', data = null) {
    try {
        console.log(`发起${method}请求:`, url, data);
        
        // 确保token是最新的
        token = localStorage.getItem('merchantToken');
        
        // 构建请求选项
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        // 只有在token存在时才添加Authorization头
        if (token) {
            console.log('使用Token:', token.substring(0, 15) + '...');
            options.headers['Authorization'] = `Bearer ${token}`;
        } else {
            console.warn('请求未包含Token');
        }
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        console.log(`收到响应状态: ${response.status}`);
        
        // 处理token过期
        if (response.status === 401) {
            showAlert('登录已过期，请重新登录', 'warning');
            setTimeout(() => {
                logout();
            }, 2000);
            return null;
        }
        
        const result = await response.json();
        console.log('响应数据:', result);
        
        if (!response.ok) {
            showAlert(result.message || '请求失败', 'danger');
            return { success: false, message: result.message || '请求失败' };
        }
        
        return result;
    } catch (error) {
        console.error('API请求错误:', error);
        showAlert('网络请求失败，请检查网络连接', 'danger');
        return { success: false, message: '网络请求失败' };
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 格式化日期
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 格式化金额
function formatPrice(price) {
    if (price === undefined || price === null) return '0.00';
    return parseFloat(price).toFixed(2);
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 添加退出登录事件监听
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // 添加移动端侧边栏切换
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
}); 