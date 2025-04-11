const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`收到请求: ${req.url}`);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('测试服务器正常运行\n');
});

const port = 3000;

// 绑定到所有网络接口
server.listen(port, '0.0.0.0', (err) => {
  if (err) {
    console.error('启动服务器失败:', err);
    return;
  }
  console.log(`测试服务器运行在 http://localhost:${port}`);
  console.log(`也可以通过 http://127.0.0.1:${port} 访问`);
  console.log(`服务器绑定到所有网络接口`);
});

// 添加错误处理
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${port} 已被占用，请尝试其他端口`);
  } else {
    console.error('服务器错误:', err);
  }
}); 