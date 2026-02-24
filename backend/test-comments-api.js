const http = require('http');

// 首先需要获取 admin token
// 这里假设你已经有一个 admin 用户
// 你可以先登录获取 token，然后替换下面的 TOKEN

const TOKEN = process.argv[2] || '';

if (!TOKEN) {
  console.log('❌ 请提供 token');
  console.log('用法: node test-comments-api.js <token>');
  console.log('或者先登录获取 token');
  process.exit(1);
}

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/comments?status=pending',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`状态码: ${res.statusCode}`);
    console.log('响应头:', res.headers);
    console.log('响应数据:', data);
    
    try {
      const json = JSON.parse(data);
      console.log('\n解析后的数据:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('响应不是有效的 JSON');
    }
  });
});

req.on('error', (e) => {
  console.error(`请求失败: ${e.message}`);
});

req.end();
