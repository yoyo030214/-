Write-Host "=== 启动本地开发环境 ===" -ForegroundColor Green

# 检查Docker是否安装
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未安装Docker" -ForegroundColor Red
    Write-Host "请安装Docker Desktop后再试" -ForegroundColor Yellow
    exit 1
}

# 检查Docker是否运行
$dockerStatus = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Docker未运行" -ForegroundColor Red
    Write-Host "请启动Docker Desktop后再试" -ForegroundColor Yellow
    exit 1
}

# 设置工作目录
$currentDir = Get-Location
Write-Host "当前目录: $currentDir" -ForegroundColor Cyan

# 停止已有容器
Write-Host "停止已有容器..." -ForegroundColor Cyan
docker-compose down

# 启动开发环境
Write-Host "启动开发环境..." -ForegroundColor Cyan
docker-compose up -d

# 等待服务启动
Write-Host "等待服务启动..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# 检查服务状态
Write-Host "检查服务状态..." -ForegroundColor Cyan
docker ps

# 测试API
Write-Host "测试API连接..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000" -TimeoutSec 5
    Write-Host "API服务运行正常!" -ForegroundColor Green
} catch {
    Write-Host "警告: API服务可能未正常运行" -ForegroundColor Yellow
}

Write-Host "=== 本地开发环境已启动 ===" -ForegroundColor Green
Write-Host "API地址: http://localhost:5000" -ForegroundColor Cyan
Write-Host "数据库: localhost:3307" -ForegroundColor Cyan
Write-Host "数据库用户名: root" -ForegroundColor Cyan
Write-Host "数据库密码: lol110606YY" -ForegroundColor Cyan
Write-Host "数据库名: agricultural_app" -ForegroundColor Cyan 