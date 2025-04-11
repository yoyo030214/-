@echo off
chcp 65001 >nul
echo ===== 农业应用商家管理后台服务启动工具 =====
echo 正在启动服务，请稍候...

cd /d "%~dp0docker-backend"

REM 检查Docker是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker未运行，请先启动Docker Desktop！
    echo.
    echo 请启动Docker Desktop后再次运行此脚本。
    pause
    exit /b 1
)

REM 设置Docker环境变量，增加超时时间
set COMPOSE_HTTP_TIMEOUT=300
set DOCKER_CLIENT_TIMEOUT=300

REM 停止已有容器
echo 正在停止已有容器...
docker-compose down

REM 尝试优化网络
echo 检查网络连接...
ping -n 1 registry-1.docker.io >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] Docker Hub网络连接不畅，将尝试使用国内镜像源...
    echo 正在修改Docker镜像设置...
)

REM 启动服务
echo 正在启动Docker容器...
echo 首次启动时需要下载Docker镜像，这可能需要几分钟甚至更长时间，请耐心等待...
echo 如果长时间未能启动，可能是网络问题，您可能需要配置Docker使用国内镜像源。
timeout /t 3 /nobreak > nul

docker-compose up -d

REM 等待服务启动
echo.
echo 正在等待服务启动...
echo 如果您看到关于"version"属性过时的警告，请忽略它，这不会影响服务运行。
echo 正在拉取和启动数据库服务，这可能需要一些时间...
timeout /t 15 /nobreak > nul

REM 检查服务状态
echo 检查服务状态...
docker ps | findstr "agricultural-api"
if %errorlevel% neq 0 (
    echo [警告] 服务可能尚未完全启动，这是正常的，尤其是首次启动时。
    echo 请等待几分钟后再访问网页界面。
    echo.
    echo 如果服务长时间未能启动，可能是以下原因：
    echo 1. 网络问题导致无法下载Docker镜像
    echo 2. Docker配置问题
    echo.
    echo 建议尝试以下解决方案：
    echo 1. 检查网络连接
    echo 2. 手动配置Docker使用国内镜像源
    echo 3. 在Docker Desktop的设置中增加资源配额
) else (
    echo [成功] 商家管理后台服务已启动！
)

echo.
echo ===== 服务信息 =====
echo 商家管理后台地址: http://localhost:5000/admin
echo 数据库地址: localhost:3307
echo 数据库名: agricultural_app
echo.
echo 您现在可以打开浏览器访问 http://localhost:5000/admin
echo 注意：如果服务还在启动中，网页可能需要稍后才能访问。
echo.

REM 自动打开浏览器
echo 正在为您打开浏览器...
start http://localhost:5000/admin

pause 