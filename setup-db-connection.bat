@echo off
chcp 65001 >nul
echo ===== MySQL数据库连接配置工具 =====
echo.

cd /d "%~dp0"

REM 获取数据库连接信息
echo 请提供MySQL数据库连接信息
echo 如果不确定，请保留默认值

set /p db_host=数据库主机(默认localhost):
if "%db_host%"=="" set db_host=localhost

set /p db_port=数据库端口(默认3306):
if "%db_port%"=="" set db_port=3306

set /p db_user=数据库用户名(默认root):
if "%db_user%"=="" set db_user=root

set /p db_pass=数据库密码(默认root):
if "%db_pass%"=="" set db_pass=root

set /p db_name=数据库名称(默认agricultural_app):
if "%db_name%"=="" set db_name=agricultural_app

REM 生成或更新.env文件
if not exist "docker-backend" (
    mkdir "docker-backend"
)

echo 正在更新数据库配置...
(
echo # 数据库配置（本地模式）
echo DB_HOST=%db_host%
echo DB_PORT=%db_port%
echo DB_USER=%db_user%
echo DB_PASSWORD=%db_pass%
echo DB_NAME=%db_name%
echo.
echo # 服务器配置
echo PORT=5000
echo NODE_ENV=development
echo.
echo # JWT配置
echo JWT_SECRET=your_jwt_secret
echo JWT_EXPIRES_IN=7d
echo.
echo # 跨域配置
echo CORS_ORIGIN=*
echo.
echo # 数据库连接设置
echo DB_DIALECT=mysql
echo DB_POOL_MAX=5
echo DB_POOL_MIN=0
echo DB_TIMEOUT=30000
) > docker-backend\.env

echo.
echo [成功] 数据库连接配置已更新!
echo.
echo 配置信息:
echo 主机: %db_host%
echo 端口: %db_port%
echo 用户: %db_user%
echo 数据库: %db_name%
echo.
echo 您可以使用这些设置启动后台服务了。
echo.

pause 