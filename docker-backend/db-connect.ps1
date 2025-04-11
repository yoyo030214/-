param(
    [string]$ServerIP = "175.178.80.222",
    [string]$Username = "Administrator",
    [string]$Password = "lol110606YY.",
    [int]$LocalPort = 3307,
    [int]$RemotePort = 3307
)

Write-Host "=== 创建SSH隧道连接到远程数据库 ===" -ForegroundColor Green
Write-Host "本地端口: $LocalPort -> 远程端口: $RemotePort" -ForegroundColor Cyan
Write-Host "请保持此窗口开启，关闭窗口将断开隧道连接" -ForegroundColor Yellow

# 检查SSH是否安装
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未安装SSH客户端" -ForegroundColor Red
    Write-Host "请安装OpenSSH客户端后再试" -ForegroundColor Yellow
    exit 1
}

# 创建SSH隧道
Write-Host "正在连接到服务器..." -ForegroundColor Cyan
Write-Host "按Ctrl+C可中断连接" -ForegroundColor Yellow

# 使用ssh命令创建隧道
& ssh -L "${LocalPort}:localhost:${RemotePort}" "${Username}@${ServerIP}"

# 如果SSH连接断开
Write-Host "SSH连接已断开" -ForegroundColor Red 