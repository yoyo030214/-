@echo off
chcp 65001 >nul
echo ===== 农业应用商家管理后台服务停止工具 =====
echo 正在停止服务，请稍候...

cd /d "%~dp0docker-backend"

REM 检查Docker是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker未运行，请先启动Docker Desktop！
    echo.
    pause
    exit /b 1
)

REM 停止容器
echo 正在停止容器...
docker-compose down

echo.
echo [成功] 商家管理后台服务已停止！
echo.

pause 