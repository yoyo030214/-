@echo off
chcp 65001 >nul
echo ===== MySQL 80 服务启动工具 =====
echo.

cd /d "%~dp0"

echo 正在检查MySQL 80服务状态...
sc query MySQL80 | findstr "RUNNING" >nul

if %errorlevel% neq 0 (
    echo MySQL 80服务未运行，尝试启动...
    
    rem 尝试以当前权限启动
    net start MySQL80 >nul 2>&1
    
    if %errorlevel% neq 0 (
        echo 启动失败，可能是权限不足。
        echo 将尝试以管理员权限启动服务...
        
        rem 创建临时VBS脚本以提升权限
        echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\elevate.vbs"
        echo UAC.ShellExecute "net", "start MySQL80", "", "runas", 1 >> "%temp%\elevate.vbs"
        
        rem 运行VBS脚本
        "%temp%\elevate.vbs"
        
        rem 删除临时脚本
        del "%temp%\elevate.vbs"
        
        rem 等待服务启动
        timeout /t 3 >nul
        
        rem 再次检查服务是否启动
        sc query MySQL80 | findstr "RUNNING" >nul
        if %errorlevel% neq 0 (
            echo.
            echo [失败] 无法启动MySQL 80服务！
            echo 请确保MySQL已正确安装并且服务名为"MySQL80"。
            echo 您可能需要手动启动MySQL服务:
            echo 1. 打开服务管理器(services.msc)
            echo 2. 找到MySQL80服务
            echo 3. 右键点击并选择"启动"
            echo.
        ) else (
            echo.
            echo [成功] MySQL 80服务已启动！
        )
    ) else (
        echo.
        echo [成功] MySQL 80服务已启动！
    )
) else (
    echo.
    echo [正常] MySQL 80服务已在运行中。
)

rem 等待用户按任意键继续
echo.
echo 按任意键返回主菜单...
pause >nul 