/**
 * 商家管理后台独立启动脚本
 */
const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

console.log('====================================');
console.log('   农业应用商家管理后台启动工具');
console.log('====================================');

// 启动服务器进程
const serverProcess = spawn('node', [path.join(__dirname, 'src/server.js')], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    // 商家管理后台参数
    MERCHANT_SERVER: 'true',
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
});

// 处理子进程事件
serverProcess.on('error', (error) => {
  console.error('启动服务器失败:', error);
});

// 捕获CTRL+C和其他终止信号
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n收到终止信号，正在关闭服务器...');
  serverProcess.kill('SIGTERM');
});

// 当子进程退出时，同时退出主进程
serverProcess.on('exit', (code, signal) => {
  console.log(`服务器进程已退出，退出码: ${code}`);
  process.exit(code);
});

// 提示信息
console.log('\n服务器正在启动中，请稍候...');
console.log('按 Ctrl+C 可以终止服务器\n'); 