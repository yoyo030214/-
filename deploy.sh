#!/bin/bash

# 设置变量
SERVER_IP="175.178.80.222"  # 您的云服务器IP
DEPLOY_PATH="/var/www/merchant-admin"
BACKUP_PATH="/var/www/merchant-admin-backup"

# 创建备份
echo "创建备份..."
ssh root@$SERVER_IP "mkdir -p $BACKUP_PATH && cp -r $DEPLOY_PATH/* $BACKUP_PATH/ 2>/dev/null || true"

# 创建部署目录
echo "创建部署目录..."
ssh root@$SERVER_IP "mkdir -p $DEPLOY_PATH"

# 复制文件到服务器
echo "复制文件到服务器..."
scp -r merchant-admin-web/* root@$SERVER_IP:$DEPLOY_PATH/

# 设置权限
echo "设置文件权限..."
ssh root@$SERVER_IP "chmod -R 755 $DEPLOY_PATH"

# 配置Nginx
echo "配置Nginx..."
ssh root@$SERVER_IP "cat > /etc/nginx/conf.d/merchant-admin.conf << 'EOL'
server {
    listen 80;
    server_name $SERVER_IP;

    root $DEPLOY_PATH/public;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOL"

# 重启Nginx
echo "重启Nginx..."
ssh root@$SERVER_IP "nginx -t && systemctl restart nginx"

echo "部署完成！"
echo "您可以通过 http://$SERVER_IP 访问商家管理系统" 