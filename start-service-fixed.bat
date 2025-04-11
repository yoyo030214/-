@echo off
chcp 65001 >nul
echo ===== 农业应用商家管理后台服务启动工具（修复版）=====
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
    echo [提示] Docker Hub网络连接不畅，尝试替代方案...
)

REM 创建一个更简单的Dockerfile
echo 创建简化版Dockerfile...
echo FROM node:lts-alpine > Dockerfile.simple
echo WORKDIR /app >> Dockerfile.simple
echo COPY . . >> Dockerfile.simple
echo RUN npm install >> Dockerfile.simple
echo EXPOSE 5000 >> Dockerfile.simple
echo CMD ["node", "server.js"] >> Dockerfile.simple

REM 修改docker-compose.yml文件使用简化版Dockerfile
echo 更新Docker Compose配置...
(
echo # 农业应用后台服务配置（简化版）
echo.
echo services:
echo   api:
echo     build:
echo       context: .
echo       dockerfile: Dockerfile.simple
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
echo     networks:
echo       - agricultural-network
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
echo       - MYSQL_CHARACTER_SET_SERVER=utf8mb4
echo       - MYSQL_COLLATION_SERVER=utf8mb4_unicode_ci
echo     volumes:
echo       - db-data:/var/lib/mysql
echo     command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
echo     networks:
echo       - agricultural-network
echo.
echo networks:
echo   agricultural-network:
echo     driver: bridge
echo.
echo volumes:
echo   db-data:
) > docker-compose.simple.yml

REM 启动服务
echo 正在启动Docker容器...
echo 使用简化的配置启动服务...
docker-compose -f docker-compose.simple.yml up -d

echo.
echo 正在等待服务启动...
echo 这可能需要一些时间，尤其是首次启动...
timeout /t 20 /nobreak > nul

REM 检查服务状态
echo 检查服务状态...
docker ps | findstr "agricultural-api"
if %errorlevel% neq 0 (
    echo [警告] 服务可能尚未完全启动，这是正常的，尤其是首次启动时。
    echo 请等待几分钟后再访问网页界面。
    echo.
    echo 如果服务长时间未能启动，可能是以下原因：
    echo 1. 网络问题导致无法下载镜像
    echo 2. Docker配置问题
    echo 3. Node.js项目依赖问题
    echo.
    echo 建议尝试以下解决方案：
    echo 1. 查看Docker日志：docker logs agricultural-api
    echo 2. 配置国内npm镜像源
    echo 3. 尝试手动构建镜像
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