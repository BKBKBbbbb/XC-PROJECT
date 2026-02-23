// 创建测试数据脚本 - MySQL版本
const bcrypt = require('bcryptjs');
const pool = require('./utils/db');

async function createTestData() {
  const connection = await pool.getConnection();
  
  try {
    // 1. 创建测试商户
    const hashedPassword = await bcrypt.hash('merchant123', 10);
    
    // 检查用户是否已存在
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE username = ?', 
      ['merchant']
    );
    
    let merchantId;
    if (existingUsers.length === 0) {
      merchantId = require('crypto').randomUUID();
      await connection.execute(
        'INSERT INTO users (id, username, password, role, nickname, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [merchantId, 'merchant', hashedPassword, 'merchant', '测试商户']
      );
      console.log('✅ 商户账号创建成功');
      console.log('   用户名: merchant');
      console.log('   密码: merchant123');
    } else {
      merchantId = existingUsers[0].id;
      console.log('⚠️ 商户账号已存在');
    }
    
    // 2. 创建测试酒店
    const [existingHotels] = await connection.execute(
      'SELECT * FROM hotels WHERE name = ?', 
      ['测试酒店']
    );
    
    if (existingHotels.length === 0) {
      const hotelId = require('crypto').randomUUID();
      await connection.execute(
        'INSERT INTO hotels (id, name, city, address, star, status, merchantId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [hotelId, '测试酒店', '北京', '朝阳区建国路88号', 5, 'published', merchantId]
      );
      console.log('✅ 测试酒店创建成功');
      
      // 3. 创建测试房间
      const roomId1 = require('crypto').randomUUID();
      await connection.execute(
        'INSERT INTO rooms (id, hotelId, type, price, total, available, facilities, images, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [roomId1, hotelId, '豪华大床房', 598, 10, 8, '["WiFi", "空调", "电视"]', '[]']
      );
      
      const roomId2 = require('crypto').randomUUID();
      await connection.execute(
        'INSERT INTO rooms (id, hotelId, type, price, total, available, facilities, images, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [roomId2, hotelId, '标准双床房', 398, 15, 12, '["WiFi", "空调"]', '[]']
      );
      
      console.log('✅ 测试房间创建成功 (2间)');
    } else {
      console.log('⚠️ 测试酒店已存在');
    }
    
    console.log('\n🎉 测试数据创建完成！');
    console.log('\n请使用以下账号登录:');
    console.log('  用户名: merchant');
    console.log('  密码: merchant123');
    
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error.message);
  } finally {
    connection.release();
  }
}

createTestData();
