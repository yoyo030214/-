Write-Host "=== 开始部署农业应用后端 ===" -ForegroundColor Green

# 检查是否以管理员权限运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "请使用管理员权限运行此脚本" -ForegroundColor Red
    exit 1
}

# 检查Docker是否安装
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "请先安装Docker Desktop，然后再运行此脚本" -ForegroundColor Yellow
    Write-Host "可以从此处下载Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# 检查Docker Compose是否安装
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "请先安装Docker Compose，然后再运行此脚本" -ForegroundColor Yellow
    exit 1
}

# 创建应用目录
$APP_DIR = "C:\projects\agricultural-app"
if (-not (Test-Path $APP_DIR)) {
    New-Item -ItemType Directory -Path $APP_DIR -Force | Out-Null
}
Set-Location $APP_DIR

# 复制项目文件
Write-Host "正在复制项目文件..." -ForegroundColor Cyan
Copy-Item -Path ".\*" -Destination $APP_DIR -Recurse -Force

# 配置防火墙
Write-Host "正在配置防火墙..." -ForegroundColor Cyan
New-NetFirewallRule -DisplayName "Node API 5000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5000 -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "MariaDB 3307" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3307 -ErrorAction SilentlyContinue

# 启动服务
Write-Host "正在启动服务..." -ForegroundColor Cyan
docker-compose down
docker-compose up -d

# 等待服务启动
Write-Host "等待服务启动..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# 检查服务状态
Write-Host "检查服务状态..." -ForegroundColor Cyan
docker ps

Write-Host "=== 部署完成 ===" -ForegroundColor Green
Write-Host "API服务地址: http://localhost:5000" -ForegroundColor Cyan
Write-Host "数据库连接信息:" -ForegroundColor Cyan
Write-Host "主机: localhost" -ForegroundColor Cyan
Write-Host "端口: 3307" -ForegroundColor Cyan
Write-Host "用户名: root" -ForegroundColor Cyan
Write-Host "密码: lol110606YY" -ForegroundColor Cyan
Write-Host "数据库名: agricultural_app" -ForegroundColor Cyan 