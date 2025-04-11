#!/bin/bash

echo "=== 开始部署农业应用后端 ==="

# 检查是否以管理员权限运行
if [ "$EUID" -ne 0 ]; then 
  echo "请使用管理员权限运行此脚本"
  exit 1
fi

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "正在安装Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "正在安装Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 创建应用目录
APP_DIR="C:/projects/agricultural-app"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# 复制项目文件
echo "正在复制项目文件..."
cp -r /tmp/docker-backend/* .

# 设置权限
chmod +x docker-start.sh
chmod +x start.sh

# 配置防火墙
echo "正在配置防火墙..."
netsh advfirewall firewall add rule name="Node API 5000" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="MariaDB 3307" dir=in action=allow protocol=TCP localport=3307

# 启动服务
echo "正在启动服务..."
./docker-start.sh

# 等待服务启动
echo "等待服务启动..."
sleep 30

# 检查服务状态
echo "检查服务状态..."
docker ps

echo "=== 部署完成 ==="
echo "API服务地址: http://localhost:5000"
echo "数据库连接信息:"
echo "主机: localhost"
echo "端口: 3307"
echo "用户名: root"
echo "密码: lol110606YY."
echo "数据库名: agricultural_app"

ssh -L 3307:localhost:3307 Administrator@10.1.8.7

mysql -h127.0.0.1 -P3307 -uroot -plol110606YY -e "SHOW DATABASES;"

# 检查端口是否开放
Test-NetConnection -ComputerName localhost -Port 3307

# 在连接到服务器后执行
docker ps | findstr agricultural-db

# 检查防火墙规则
netsh advfirewall firewall show rule name="MariaDB 3307"

docker logs agricultural-db