@echo off
chcp 65001 >nul
echo ===== 端口占用检查工具 =====
echo.

cd /d "%~dp0"

echo 正在检查端口占用情况...

echo.
echo 检查端口 5000 (后台服务默认端口):
netstat -ano | findstr :5000
if %errorlevel% equ 0 (
    echo [警告] 端口5000已被占用！
) else (
    echo [正常] 端口5000未被占用，可以使用。
)

echo.
echo 检查端口 8080 (简易服务器默认端口):
netstat -ano | findstr :8080
if %errorlevel% equ 0 (
    echo [警告] 端口8080已被占用！
) else (
    echo [正常] 端口8080未被占用，可以使用。
)

echo.
echo 如果端口被占用，您可以:
echo 1. 结束占用端口的进程(需谨慎，确保不是系统重要进程)
echo 2. 修改服务器配置文件中的端口号
echo.
echo 修改方法:
echo - 对于本地后台服务: 编辑 docker-backend/.env 文件中的 PORT 值
echo - 对于简易服务器: 编辑 simple-server.js 文件中的 PORT 变量
echo.

pause 