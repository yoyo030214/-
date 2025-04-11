const http = require('http');

const server = http.createServer((req, res) => {
  console.log('收到请求:', req.url);
  res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
  res.end('简单服务器测试\n');
});

// 使用不常用端口9999，并明确绑定到0.0.0.0（所有网络接口）
server.listen(9999, '0.0.0.0', () => {
  console.log('服务器运行在 http://localhost:9999');
  console.log('请尝试访问 http://127.0.0.1:9999');
});

// 处理错误
server.on('error', (err) => {
  console.error('服务器错误:', err.message);
}); 