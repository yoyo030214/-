@echo off
chcp 65001 >nul
echo ===== Docker国内镜像源配置工具 =====
echo.

REM 检查Docker是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker未运行，请先启动Docker Desktop！
    echo.
    echo 请启动Docker Desktop后再次运行此脚本。
    pause
    exit /b 1
)

echo 此脚本将帮助您配置Docker使用国内镜像源，以加快镜像下载速度。
echo.
echo 支持的国内镜像源:
echo 1. 阿里云镜像加速器
echo 2. 腾讯云镜像加速器
echo 3. 网易云镜像加速器
echo 4. 百度云镜像加速器
echo 5. 七牛云镜像加速器
echo.

set /p choice=请选择要使用的镜像源(1-5)，或按回车使用阿里云镜像加速器:

if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    set REGISTRY_MIRROR="https://registry.cn-hangzhou.aliyuncs.com"
    echo 已选择阿里云镜像加速器
)
if "%choice%"=="2" (
    set REGISTRY_MIRROR="https://mirror.ccs.tencentyun.com"
    echo 已选择腾讯云镜像加速器
)
if "%choice%"=="3" (
    set REGISTRY_MIRROR="https://hub-mirror.c.163.com"
    echo 已选择网易云镜像加速器
)
if "%choice%"=="4" (
    set REGISTRY_MIRROR="https://mirror.baidubce.com"
    echo 已选择百度云镜像加速器
)
if "%choice%"=="5" (
    set REGISTRY_MIRROR="https://reg-mirror.qiniu.com"
    echo 已选择七牛云镜像加速器
)

echo.
echo 正在创建或更新Docker配置文件...

REM 确保配置目录存在
if not exist "%USERPROFILE%\.docker" (
    mkdir "%USERPROFILE%\.docker"
)

REM 创建或更新daemon.json配置文件
echo {> "%USERPROFILE%\.docker\daemon.json"
echo   "registry-mirrors": [%REGISTRY_MIRROR%],>> "%USERPROFILE%\.docker\daemon.json"
echo   "features": {"buildkit": true},>> "%USERPROFILE%\.docker\daemon.json"
echo   "experimental": true,>> "%USERPROFILE%\.docker\daemon.json"
echo   "builder": {"gc": {"enabled": true}},>> "%USERPROFILE%\.docker\daemon.json"
echo   "max-concurrent-downloads": 10,>> "%USERPROFILE%\.docker\daemon.json"
echo   "max-concurrent-uploads": 5>> "%USERPROFILE%\.docker\daemon.json"
echo }>> "%USERPROFILE%\.docker\daemon.json"

echo.
echo Docker镜像配置已成功更新！
echo 请重启Docker Desktop以使配置生效。
echo.
echo 重启后，您可以运行 "启动服务" 脚本来启动商家管理后台服务。
echo.

pause 