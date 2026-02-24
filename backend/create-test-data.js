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
      const nearbyAttractions = JSON.stringify([
        { name: '天安门广场', distance: '2.5公里' },
        { name: '故宫博物院', distance: '3公里' },
        { name: '王府井步行街', distance: '1.8公里' }
      ]);
      const nearbyTransport = JSON.stringify([
        { type: '地铁1号线', station: '建国门站', distance: '500米' },
        { type: '地铁2号线', station: '建国门站', distance: '500米' },
        { type: '公交', station: '建国门南站', distance: '200米' }
      ]);
      const nearbyMalls = JSON.stringify([
        { name: '国贸商城', distance: '1.2公里' },
        { name: '银泰中心', distance: '800米' }
      ]);
      const discounts = JSON.stringify([
        {
          type: 'festival',
          name: '春节特惠',
          method: 'discount',
          value: 0.8,
          description: '春节期间所有房型8折优惠'
        },
        {
          type: 'package',
          name: '机票+酒店套餐',
          method: 'package',
          value: 200,
          description: '预订机票+酒店套餐，立减200元'
        }
      ]);
      
      await connection.execute(
        `INSERT INTO hotels (id, name, nameEn, city, address, star, openDate, status, merchantId, nearbyAttractions, nearbyTransport, nearbyMalls, discounts, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [hotelId, '测试酒店', 'Test Hotel', '北京', '朝阳区建国路88号', 5, '2020-01-15', 'published', merchantId, nearbyAttractions, nearbyTransport, nearbyMalls, discounts]
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
      
      // 添加一个待审核酒店
      const pendingHotelId = require('crypto').randomUUID();
      await connection.execute(
        'INSERT INTO hotels (id, name, nameEn, city, address, star, openDate, status, merchantId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [pendingHotelId, '待审核酒店', 'Pending Hotel', '上海', '浦东新区陆家嘴', 4, '2021-06-01', 'pending', merchantId]
      );
      console.log('✅ 待审核酒店创建成功');
    } else {
      console.log('⚠️ 测试酒店已存在');
    }
    
    // 确保至少有一个待审核酒店
    const [pendingCount] = await connection.execute("SELECT COUNT(*) as c FROM hotels WHERE status = 'pending'");
    if (pendingCount[0].c === 0) {
      const [firstHotel] = await connection.execute('SELECT id, merchantId FROM hotels LIMIT 1');
      if (firstHotel.length) {
        const pid = require('crypto').randomUUID();
        await connection.execute(
          'INSERT INTO hotels (id, name, nameEn, city, address, star, openDate, status, merchantId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [pid, '待审核酒店', 'Pending Hotel', '上海', '浦东新区陆家嘴', 4, '2021-06-01', 'pending', firstHotel[0].merchantId]
        );
        console.log('✅ 待审核酒店创建成功');
      }
    }
    
    // 检查是否有评论，没有则添加
    const [existingComments] = await connection.execute('SELECT COUNT(*) as c FROM comments');
    if (existingComments[0].c === 0) {
      const [hotels] = await connection.execute('SELECT id, name FROM hotels LIMIT 1');
      const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
      if (hotels.length && users.length) {
        const hotelId = hotels[0].id;
        const hotelName = hotels[0].name || '测试酒店';
        const userId = users[0].id;
        const commentsData = [
          [require('crypto').randomUUID(), hotelId, userId, hotelName, '张三', 5, '酒店位置很好，服务也很不错！', 'published'],
          [require('crypto').randomUUID(), hotelId, userId, hotelName, '李四', 4, '房间有点小，但是位置一级棒', 'published'],
          [require('crypto').randomUUID(), hotelId, userId, hotelName, '王五', 3, '一般般，没有想象中好', 'pending']
        ];
        for (const d of commentsData) {
          await connection.execute(
            'INSERT INTO comments (id, hotelId, userId, hotelName, userName, rating, content, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            d
          );
        }
        console.log('✅ 测试评论创建成功 (3条)');
      }
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
