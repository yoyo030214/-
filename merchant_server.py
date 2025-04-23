#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import json
import uuid
import time
import base64
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)  # 启用跨域请求支持

# 配置
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 限制上传文件大小为16MB

# 确保上传目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 数据存储（实际应用中应该使用数据库）
users = {
    "admin": {
        "username": "admin",
        "password": generate_password_hash("admin123"),
        "role": "admin",
        "created_at": datetime.now().isoformat()
    }
}

products = {}
orders = {}
notifications = []

# 会话存储
sessions = {}

# 实时连接管理（用于模拟WebSocket）
active_connections = {}


def allowed_file(filename):
    """检查文件类型是否允许上传"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def require_auth(f):
    """身份验证装饰器"""
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or token not in sessions:
            return jsonify({"status": "error", "message": "未授权访问"}), 401
        return f(*args, **kwargs)
    decorated.__name__ = f.__name__
    return decorated


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"status": "error", "message": "请提供用户名和密码"}), 400

    user = users.get(username)
    if not user or not check_password_hash(user['password'], password):
        return jsonify({"status": "error", "message": "用户名或密码错误"}), 401

    # 创建会话
    token = str(uuid.uuid4())
    sessions[token] = {
        "username": username,
        "created_at": datetime.now().isoformat()
    }

    # 添加系统通知
    add_notification(f"用户 {username} 已登录系统")

    return jsonify({
        "status": "success", 
        "message": "登录成功",
        "token": token,
        "user": {
            "username": user['username'],
            "role": user['role']
        }
    })


@app.route('/api/logout', methods=['POST'])
@require_auth
def logout():
    token = request.headers.get('Authorization')
    if token in sessions:
        username = sessions[token]['username']
        del sessions[token]
        add_notification(f"用户 {username} 已退出系统")
        return jsonify({"status": "success", "message": "已成功登出"})
    return jsonify({"status": "error", "message": "无效的会话"}), 400


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"status": "error", "message": "请提供用户名和密码"}), 400
        
    if username in users:
        return jsonify({"status": "error", "message": "用户名已存在"}), 400
        
    users[username] = {
        "username": username,
        "password": generate_password_hash(password),
        "role": "merchant",
        "created_at": datetime.now().isoformat()
    }
    
    add_notification(f"新商家 {username} 已注册")
    
    return jsonify({"status": "success", "message": "注册成功"})


@app.route('/api/products', methods=['GET'])
@require_auth
def get_products():
    token = request.headers.get('Authorization')
    username = sessions[token]['username']
    
    # 管理员可以查看所有商品，商家只能查看自己的商品
    user = users.get(username)
    if user['role'] == 'admin':
        result = list(products.values())
    else:
        result = [p for p in products.values() if p['merchant'] == username]
        
    return jsonify({"status": "success", "data": result})


@app.route('/api/products', methods=['POST'])
@require_auth
def add_product():
    token = request.headers.get('Authorization')
    username = sessions[token]['username']
    
    # 检查是否有文件
    if 'image' not in request.files:
        return jsonify({"status": "error", "message": "未上传图片"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"status": "error", "message": "未选择图片"}), 400
        
    if not allowed_file(file.filename):
        return jsonify({"status": "error", "message": "不支持的图片格式"}), 400
    
    # 处理表单数据
    name = request.form.get('name')
    price = request.form.get('price')
    description = request.form.get('description')
    
    if not name or not price:
        return jsonify({"status": "error", "message": "商品名称和价格不能为空"}), 400
    
    try:
        price = float(price)
    except ValueError:
        return jsonify({"status": "error", "message": "价格格式无效"}), 400
    
    # 保存图片
    filename = secure_filename(file.filename)
    timestamp = int(time.time())
    new_filename = f"{timestamp}_{filename}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
    file.save(file_path)
    
    # 创建商品
    product_id = str(uuid.uuid4())
    products[product_id] = {
        "id": product_id,
        "name": name,
        "price": price,
        "description": description or "",
        "image": f"/api/uploads/{new_filename}",
        "merchant": username,
        "created_at": datetime.now().isoformat(),
        "status": "active"
    }
    
    add_notification(f"商家 {username} 添加了新商品: {name}")
    
    return jsonify({
        "status": "success", 
        "message": "商品添加成功",
        "data": products[product_id]
    })


@app.route('/api/products/<product_id>', methods=['PUT'])
@require_auth
def update_product(product_id):
    token = request.headers.get('Authorization')
    username = sessions[token]['username']
    
    if product_id not in products:
        return jsonify({"status": "error", "message": "商品不存在"}), 404
        
    product = products[product_id]
    
    # 检查权限
    if product['merchant'] != username and users[username]['role'] != 'admin':
        return jsonify({"status": "error", "message": "无权修改该商品"}), 403
    
    # 检查是否有文件上传
    if 'image' in request.files and request.files['image'].filename != '':
        file = request.files['image']
        if not allowed_file(file.filename):
            return jsonify({"status": "error", "message": "不支持的图片格式"}), 400
            
        # 保存新图片
        filename = secure_filename(file.filename)
        timestamp = int(time.time())
        new_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        file.save(file_path)
        
        # 更新图片路径
        product['image'] = f"/api/uploads/{new_filename}"
    
    # 更新其他字段
    if 'name' in request.form:
        product['name'] = request.form.get('name')
        
    if 'price' in request.form:
        try:
            product['price'] = float(request.form.get('price'))
        except ValueError:
            return jsonify({"status": "error", "message": "价格格式无效"}), 400
            
    if 'description' in request.form:
        product['description'] = request.form.get('description')
        
    if 'status' in request.form:
        product['status'] = request.form.get('status')
    
    product['updated_at'] = datetime.now().isoformat()
    
    add_notification(f"商品 {product['name']} 已被更新")
    
    return jsonify({
        "status": "success", 
        "message": "商品更新成功",
        "data": product
    })


@app.route('/api/products/<product_id>', methods=['DELETE'])
@require_auth
def delete_product(product_id):
    token = request.headers.get('Authorization')
    username = sessions[token]['username']
    
    if product_id not in products:
        return jsonify({"status": "error", "message": "商品不存在"}), 404
        
    product = products[product_id]
    
    # 检查权限
    if product['merchant'] != username and users[username]['role'] != 'admin':
        return jsonify({"status": "error", "message": "无权删除该商品"}), 403
    
    # 执行删除（实际应用中可能是软删除）
    product_name = product['name']
    del products[product_id]
    
    add_notification(f"商品 {product_name} 已被删除")
    
    return jsonify({
        "status": "success", 
        "message": "商品删除成功"
    })


@app.route('/api/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/api/users/current', methods=['GET'])
@require_auth
def get_current_user():
    token = request.headers.get('Authorization')
    username = sessions[token]['username']
    user = users.get(username)
    
    return jsonify({
        "status": "success", 
        "data": {
            "username": user['username'],
            "role": user['role'],
            "created_at": user['created_at']
        }
    })


@app.route('/api/notifications', methods=['GET'])
@require_auth
def get_notifications():
    # 获取分页参数
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('pageSize', 10))
    
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    result = notifications[start_idx:end_idx]
    
    return jsonify({
        "status": "success", 
        "data": result,
        "pagination": {
            "page": page,
            "pageSize": page_size,
            "total": len(notifications)
        }
    })


@app.route('/api/statistics', methods=['GET'])
@require_auth
def get_statistics():
    token = request.headers.get('Authorization')
    username = sessions[token]['username']
    user = users.get(username)
    
    # 根据角色返回不同的统计数据
    if user['role'] == 'admin':
        stats = {
            "total_products": len(products),
            "total_merchants": sum(1 for u in users.values() if u['role'] == 'merchant'),
            "total_orders": len(orders),
            "revenue": sum(o['total'] for o in orders.values() if o['status'] == 'completed')
        }
    else:
        merchant_products = [p for p in products.values() if p['merchant'] == username]
        merchant_orders = [o for o in orders.values() if o['merchant'] == username]
        
        stats = {
            "total_products": len(merchant_products),
            "active_products": sum(1 for p in merchant_products if p['status'] == 'active'),
            "total_orders": len(merchant_orders),
            "revenue": sum(o['total'] for o in merchant_orders if o['status'] == 'completed')
        }
    
    return jsonify({
        "status": "success", 
        "data": stats
    })


def add_notification(message):
    """添加系统通知"""
    notification = {
        "id": len(notifications) + 1,
        "message": message,
        "created_at": datetime.now().isoformat(),
        "read": False
    }
    notifications.insert(0, notification)  # 新通知放在前面


if __name__ == '__main__':
    print("商家管理系统服务已启动...")
    print(f"* 初始管理员账号: admin")
    print(f"* 初始管理员密码: admin123")
    print(f"* 上传文件目录: {UPLOAD_FOLDER}")
    app.run(debug=True, host='0.0.0.0', port=5000) 