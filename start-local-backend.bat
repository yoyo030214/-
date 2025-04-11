@echo off
chcp 65001 >nul
echo ===== 农业应用后台服务启动工具（本地版）=====
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

REM 检查项目文件
if not exist "docker-backend\server.js" (
    echo [错误] 没有找到服务器文件！
    echo 请确保您在正确的项目目录中运行此脚本。
    echo.
    pause
    exit /b 1
)

REM 检查MySQL服务是否运行
echo 检查MySQL服务状态...
sc query MySQL80 | findstr "RUNNING" >nul
if %errorlevel% neq 0 (
    echo [尝试其他MySQL服务名称...]
    sc query MySQL | findstr "RUNNING" >nul
    if %errorlevel% neq 0 (
        echo [警告] MySQL服务似乎没有运行。
        echo 尝试启动MySQL服务...
        
        net start MySQL >nul 2>&1
        if %errorlevel% neq 0 (
            net start MySQL80 >nul 2>&1
            if %errorlevel% neq 0 (
                echo [错误] 无法启动MySQL服务！
                echo.
                echo 可能的原因:
                echo 1. MySQL服务名称不是MySQL或MySQL80（请检查您的安装）
                echo 2. MySQL未正确安装
                echo 3. 您没有管理员权限启动服务
                echo.
                echo [建议] 您可以使用以下替代方案:
                echo 1. 运行"run-simple-server.bat"启动不依赖数据库的简易服务器
                echo 2. 运行"demo.bat"直接打开静态演示页面
                echo.
                pause
                exit /b 1
            ) else (
                echo MySQL80服务已启动。
            )
        ) else (
            echo MySQL服务已启动。
        )
    ) else (
        echo MySQL服务正在运行。
    )
) else (
    echo MySQL80服务正在运行。
)

REM 检查数据库配置文件是否存在
if not exist "docker-backend\.env" (
    echo 未找到环境配置文件，将运行数据库配置向导...
    call setup-local-database.bat
) else (
    echo 环境配置文件已存在。
)

REM 确保有正确的依赖
cd docker-backend

REM 使用淘宝镜像安装依赖
echo 配置npm使用淘宝镜像源...
call npm config set registry https://registry.npmmirror.com

echo 检查项目依赖...
if not exist "node_modules" (
    echo 正在安装项目依赖，这可能需要几分钟时间...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 安装依赖失败！
        cd ..
        echo.
        echo [建议] 您可以尝试以下替代方案:
        echo 1. 运行"run-simple-server.bat"启动不依赖数据库的简易服务器
        echo 2. 运行"demo.bat"直接打开静态演示页面
        echo.
        pause
        exit /b 1
    )
) else (
    echo 依赖已安装。
)

REM 启动应用
echo.
echo 正在启动应用...
echo 服务将在 http://localhost:5000 运行
echo 您可以通过 http://localhost:5000/admin 访问管理后台
echo.
echo 请注意：
echo 1. 首次启动时，数据库表将自动创建
echo 2. 默认管理员账户：admin，密码：admin123
echo 3. 按Ctrl+C可以停止服务运行
echo.

REM 启动Node应用，并自动打开浏览器
start "" http://localhost:5000/admin
node server.js
if %errorlevel% neq 0 (
    echo.
    echo [错误] 服务器启动失败！
    cd ..
    echo.
    echo [建议] 您可以尝试以下替代方案:
    echo 1. 运行"run-simple-server.bat"启动不依赖数据库的简易服务器
    echo 2. 运行"demo.bat"直接打开静态演示页面
    echo.
)

cd ..
pause 