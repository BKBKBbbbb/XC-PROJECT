/**
 * 测试 Dashboard 统计接口
 * 用法: node test-dashboard-api.js
 * 需要: 后端运行在 3001 端口，数据库有用户可登录
 */
const http = require('http');

const BASE = 'http://localhost:3001';
const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';
const ADMIN = { username, password };

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers.Authorization = `Bearer ${token}`;

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (ch) => (data += ch));
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, data: json });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('1. 登录获取 Token...');
  const loginRes = await request('POST', '/api/users/login', ADMIN);
  if (loginRes.status !== 200) {
    console.error('登录失败:', loginRes.status, loginRes.data);
    process.exit(1);
  }
  const token = loginRes.data.token;
  console.log('   登录成功');

  console.log('2. 请求 Dashboard 统计...');
  const statsRes = await request('GET', '/api/dashboard/stats', null, token);
  console.log('   状态码:', statsRes.status);
  console.log('   响应:', JSON.stringify(statsRes.data, null, 2));

  if (statsRes.status === 200) {
    const { hotelCount, pendingCount, reviewCount } = statsRes.data;
    console.log('\n3. 结果:');
    console.log('   酒店总数(已通过):', hotelCount);
    console.log('   待审核评论:', pendingCount);
    console.log('   评论总数:', reviewCount);
    process.exit(0);
  } else {
    console.error('   接口失败');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('请求失败:', err.message);
  console.error('请确保: 1) 后端已启动(node server.js) 2) 端口3001可访问');
  process.exit(1);
});
