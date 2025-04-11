@echo off
chcp 65001 >nul
echo ===== 农业应用商家管理后台服务启动工具（自定义配置版）=====
echo.

cd /d "%~dp0docker-backend"

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

REM 检查项目文件
if not exist "server.js" (
    echo [错误] 没有找到server.js文件！
    echo 请确保您在正确的项目目录中运行此脚本。
    echo.
    pause
    exit /b 1
)

REM 检查包管理器
if not exist "package.json" (
    echo [错误] 没有找到package.json文件！
    echo 请确保您在正确的项目目录中运行此脚本。
    echo.
    pause
    exit /b 1
)

REM 安装依赖
echo 正在安装项目依赖...
echo 这可能需要几分钟时间...

REM 设置npm使用淘宝镜像
echo 配置npm使用淘宝镜像源...
call npm config set registry https://registry.npmmirror.com

REM 安装依赖
call npm install

if %errorlevel% neq 0 (
    echo [错误] 安装依赖失败！
    echo 请检查网络连接或手动运行 npm install 命令。
    echo.
    pause
    exit /b 1
)

REM 创建临时环境变量文件
echo 创建环境变量配置...
(
echo # 数据库配置（自定义配置）
echo DB_HOST=175.178.80.222
echo DB_PORT=3307
echo DB_USER=Administrator
echo DB_PASSWORD=lol110606YY
echo DB_NAME=agricultural_app
echo # JWT配置
echo JWT_SECRET=your_jwt_secret
echo JWT_EXPIRES_IN=7d
echo # 服务器配置
echo PORT=5000
echo NODE_ENV=production
) > .env.local

echo.
echo 已使用您的自定义数据库配置:
echo 数据库主机: 175.178.80.222
echo 数据库端口: 3307
echo 数据库用户: Administrator
echo 数据库密码: lol110606YY
echo.
echo 注意: 请确保您的远程数据库允许从您的IP地址连接
echo.

REM 启动应用
echo.
echo 正在启动应用...
echo 服务将在 http://localhost:5000 运行
echo 您可以通过 http://localhost:5000/admin 访问管理后台
echo.
echo 按Ctrl+C可以停止服务运行
echo.

REM 通过改名方式使用自定义配置启动
copy .env.local .env /y >nul

REM 启动Node应用
start "" http://localhost:5000/admin
node server.js

pause 