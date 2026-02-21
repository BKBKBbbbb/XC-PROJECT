const store = require('./utils/store');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    // 检查是否已存在
    const existing = store.users.findOne({ username: 'admin' });
    if (existing) {
      console.log('管理员已存在');
      return;
    }

    const hashed = await bcrypt.hash('admin123', 10);
    const user = store.users.insert({
      username: 'admin',
      password: hashed,
      role: 'admin',
      nickname: 'Admin'
    });
    console.log('创建成功! 用户名: admin, 密码: admin123');
  } catch (error) {
    console.error('错误:', error.message);
  }
}

createAdmin();
