@echo off
chcp 65001 >nul
echo ===== MySQL数据库创建工具 =====
echo.

cd /d "%~dp0"

set /p db_user=数据库用户名(默认root):
if "%db_user%"=="" set db_user=root

set /p db_pass=数据库密码(默认root):
if "%db_pass%"=="" set db_pass=root

echo 创建数据库脚本...

rem 创建sql文件
echo -- 创建农业应用数据库 > create_db.sql
echo CREATE DATABASE IF NOT EXISTS agricultural_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; >> create_db.sql
echo USE agricultural_app; >> create_db.sql
echo -- 创建用户表 >> create_db.sql
echo CREATE TABLE IF NOT EXISTS Users ( >> create_db.sql
echo   id INT AUTO_INCREMENT PRIMARY KEY, >> create_db.sql
echo   username VARCHAR(50) NOT NULL, >> create_db.sql
echo   password VARCHAR(255) NOT NULL, >> create_db.sql
echo   email VARCHAR(100), >> create_db.sql
echo   role ENUM('user', 'admin', 'farmer') DEFAULT 'user', >> create_db.sql
echo   createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, >> create_db.sql
echo   updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP >> create_db.sql
echo ); >> create_db.sql
echo -- 创建管理员账户 >> create_db.sql
echo INSERT INTO Users (username, password, email, role) >> create_db.sql
echo VALUES ('admin', '$2a$10$Oj2XGPuQZBNYPvHzaqBw/.HdcYFSVm9/d3wxYSdIrbz8hPVNZKB8u', 'admin@example.com', 'admin'); >> create_db.sql

echo 尝试直接使用命令行创建数据库...

rem 尝试使用mysql命令直接执行
mysql -u%db_user% -p%db_pass% < create_db.sql >nul 2>&1

if %errorlevel% neq 0 (
    echo 直接使用命令行创建数据库失败。
    echo.
    echo 可能原因:
    echo 1. MySQL命令行工具不在PATH中
    echo 2. 用户名或密码不正确
    echo 3. MySQL服务未启动
    echo.
    echo 您可以尝试手动创建数据库:
    echo 1. 打开MySQL客户端工具(如MySQL Workbench)
    echo 2. 使用以下SQL脚本创建数据库:
    echo.
    type create_db.sql
    echo.
) else (
    echo.
    echo [成功] 数据库已创建!
    echo 数据库名: agricultural_app
    echo 管理员账户: admin
    echo 管理员密码: admin123
    echo.
)

rem 删除临时SQL文件
del create_db.sql

pause 