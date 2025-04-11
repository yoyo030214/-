@echo off
chcp 65001 >nul
echo ===== 农业应用本地数据库配置工具 =====
echo.

cd /d "%~dp0"

REM 检查 MySQL 是否安装和可用
echo 检查MySQL是否可用...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到MySQL命令行工具。
    echo 请确保MySQL已正确安装，并且mysql命令在系统PATH中。
    echo.
    echo 如果您已安装MySQL但命令不可用：
    echo 1. 请将MySQL的bin目录添加到PATH环境变量
    echo 2. 或者直接提供MySQL可执行文件的完整路径
    echo.
    set /p mysqlpath=请输入MySQL bin目录的完整路径(按回车使用默认值C:\Program Files\MySQL\MySQL Server 8.0\bin):

    if "%mysqlpath%"=="" set mysqlpath=C:\Program Files\MySQL\MySQL Server 8.0\bin
    
    if exist "%mysqlpath%\mysql.exe" (
        set MYSQL_CMD="%mysqlpath%\mysql.exe"
    ) else (
        echo [错误] 在指定路径未找到mysql.exe
        echo 请安装MySQL或提供正确的路径。
        echo 您可以从 https://dev.mysql.com/downloads/ 下载MySQL。
        pause
        exit /b 1
    )
) else (
    set MYSQL_CMD=mysql
)

REM 获取MySQL用户认证信息
echo.
echo 请提供MySQL root用户的密码
set /p mysqlpw=MySQL root密码(默认为root):

if "%mysqlpw%"=="" set mysqlpw=root

REM 创建临时SQL文件
echo.
echo 创建数据库脚本...
echo -- 创建农业应用数据库 > setup_db.sql
echo CREATE DATABASE IF NOT EXISTS agricultural_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; >> setup_db.sql
echo USE agricultural_app; >> setup_db.sql
echo -- 创建用户表结构 >> setup_db.sql
echo CREATE TABLE IF NOT EXISTS Users ( >> setup_db.sql
echo   id INT AUTO_INCREMENT PRIMARY KEY, >> setup_db.sql
echo   username VARCHAR(50) NOT NULL, >> setup_db.sql
echo   password VARCHAR(255) NOT NULL, >> setup_db.sql
echo   email VARCHAR(100), >> setup_db.sql
echo   role ENUM('user', 'admin', 'farmer') DEFAULT 'user', >> setup_db.sql
echo   createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, >> setup_db.sql
echo   updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP >> setup_db.sql
echo ); >> setup_db.sql
echo -- 创建基本管理员账户 >> setup_db.sql
echo INSERT INTO Users (username, password, email, role) >> setup_db.sql
echo VALUES ('admin', '$2a$10$Oj2XGPuQZBNYPvHzaqBw/.HdcYFSVm9/d3wxYSdIrbz8hPVNZKB8u', 'admin@example.com', 'admin'); >> setup_db.sql
echo -- 注意: 密码是"admin123"的散列值 >> setup_db.sql

REM 执行SQL脚本
echo.
echo 正在创建数据库和基本表结构...
%MYSQL_CMD% -u root -p%mysqlpw% < setup_db.sql >nul 2>&1

if %errorlevel% neq 0 (
    echo [错误] 数据库创建失败！请检查MySQL服务是否运行以及密码是否正确。
    echo.
    echo 可能的原因:
    echo 1. MySQL服务未启动
    echo 2. 提供的密码不正确
    echo 3. root用户没有创建数据库的权限
    echo.
    del setup_db.sql
    pause
    exit /b 1
)

REM 创建.env文件
echo.
echo 创建本地环境配置文件...
(
echo # 数据库配置（本地模式）
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_USER=root
echo DB_PASSWORD=%mysqlpw%
echo DB_NAME=agricultural_app
echo.
echo # JWT配置
echo JWT_SECRET=your_jwt_secret
echo JWT_EXPIRES_IN=7d
echo.
echo # 服务器配置
echo PORT=5000
echo NODE_ENV=development
echo.
echo # 数据库连接设置
echo DB_DIALECT=mysql
echo DB_POOL_MAX=5
echo DB_POOL_MIN=0
echo DB_TIMEOUT=30000
) > docker-backend\.env

REM 清理临时文件
del setup_db.sql

echo.
echo [成功] 本地数据库环境配置完成!
echo 数据库: agricultural_app
echo 管理员账户: admin
echo 管理员密码: admin123
echo.
echo 您现在可以启动后端服务了。
echo.

pause 