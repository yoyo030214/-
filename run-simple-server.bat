@echo off
chcp 65001 >nul
echo ===== 农业应用后台简易服务器 =====
echo.

cd /d "%~dp0"

REM 检查Node.js是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未发现Node.js安装！
    echo 请先安装Node.js后再运行此脚本。
    echo 您可以从 https://nodejs.org 下载安装Node.js。
    echo.
    pause
    exit /b 1
)

REM 确认Node.js版本
echo 检查Node.js版本...
node -v

REM 创建临时目录
if not exist "docker-backend\public\admin" (
    mkdir "docker-backend\public\admin" 2>nul
)

REM 安装Express（如果需要）
echo 检查Express安装...
npm list express --depth=0 >nul 2>&1
if %errorlevel% neq 0 (
    echo 正在安装Express...
    npm install express --no-save --quiet
)

REM 运行简易服务器
echo.
echo 正在启动简易服务器...
echo 这个服务器不依赖任何数据库或复杂配置，只提供基本界面
echo.
echo 服务器将在 http://localhost:3000 运行
echo 您可以通过 http://localhost:3000/admin 访问管理后台
echo.
echo 按Ctrl+C可以停止服务运行
echo.

REM 启动浏览器
start "" http://localhost:3000/admin

REM 运行服务器
node simple-server.js

pause 