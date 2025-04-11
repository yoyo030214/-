#!/bin/bash

echo "===== 农业应用商家管理后台服务启动工具 ====="
echo "正在启动服务，请稍候..."

# 切换到脚本所在目录
cd "$(dirname "$0")/docker-backend"

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "[错误] Docker未运行，请先启动Docker服务！"
    echo ""
    echo "请启动Docker服务后再次运行此脚本。"
    read -p "按回车键继续..."
    exit 1
fi

# 停止已有容器
echo "正在停止已有容器..."
docker-compose down

# 启动服务
echo "正在启动Docker容器..."
docker-compose up -d

# 等待服务启动
echo "正在等待服务启动..."
sleep 10

# 检查服务状态
echo "检查服务状态..."
if ! docker ps | grep -q "agricultural-api"; then
    echo "[警告] 服务可能未正常启动，请检查Docker容器状态！"
else
    echo "[成功] 商家管理后台服务已启动！"
fi

echo ""
echo "===== 服务信息 ====="
echo "商家管理后台地址: http://localhost:5000/admin"
echo "数据库地址: localhost:3307"
echo "数据库名: agricultural_app"
echo ""
echo "您现在可以打开浏览器访问 http://localhost:5000/admin"

# 自动打开浏览器 (适用于Mac/Linux下不同的桌面环境)
echo "正在为您打开浏览器..."
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5000/admin
elif command -v open > /dev/null; then
    open http://localhost:5000/admin
else
    echo "无法自动打开浏览器，请手动访问 http://localhost:5000/admin"
fi

echo ""
read -p "按回车键继续..." 