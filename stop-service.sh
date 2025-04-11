#!/bin/bash

echo "===== 农业应用商家管理后台服务停止工具 ====="
echo "正在停止服务，请稍候..."

# 切换到脚本所在目录
cd "$(dirname "$0")/docker-backend"

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "[错误] Docker未运行，请先启动Docker服务！"
    echo ""
    read -p "按回车键继续..."
    exit 1
fi

# 停止容器
echo "正在停止容器..."
docker-compose down

echo ""
echo "[成功] 商家管理后台服务已停止！"
echo ""

read -p "按回车键继续..." 