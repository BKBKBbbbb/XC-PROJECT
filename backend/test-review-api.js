/**
 * 测试酒店审核 API
 * 用法: node test-review-api.js [admin_username] [admin_password] [hotel_id]
 * 示例: node test-review-api.js admin 123456 fee60391-d364-4555-8aef-fa966f06411c
 */

const http = require('http');

const BASE = 'http://localhost:3001';
const username = process.argv[2] || 'admin';
const password = process.argv[3] || '123456';
const hotelId = process.argv[4];

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) options.headers.Authorization = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: { raw: data } });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== 测试酒店审核 API ===\n');
  console.log('1. 登录获取 Token...');
  const loginRes = await request('POST', '/api/users/login', { username, password });
  if (loginRes.status !== 200) {
    console.error('登录失败:', loginRes.status, loginRes.data);
    return;
  }
  const token = loginRes.data.token;
  const user = loginRes.data.user;
  console.log('   OK, 用户:', user?.username, '角色:', user?.role);

  if (user?.role !== 'admin') {
    console.error('错误: 该用户不是管理员，无法审核');
    return;
  }

  // 获取一个待审核酒店
  let targetId = hotelId;
  if (!targetId) {
    console.log('\n2. 获取待审核酒店列表...');
    const listRes = await request('GET', '/api/hotels/admin/all?status=pending&limit=5', null, token);
    if (listRes.status !== 200 || !listRes.data?.list?.length) {
      console.log('   没有待审核酒店，尝试获取任意酒店...');
      const allRes = await request('GET', '/api/hotels/admin/all?limit=10', null, token);
      const list = allRes.data?.list || [];
      const pending = list.find((h) => h.status === 'pending' || h.status === 'draft');
      if (pending) targetId = pending.id;
      else if (list[0]) targetId = list[0].id;
    } else {
      targetId = listRes.data.list[0].id;
    }
  }

  if (!targetId) {
    console.error('未找到可测试的酒店 ID，请手动指定: node test-review-api.js admin 123456 <hotel_id>');
    return;
  }

  console.log('\n3. 调用审核通过 API...');
  console.log('   PUT /hotels/' + targetId + '/review');
  console.log('   Body: { status: "approved" }');
  const reviewRes = await request('PUT', `/api/hotels/${targetId}/review`, { status: 'approved' }, token);

  if (reviewRes.status === 200) {
    console.log('   OK! 审核通过成功');
    console.log('   返回数据:', JSON.stringify(reviewRes.data, null, 2));
  } else {
    console.error('   失败:', reviewRes.status, reviewRes.data);
  }
}

main().catch((e) => console.error(e));
