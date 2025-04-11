// 全局变量
let currentPage = 1;
const pageSize = 12;
let totalPages = 1;
let totalCustomers = 0;
let currentCustomerId = null;
let categoryChart = null;

// 检查登录状态
const token = localStorage.getItem('merchantToken');
if (!token) {
    window.location.href = 'login.html';
}

// 显示提示信息
function showAlert(message, type = 'success') {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
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

// 获取客户列表
async function fetchCustomers(page = 1) {
    try {
        const queryParams = new URLSearchParams({
            page: page,
            limit: pageSize
        });
        
        // 添加筛选条件
        const status = document.getElementById('statusFilter').value;
        const level = document.getElementById('levelFilter').value;
        const search = document.getElementById('searchInput').value;
        
        if (status) queryParams.append('status', status);
        if (level) queryParams.append('level', level);
        if (search) queryParams.append('search', search);
        
        const response = await fetch(`/api/merchant/customers?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('获取客户列表失败');
        }
        
        const data = await response.json();
        currentPage = page;
        totalPages = data.totalPages;
        totalCustomers = data.total;
        
        // 更新客户数量显示
        document.getElementById('customerCount').textContent = totalCustomers;
        
        // 渲染客户列表
        renderCustomers(data.customers);
        
        // 渲染分页
        renderPagination();
    } catch (error) {
        console.error('获取客户列表错误:', error);
        showAlert('获取客户列表失败', 'danger');
    }
}

// 渲染客户列表
function renderCustomers(customers) {
    const customerList = document.getElementById('customerList');
    customerList.innerHTML = '';
    
    customers.forEach(customer => {
        const customerCard = document.createElement('div');
        customerCard.className = 'col-md-4 mb-4';
        customerCard.innerHTML = `
            <div class="card customer-card">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <img src="${customer.avatar || '/merchant/public/admin/assets/default-avatar.png'}" 
                             class="customer-avatar me-3" alt="${customer.name}">
                        <div>
                            <h5 class="card-title mb-1">${customer.name}</h5>
                            <span class="badge ${getLevelBadgeClass(customer.level)}">
                                ${getLevelText(customer.level)}
                            </span>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-phone me-2 text-muted"></i>
                            <span>${customer.phone}</span>
                        </div>
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-envelope me-2 text-muted"></i>
                            <span>${customer.email || '未设置'}</span>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="fas fa-map-marker-alt me-2 text-muted"></i>
                            <span>${customer.address || '未设置'}</span>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="text-muted d-block">
                                <i class="fas fa-shopping-cart me-1"></i>订单数: ${customer.order_count || 0}
                            </small>
                            <small class="text-muted">
                                <i class="fas fa-yen-sign me-1"></i>消费额: ¥${(customer.total_spent || 0).toFixed(2)}
                            </small>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewCustomerDetail('${customer.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="editCustomer('${customer.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="toggleCustomerStatus('${customer.id}', '${customer.status === 'active' ? 'inactive' : 'active'}')">
                                <i class="fas ${customer.status === 'active' ? 'fa-ban' : 'fa-check'}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        customerList.appendChild(customerCard);
    });
}

// 获取会员等级徽章样式
function getLevelBadgeClass(level) {
    switch (level) {
        case 'svip':
            return 'bg-danger';
        case 'vip':
            return 'bg-warning';
        default:
            return 'bg-secondary';
    }
}

// 获取会员等级文本
function getLevelText(level) {
    switch (level) {
        case 'svip':
            return 'SVIP会员';
        case 'vip':
            return 'VIP会员';
        default:
            return '普通会员';
    }
}

// 渲染分页
function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    // 上一页
    pagination.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="fetchCustomers(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // 页码
    for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="fetchCustomers(${i})">${i}</a>
            </li>
        `;
    }
    
    // 下一页
    pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="fetchCustomers(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
}

// 查看客户详情
async function viewCustomerDetail(customerId) {
    try {
        const response = await fetch(`/api/merchant/customers/${customerId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('获取客户详情失败');
        }
        
        const data = await response.json();
        const customer = data.customer;
        
        // 渲染客户详情
        const modalBody = document.querySelector('#customerDetailModal .modal-body');
        modalBody.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-4 text-center">
                    <img src="${customer.avatar || '/merchant/public/admin/assets/default-avatar.png'}" 
                         class="customer-avatar mb-3" style="width: 100px; height: 100px;">
                    <h4>${customer.name}</h4>
                    <span class="badge ${getLevelBadgeClass(customer.level)}">
                        ${getLevelText(customer.level)}
                    </span>
                </div>
                <div class="col-md-8">
                    <div class="row mb-2">
                        <div class="col-md-4 fw-bold">联系电话:</div>
                        <div class="col-md-8">${customer.phone}</div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-md-4 fw-bold">电子邮箱:</div>
                        <div class="col-md-8">${customer.email || '未设置'}</div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-md-4 fw-bold">收货地址:</div>
                        <div class="col-md-8">${customer.address || '未设置'}</div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-md-4 fw-bold">注册时间:</div>
                        <div class="col-md-8">${formatDate(customer.create_time)}</div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-md-4 fw-bold">最近登录:</div>
                        <div class="col-md-8">${formatDate(customer.last_login_time)}</div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0">消费统计</h5>
                        </div>
                        <div class="card-body">
                            <table class="table table-sm">
                                <tbody>
                                    <tr>
                                        <th>订单总数:</th>
                                        <td>${customer.order_count || 0} 单</td>
                                    </tr>
                                    <tr>
                                        <th>消费总额:</th>
                                        <td>¥${(customer.total_spent || 0).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <th>平均单价:</th>
                                        <td>¥${((customer.total_spent || 0) / (customer.order_count || 1)).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <th>最近购买:</th>
                                        <td>${customer.last_order_time ? formatDate(customer.last_order_time) : '暂无'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0">偏好分析</h5>
                        </div>
                        <div class="card-body">
                            <p class="fw-bold mb-2">常购产品类别:</p>
                            <div class="mb-3">
                                ${renderCategoryPreferences(customer.category_preferences)}
                            </div>
                            <p class="fw-bold mb-2">最常购买产品:</p>
                            <ul class="list-group list-group-flush">
                                ${renderTopProducts(customer.top_products)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('customerDetailModal'));
        modal.show();
    } catch (error) {
        console.error('获取客户详情错误:', error);
        showAlert('获取客户详情失败', 'danger');
    }
}

// 渲染产品类别偏好
function renderCategoryPreferences(preferences) {
    if (!preferences || preferences.length === 0) {
        return '<span class="text-muted">暂无数据</span>';
    }
    
    return preferences.map(pref => `
        <span class="badge bg-primary me-1">${pref.name} (${pref.percentage}%)</span>
    `).join('');
}

// 渲染最常购买产品
function renderTopProducts(products) {
    if (!products || products.length === 0) {
        return '<li class="list-group-item text-muted">暂无数据</li>';
    }
    
    return products.map(product => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
            ${product.name}
            <span class="badge bg-primary rounded-pill">${product.count}次</span>
        </li>
    `).join('');
}

// 编辑客户
async function editCustomer(customerId) {
    try {
        const response = await fetch(`/api/merchant/customers/${customerId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('获取客户信息失败');
        }
        
        const data = await response.json();
        const customer = data.customer;
        
        // 设置模态框标题
        document.querySelector('#customerFormModal .modal-title').textContent = '编辑客户';
        
        // 渲染表单
        renderCustomerForm(customer);
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('customerFormModal'));
        modal.show();
    } catch (error) {
        console.error('获取客户信息错误:', error);
        showAlert('获取客户信息失败', 'danger');
    }
}

// 渲染客户表单
function renderCustomerForm(customer = null) {
    const form = document.getElementById('customerForm');
    form.innerHTML = `
        <input type="hidden" id="customerId" value="${customer ? customer.id : ''}">
        <div class="row mb-3">
            <div class="col-md-6">
                <label class="form-label">客户姓名</label>
                <input type="text" class="form-control" id="customerName" value="${customer ? customer.name : ''}" required>
            </div>
            <div class="col-md-6">
                <label class="form-label">联系电话</label>
                <input type="tel" class="form-control" id="customerPhone" value="${customer ? customer.phone : ''}" required>
            </div>
        </div>
        <div class="row mb-3">
            <div class="col-md-6">
                <label class="form-label">电子邮箱</label>
                <input type="email" class="form-control" id="customerEmail" value="${customer ? customer.email : ''}">
            </div>
            <div class="col-md-6">
                <label class="form-label">会员等级</label>
                <select class="form-select" id="customerLevel">
                    <option value="normal" ${customer && customer.level === 'normal' ? 'selected' : ''}>普通会员</option>
                    <option value="vip" ${customer && customer.level === 'vip' ? 'selected' : ''}>VIP会员</option>
                    <option value="svip" ${customer && customer.level === 'svip' ? 'selected' : ''}>SVIP会员</option>
                </select>
            </div>
        </div>
        <div class="mb-3">
            <label class="form-label">收货地址</label>
            <textarea class="form-control" id="customerAddress" rows="2">${customer ? customer.address : ''}</textarea>
        </div>
        <div class="mb-3">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="customerStatus" 
                       ${customer && customer.status === 'active' ? 'checked' : ''}>
                <label class="form-check-label">启用账号</label>
            </div>
        </div>
        <div class="text-end">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
        </div>
    `;
    
    // 表单提交
    form.addEventListener('submit', handleCustomerSubmit);
}

// 处理表单提交
async function handleCustomerSubmit(e) {
    e.preventDefault();
    
    try {
        const customerId = document.getElementById('customerId').value;
        const customerData = {
            name: document.getElementById('customerName').value,
            phone: document.getElementById('customerPhone').value,
            email: document.getElementById('customerEmail').value,
            level: document.getElementById('customerLevel').value,
            address: document.getElementById('customerAddress').value,
            status: document.getElementById('customerStatus').checked ? 'active' : 'inactive'
        };
        
        const method = customerId ? 'PUT' : 'POST';
        const url = customerId ? `/api/merchant/customers/${customerId}` : '/api/merchant/customers';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        });
        
        if (!response.ok) {
            throw new Error(customerId ? '更新客户信息失败' : '添加客户失败');
        }
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('customerFormModal'));
        modal.hide();
        
        // 刷新客户列表
        fetchCustomers(currentPage);
        
        showAlert(customerId ? '客户信息更新成功' : '客户添加成功');
    } catch (error) {
        console.error('保存客户信息错误:', error);
        showAlert(error.message, 'danger');
    }
}

// 切换客户状态
async function toggleCustomerStatus(customerId, newStatus) {
    try {
        const response = await fetch(`/api/merchant/customers/${customerId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            throw new Error('更新客户状态失败');
        }
        
        // 刷新客户列表
        fetchCustomers(currentPage);
        
        showAlert(`客户已${newStatus === 'active' ? '启用' : '禁用'}`);
    } catch (error) {
        console.error('更新客户状态错误:', error);
        showAlert('更新客户状态失败', 'danger');
    }
}

// 重置筛选条件
function resetFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('levelFilter').value = '';
    document.getElementById('searchInput').value = '';
    fetchCustomers(1);
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '暂无';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 加载客户列表
        await fetchCustomers();
        
        // 添加事件监听器
        document.getElementById('filterBtn').addEventListener('click', () => fetchCustomers(1));
        document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
        document.getElementById('searchInput').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                fetchCustomers(1);
            }
        });
        
        // 退出登录
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('merchantToken');
            window.location.href = 'login.html';
        });
    } catch (error) {
        console.error('初始化页面错误:', error);
        showAlert('页面加载失败', 'danger');
    }
}); 