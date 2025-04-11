param(
    [string]$ServerIP = "175.178.80.222",
    [string]$Username = "Administrator",
    [string]$Password = "lol110606YY.",
    [string]$RemotePath = "C:\projects\agricultural-app"
)

Write-Host "=== 开始部署农业应用后端到服务器 ===" -ForegroundColor Green

# 确保目录存在
$currentDir = Get-Location
$backendDir = Join-Path $currentDir "docker-backend"
if (-not (Test-Path $backendDir)) {
    $backendDir = $currentDir
}

# 压缩代码
Write-Host "正在压缩代码..." -ForegroundColor Cyan
$zipPath = Join-Path $env:TEMP "agricultural-backend.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}
Compress-Archive -Path "$backendDir\*" -DestinationPath $zipPath -Force

# 创建远程会话
Write-Host "正在连接到服务器..." -ForegroundColor Cyan
$securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($Username, $securePassword)

try {
    # 创建PSSession
    $session = New-PSSession -ComputerName $ServerIP -Credential $credential -ErrorAction Stop

    # 检查远程目录
    Write-Host "正在检查远程目录..." -ForegroundColor Cyan
    Invoke-Command -Session $session -ScriptBlock {
        param($path)
        if (-not (Test-Path $path)) {
            New-Item -ItemType Directory -Path $path -Force | Out-Null
            Write-Host "创建远程目录: $path" -ForegroundColor Yellow
        }
    } -ArgumentList $RemotePath

    # 复制文件
    Write-Host "正在复制文件到服务器..." -ForegroundColor Cyan
    Copy-Item -Path $zipPath -Destination "$RemotePath\agricultural-backend.zip" -ToSession $session -Force

    # 解压文件
    Write-Host "正在解压文件..." -ForegroundColor Cyan
    Invoke-Command -Session $session -ScriptBlock {
        param($path)
        Set-Location $path
        if (Test-Path "agricultural-backend.zip") {
            Expand-Archive -Path "agricultural-backend.zip" -DestinationPath . -Force
            Write-Host "文件解压完成" -ForegroundColor Green
        } else {
            Write-Host "错误: 文件未上传成功" -ForegroundColor Red
        }
    } -ArgumentList $RemotePath

    # 重启服务
    Write-Host "正在重启服务..." -ForegroundColor Cyan
    Invoke-Command -Session $session -ScriptBlock {
        param($path)
        Set-Location $path
        docker-compose down
        docker-compose up -d
        Start-Sleep -Seconds 5
        docker ps
    } -ArgumentList $RemotePath

    # 关闭会话
    Remove-PSSession $session
    Write-Host "=== 部署完成 ===" -ForegroundColor Green
    Write-Host "API服务地址: http://$ServerIP:5000" -ForegroundColor Cyan

} catch {
    Write-Host "连接服务器失败: $_" -ForegroundColor Red
    Write-Host "请确保服务器可访问，且开启了PowerShell远程管理" -ForegroundColor Yellow
    Write-Host "或者使用'scp'命令手动上传文件" -ForegroundColor Yellow
}

# 清理临时文件
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
} 