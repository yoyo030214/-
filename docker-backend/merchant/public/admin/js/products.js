// 全局变量
let currentPage = 1;
const pageSize = 12;
let totalPages = 1;
let totalProducts = 0;

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

// 获取商品列表
async function fetchProducts(page = 1) {
    try {
        const queryParams = new URLSearchParams({
            page: page,
            limit: pageSize
        });
        
        // 添加筛选条件
        const category = document.getElementById('categoryFilter').value;
        const status = document.getElementById('statusFilter').value;
        const search = document.getElementById('searchInput').value;
        
        if (category) queryParams.append('category', category);
        if (status) queryParams.append('status', status);
        if (search) queryParams.append('search', search);
        
        const response = await fetch(`/api/merchant/products?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('获取商品列表失败');
        }
        
        const data = await response.json();
        currentPage = page;
        totalPages = data.totalPages;
        totalProducts = data.total;
        
        // 更新商品数量显示
        document.getElementById('productCount').textContent = totalProducts;
        
        // 渲染商品列表
        renderProducts(data.products);
        
        // 渲染分页
        renderPagination();
    } catch (error) {
        console.error('获取商品列表错误:', error);
        showAlert('获取商品列表失败', 'danger');
    }
}

// 渲染商品列表
function renderProducts(products) {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'col-md-4 mb-4';
        productCard.innerHTML = `
            <div class="card product-card">
                <div class="position-relative">
                    <img src="${product.images[0] || '/merchant/public/admin/assets/placeholder.png'}" 
                         class="card-img-top product-image" alt="${product.name}">
                    <span class="badge ${product.status === 'on_sale' ? 'bg-success' : 'bg-secondary'} 
                          position-absolute top-0 end-0 m-2 status-badge">
                        ${product.status === 'on_sale' ? '在售' : '下架'}
                    </span>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text text-muted">${product.description || '暂无描述'}</p>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-info">${product.category_name || '未分类'}</span>
                        <span class="text-primary fw-bold">¥${product.price.toFixed(2)}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-box me-1"></i>库存: ${product.stock} 件
                        </small>
                        <small class="text-muted">
                            <i class="fas fa-chart-line me-1"></i>销量: ${product.sales_count || 0}
                        </small>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-primary" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit me-1"></i>编辑
                        </button>
                        <button class="btn btn-sm ${product.status === 'on_sale' ? 'btn-outline-warning' : 'btn-outline-success'}" 
                                onclick="toggleProductStatus('${product.id}', '${product.status === 'on_sale' ? 'off_sale' : 'on_sale'}')">
                            <i class="fas ${product.status === 'on_sale' ? 'fa-times' : 'fa-check'} me-1"></i>
                            ${product.status === 'on_sale' ? '下架' : '上架'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        productList.appendChild(productCard);
    });
}

// 渲染分页
function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    // 上一页
    pagination.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="fetchProducts(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // 页码
    for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="fetchProducts(${i})">${i}</a>
            </li>
        `;
    }
    
    // 下一页
    pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="fetchProducts(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
}

// 获取商品分类
async function fetchCategories() {
    try {
        const response = await fetch('/api/merchant/products/categories', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('获取商品分类失败');
        }
        
        const data = await response.json();
        const categorySelect = document.getElementById('categoryFilter');
        
        data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('获取商品分类错误:', error);
        showAlert('获取商品分类失败', 'danger');
    }
}

// 编辑商品
async function editProduct(productId) {
    try {
        const response = await fetch(`/api/merchant/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('获取商品详情失败');
        }
        
        const data = await response.json();
        const product = data.product;
        
        // 设置模态框标题
        document.querySelector('#productFormModal .modal-title').textContent = '编辑商品';
        
        // 渲染表单
        renderProductForm(product);
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('productFormModal'));
        modal.show();
    } catch (error) {
        console.error('获取商品详情错误:', error);
        showAlert('获取商品详情失败', 'danger');
    }
}

// 渲染商品表单
function renderProductForm(product = null) {
    const form = document.getElementById('productForm');
    form.innerHTML = `
        <input type="hidden" id="productId" value="${product ? product.id : ''}">
        <div class="row mb-3">
            <div class="col-md-6">
                <label class="form-label">商品名称</label>
                <input type="text" class="form-control" id="productName" value="${product ? product.name : ''}" required>
            </div>
            <div class="col-md-6">
                <label class="form-label">商品分类</label>
                <select class="form-select" id="productCategory" required>
                    <option value="">请选择分类</option>
                    <!-- 分类选项将通过JavaScript动态加载 -->
                </select>
            </div>
        </div>
        <div class="row mb-3">
            <div class="col-md-6">
                <label class="form-label">价格</label>
                <div class="input-group">
                    <span class="input-group-text">¥</span>
                    <input type="number" class="form-control" id="productPrice" 
                           value="${product ? product.price : ''}" step="0.01" min="0" required>
                </div>
            </div>
            <div class="col-md-6">
                <label class="form-label">库存</label>
                <div class="input-group">
                    <input type="number" class="form-control" id="productStock" 
                           value="${product ? product.stock : ''}" min="0" required>
                    <span class="input-group-text">件</span>
                </div>
            </div>
        </div>
        <div class="mb-3">
            <label class="form-label">商品图片</label>
            <input type="file" class="form-control" id="productImage" accept="image/*" multiple>
            <div class="mt-2" id="imagePreview">
                ${product && product.images ? product.images.map(image => `
                    <img src="${image}" class="img-thumbnail me-2 mb-2" style="height: 100px;">
                `).join('') : ''}
            </div>
        </div>
        <div class="mb-3">
            <label class="form-label">商品描述</label>
            <textarea class="form-control" id="productDescription" rows="3">${product ? product.description : ''}</textarea>
        </div>
        <div class="mb-3">
            <label class="form-label">商品详情</label>
            <textarea class="form-control" id="productDetails" rows="5">${product ? product.details : ''}</textarea>
        </div>
        <div class="row mb-3">
            <div class="col-md-6">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="productStatus" 
                           ${product && product.status === 'on_sale' ? 'checked' : ''}>
                    <label class="form-check-label">立即上架</label>
                </div>
            </div>
            <div class="col-md-6">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="productFeatured" 
                           ${product && product.is_featured ? 'checked' : ''}>
                    <label class="form-check-label">推荐商品</label>
                </div>
            </div>
        </div>
        <div class="text-end">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
        </div>
    `;
    
    // 加载分类选项
    loadCategoryOptions(product ? product.category_id : null);
    
    // 图片预览
    document.getElementById('productImage').addEventListener('change', function() {
        previewImages(this.files);
    });
    
    // 表单提交
    form.addEventListener('submit', handleProductSubmit);
}

// 加载分类选项
async function loadCategoryOptions(selectedId = null) {
    try {
        const response = await fetch('/api/merchant/products/categories', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('获取商品分类失败');
        }
        
        const data = await response.json();
        const select = document.getElementById('productCategory');
        
        data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            option.selected = category.id === selectedId;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('获取商品分类错误:', error);
        showAlert('获取商品分类失败', 'danger');
    }
}

// 预览图片
function previewImages(files) {
    const preview = document.getElementById('imagePreview');
    
    for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'img-thumbnail me-2 mb-2';
            img.style.height = '100px';
            preview.appendChild(img);
        }
        reader.readAsDataURL(files[i]);
    }
}

// 处理表单提交
async function handleProductSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData();
        formData.append('name', document.getElementById('productName').value);
        formData.append('category_id', document.getElementById('productCategory').value);
        formData.append('price', document.getElementById('productPrice').value);
        formData.append('stock', document.getElementById('productStock').value);
        formData.append('description', document.getElementById('productDescription').value);
        formData.append('details', document.getElementById('productDetails').value);
        formData.append('status', document.getElementById('productStatus').checked ? 'on_sale' : 'off_sale');
        formData.append('is_featured', document.getElementById('productFeatured').checked);
        
        const productId = document.getElementById('productId').value;
        const method = productId ? 'PUT' : 'POST';
        const url = productId ? `/api/merchant/products/${productId}` : '/api/merchant/products';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(productId ? '更新商品失败' : '添加商品失败');
        }
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('productFormModal'));
        modal.hide();
        
        // 刷新商品列表
        fetchProducts(currentPage);
        
        showAlert(productId ? '商品更新成功' : '商品添加成功');
    } catch (error) {
        console.error('保存商品错误:', error);
        showAlert(error.message, 'danger');
    }
}

// 切换商品状态
async function toggleProductStatus(productId, newStatus) {
    try {
        const response = await fetch(`/api/merchant/products/${productId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            throw new Error('更新商品状态失败');
        }
        
        // 刷新商品列表
        fetchProducts(currentPage);
        
        showAlert(`商品已${newStatus === 'on_sale' ? '上架' : '下架'}`);
    } catch (error) {
        console.error('更新商品状态错误:', error);
        showAlert('更新商品状态失败', 'danger');
    }
}

// 重置筛选条件
function resetFilters() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('searchInput').value = '';
    fetchProducts(1);
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 加载商品分类
        await fetchCategories();
        
        // 加载商品列表
        await fetchProducts();
        
        // 添加事件监听器
        document.getElementById('filterBtn').addEventListener('click', () => fetchProducts(1));
        document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
        document.getElementById('searchInput').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                fetchProducts(1);
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