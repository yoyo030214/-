// 全局变量
let token = localStorage.getItem('merchantToken');
let tokenExpireTime = localStorage.getItem('tokenExpireTime');

// 检查登录状态
function checkAuth() {
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    
    // 检查token是否过期
    if (tokenExpireTime && new Date().getTime() > parseInt(tokenExpireTime)) {
        logout();
        return false;
    }
    
    return true;
}

// 退出登录
function logout() {
    localStorage.removeItem('merchantToken');
    localStorage.removeItem('tokenExpireTime');
    window.location.href = 'login.html';
}

// 显示提示信息
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.appendChild(alertDiv);
        
        // 5秒后自动关闭
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
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

// API请求封装
async function apiRequest(url, method = 'GET', data = null) {
    try {
        showLoading();
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        if (response.status === 401) {
            logout();
            return null;
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || '请求失败');
        }
        
        return result;
    } catch (error) {
        console.error('API请求错误:', error);
        showError(error.message);
        return null;
    } finally {
        hideLoading();
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

// 格式化价格
function formatPrice(price) {
    return `¥${parseFloat(price).toFixed(2)}`;
}

// 显示成功信息
function showSuccess(message) {
    showAlert(message, 'success');
} 