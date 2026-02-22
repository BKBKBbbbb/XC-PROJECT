// 创建商户账号的脚本
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, 'data', 'users.json');

// 读取现有用户
let users = [];
if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
}

// 商户账号信息
const merchant = {
  username: 'merchant',
  password: bcrypt.hashSync('merchant123', 10),  // 密码: merchant123
  role: 'merchant',
  nickname: '测试商户',
  _id: require('crypto').randomUUID(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// 检查是否已存在
if (users.find(u => u.username === 'merchant')) {
  console.log('商户账号已存在');
} else {
  users.push(merchant);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  console.log('商户账号创建成功！');
  console.log('用户名: merchant');
  console.log('密码: merchant123');
  console.log('角色: merchant');
}
