@echo off
chcp 65001 >nul
echo ===== 农业应用后台演示版 =====
echo.
echo 正在启动静态HTML演示页面...
echo 此演示版本完全不依赖任何服务器或数据库
echo 直接在浏览器中展示界面原型
echo.

cd /d "%~dp0"

start "" "docker-backend\public\admin\demo.html"

echo 演示页面已在浏览器中打开
echo.
pause 