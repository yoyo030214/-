@echo off
chcp 65001 >nul
echo ===== 农业应用启动菜单 =====
echo.

cd /d "%~dp0"

:menu
cls
echo ===== 农业应用启动菜单 =====
echo.
echo 请选择要启动的服务:
echo.
echo 1. 启动完整后台服务 (需要MySQL数据库支持)
echo 2. 启动简易服务器 (无需数据库)
echo 3. 启动本地文件服务器 (无需数据库，功能完整)
echo 4. 打开静态演示页面 (仅前端演示)
echo 5. 检查端口占用情况
echo 6. 配置数据库连接
echo 7. 修复MySQL服务
echo 8. 专门启动MySQL 80服务
echo 9. 创建MySQL数据库
echo 10. 退出
echo.
set /p choice=请输入选项(1-10):

if "%choice%"=="1" goto fullbackend
if "%choice%"=="2" goto simpleserver
if "%choice%"=="3" goto localserver
if "%choice%"=="4" goto demo
if "%choice%"=="5" goto checkports
if "%choice%"=="6" goto dbconfig
if "%choice%"=="7" goto fixmysql
if "%choice%"=="8" goto mysql80
if "%choice%"=="9" goto createdb
if "%choice%"=="10" goto end

echo 输入无效，请重新选择。
timeout /t 2 >nul
goto menu

:fullbackend
echo 正在启动完整后台服务...
call start-local-backend.bat
goto menu

:simpleserver
echo 正在启动简易服务器...
call run-simple-server.bat
goto menu

:localserver
echo 正在启动本地文件服务器...
echo 启动本地文件服务器(端口8080)...
start node local-server.js
start "" http://localhost:8080/admin
echo 服务已启动，按任意键返回主菜单...
pause >nul
goto menu

:demo
echo 正在启动静态演示页面...
call demo.bat
goto menu

:checkports
echo 正在检查端口占用情况...
call check-ports.bat
goto menu

:dbconfig
echo 配置数据库连接...
call setup-db-connection.bat
goto menu

:fixmysql
cls
echo ===== MySQL服务修复工具 =====
echo.
echo 请选择操作:
echo 1. 启动MySQL服务
echo 2. 重启MySQL服务
echo 3. 返回主菜单
echo.
set /p mysql_choice=请输入选项(1-3):

if "%mysql_choice%"=="1" (
    echo 尝试启动MySQL服务...
    net start MySQL 2>nul || net start MySQL80 2>nul
    if %errorlevel% neq 0 (
        echo 无法启动MySQL服务，可能需要管理员权限。
        echo 请右键点击此批处理文件，然后选择以管理员身份运行。
    ) else (
        echo MySQL服务已成功启动！
    )
    pause
    goto fixmysql
)

if "%mysql_choice%"=="2" (
    echo 尝试重启MySQL服务...
    net stop MySQL 2>nul || net stop MySQL80 2>nul
    timeout /t 2 >nul
    net start MySQL 2>nul || net start MySQL80 2>nul
    if %errorlevel% neq 0 (
        echo 无法重启MySQL服务，可能需要管理员权限。
        echo 请右键点击此批处理文件，然后选择以管理员身份运行。
    ) else (
        echo MySQL服务已成功重启！
    )
    pause
    goto fixmysql
)

if "%mysql_choice%"=="3" (
    goto menu
)

echo 输入无效，请重新选择。
timeout /t 2 >nul
goto fixmysql

:mysql80
echo 尝试专门启动MySQL 80服务...
call start-mysql80.bat
goto menu

:createdb
echo 创建MySQL数据库...
call create-mysql-db.bat
goto menu

:end
echo 谢谢使用，再见！
timeout /t 2 >nul
exit /b 0 