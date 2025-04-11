@echo off
chcp 65001 >nul
echo ===== 农业应用商家管理后台服务调试工具 =====
echo.

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

echo 服务调试选项:
echo 1. 查看API服务日志
echo 2. 查看数据库服务日志
echo 3. 查看所有容器状态
echo 4. 重启所有服务
echo 5. 直接连接到数据库
echo 6. 清理Docker缓存（解决构建问题）
echo 7. 尝试备用方案启动服务
echo 8. 退出
echo.

choice /c 12345678 /n /m "请选择操作 [1-8]: "

if errorlevel 8 goto exit
if errorlevel 7 goto alternate_start
if errorlevel 6 goto clean_docker
if errorlevel 5 goto connect_db
if errorlevel 4 goto restart_services
if errorlevel 3 goto show_containers
if errorlevel 2 goto db_logs
if errorlevel 1 goto api_logs

:api_logs
echo.
echo ===== API服务日志 =====
echo 按Ctrl+C退出日志查看
echo.
docker logs -f agricultural-api
goto end

:db_logs
echo.
echo ===== 数据库服务日志 =====
echo 按Ctrl+C退出日志查看
echo.
docker logs -f agricultural-db
goto end

:show_containers
echo.
echo ===== 所有容器状态 =====
echo.
docker ps -a
goto menu

:restart_services
echo.
echo ===== 重启所有服务 =====
echo.
echo 正在停止服务...
docker-compose down
echo 正在启动服务...
docker-compose up -d
echo 服务已重启！
goto menu

:connect_db
echo.
echo ===== 连接到数据库 =====
echo.
echo 使用以下信息连接MySQL:
echo 主机: localhost
echo 端口: 3307
echo 用户名: root
echo 密码: lol110606YY
echo 数据库: agricultural_app
echo.
echo 按任意键返回菜单...
pause >nul
goto menu

:clean_docker
echo.
echo ===== 清理Docker缓存 =====
echo.
echo 正在停止所有容器...
docker-compose down
echo 正在删除未使用的镜像、网络和卷...
docker system prune -a --volumes -f
echo Docker缓存已清理！
echo.
echo 您现在可以重新运行启动脚本来构建服务。
echo 按任意键返回菜单...
pause >nul
goto menu

:alternate_start
echo.
echo ===== 尝试备用方案启动服务 =====
echo.
echo 正在检查项目目录...

REM 检查server.js是否存在
if not exist "server.js" (
    echo [错误] 找不到server.js文件，无法启动服务！
    echo 请确保您在正确的项目目录中。
    echo.
    echo 按任意键返回菜单...
    pause >nul
    goto menu
)

echo 正在创建一个新的Dockerfile...
(
echo FROM node:14-alpine
echo WORKDIR /app
echo COPY package*.json ./
echo RUN npm config set registry https://registry.npm.taobao.org
echo RUN npm install
echo COPY . .
echo EXPOSE 5000
echo CMD ["node", "server.js"]
) > Dockerfile.alternate

echo 正在创建新的docker-compose配置...
(
echo services:
echo   api:
echo     build:
echo       context: .
echo       dockerfile: Dockerfile.alternate
echo     container_name: agricultural-api
echo     restart: always
echo     ports:
echo       - "5000:5000"
echo     depends_on:
echo       - db
echo     environment:
echo       - DB_HOST=db
echo       - DB_PORT=3306
echo       - DB_USER=root
echo       - DB_PASSWORD=lol110606YY
echo       - DB_NAME=agricultural_app
echo       - JWT_SECRET=your_jwt_secret
echo       - JWT_EXPIRES_IN=7d
echo       - NODE_ENV=production
echo.
echo   db:
echo     image: mysql:5.7
echo     container_name: agricultural-db
echo     restart: always
echo     ports:
echo       - "3307:3306"
echo     environment:
echo       - MYSQL_ROOT_PASSWORD=lol110606YY
echo       - MYSQL_DATABASE=agricultural_app
echo     volumes:
echo       - db-data:/var/lib/mysql
echo.
echo volumes:
echo   db-data:
) > docker-compose.alternate.yml

echo 正在尝试启动备用方案...
docker-compose -f docker-compose.alternate.yml up -d

echo 正在检查服务状态...
timeout /t 10 /nobreak > nul
docker ps | findstr "agricultural-api"

if %errorlevel% neq 0 (
    echo [警告] 备用方案启动可能不成功，请查看日志了解详情。
    echo 您可以选择选项1查看API服务日志。
) else (
    echo [成功] 备用方案启动成功！
    echo 您现在可以访问 http://localhost:5000/admin
    start http://localhost:5000/admin
)

echo.
echo 按任意键返回菜单...
pause >nul
goto menu

:menu
echo.
echo ===== 农业应用商家管理后台服务调试工具 =====
echo.
echo 服务调试选项:
echo 1. 查看API服务日志
echo 2. 查看数据库服务日志
echo 3. 查看所有容器状态
echo 4. 重启所有服务
echo 5. 直接连接到数据库
echo 6. 清理Docker缓存（解决构建问题）
echo 7. 尝试备用方案启动服务
echo 8. 退出
echo.

choice /c 12345678 /n /m "请选择操作 [1-8]: "

if errorlevel 8 goto exit
if errorlevel 7 goto alternate_start
if errorlevel 6 goto clean_docker
if errorlevel 5 goto connect_db
if errorlevel 4 goto restart_services
if errorlevel 3 goto show_containers
if errorlevel 2 goto db_logs
if errorlevel 1 goto api_logs

:exit
echo.
echo 退出调试工具...
exit /b 0

:end
echo.
echo 按任意键返回菜单...
pause >nul
goto menu 