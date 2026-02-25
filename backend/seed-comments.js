// 批量创建测试评论（约30条）
const pool = require('./utils/db');
const crypto = require('crypto');

const SAMPLE_COMMENTS = [
  { userName: '张三', rating: 5, content: '酒店位置很好，服务也很不错！', status: 'published' },
  { userName: '李四', rating: 4, content: '房间有点小，但是位置一级棒', status: 'published' },
  { userName: '王五', rating: 3, content: '一般般，没有想象中好', status: 'pending' },
  { userName: '赵六', rating: 5, content: '早餐种类丰富，房间干净整洁，下次还会来！', status: 'published' },
  { userName: '钱七', rating: 4, content: '性价比不错，前台服务态度好，推荐。', status: 'published' },
  { userName: '孙八', rating: 5, content: '带孩子入住很满意，有儿童设施，小朋友玩得很开心。', status: 'published' },
  { userName: '周九', rating: 2, content: '隔音效果太差了，隔壁声音听得一清二楚。', status: 'pending' },
  { userName: '吴十', rating: 4, content: '交通便利，离地铁站很近，出差首选。', status: 'published' },
  { userName: '郑一', rating: 5, content: '景观房视野超棒，夜景美极了，值得体验！', status: 'published' },
  { userName: '陈二', rating: 3, content: '卫生还可以，但设施有点老旧，希望装修一下。', status: 'rejected' },
  { userName: '林三', rating: 4, content: '入住办理很快，行李有专人送到房间，服务到位。', status: 'published' },
  { userName: '黄四', rating: 1, content: '设施损坏不报修，空调漏水，体验极差。', status: 'rejected' },
  { userName: '何五', rating: 5, content: '商务出差住了三天，非常满意，下次还住这。', status: 'published' },
  { userName: '许六', rating: 4, content: '停车场很大，自驾出行很方便。', status: 'published' },
  { userName: '朱七', rating: 3, content: '床垫有点硬，睡得不太舒服。', status: 'pending' },
  { userName: '谢八', rating: 5, content: '健身房和泳池都很赞，度假体验满分！', status: 'published' },
  { userName: '罗九', rating: 4, content: '周边美食多，晚上散步很舒服。', status: 'published' },
  { userName: '唐十', rating: 2, content: 'WiFi信号不稳定，办公不方便。', status: 'pending' },
  { userName: '韩一', rating: 5, content: '周年纪念入住，酒店送了蛋糕和鲜花，太惊喜了！', status: 'published' },
  { userName: '冯二', rating: 4, content: '房间空间大，适合家庭出游。', status: 'published' },
  { userName: '邓三', rating: 3, content: '热水供应不稳定，洗澡要等很久。', status: 'pending' },
  { userName: '曹四', rating: 5, content: '管家服务贴心，有问题随时解决，点赞！', status: 'published' },
  { userName: '彭五', rating: 4, content: '价格实惠，品质不错，适合预算有限的朋友。', status: 'published' },
  { userName: '曾六', rating: 5, content: '入住体验超出预期，强烈推荐给朋友。', status: 'published' },
  { userName: '萧七', rating: 1, content: '态度恶劣，投诉无门，再也不来了。', status: 'deleted' },
  { userName: '田八', rating: 4, content: '地理位置优越，逛街购物都很方便。', status: 'published' },
  { userName: '董九', rating: 3, content: '房间装修风格不太喜欢，其他还行。', status: 'pending' },
  { userName: '袁十', rating: 5, content: '安静舒适，睡眠质量很好，出差必备。', status: 'published' },
  { userName: '潘一', rating: 4, content: '自助早餐很丰盛，中西式都有。', status: 'published' },
  { userName: '蒋二', rating: 5, content: '第二次入住了，一如既往地满意，会成为常客。', status: 'published' },
];

async function seedComments() {
  const connection = await pool.getConnection();
  try {
    const [hotels] = await connection.execute('SELECT id, name FROM hotels LIMIT 5');
    const [users] = await connection.execute('SELECT id FROM users LIMIT 5');

    if (!hotels.length || !users.length) {
      console.log('❌ 请先运行 create-test-data.js 创建酒店和用户数据');
      process.exit(1);
    }

    const hotelList = hotels.map(h => ({ id: h.id, name: h.name || '未知酒店' }));
    const userIdList = users.map(u => u.id);

    let inserted = 0;
    for (const c of SAMPLE_COMMENTS) {
      const hotel = hotelList[Math.floor(Math.random() * hotelList.length)];
      const userId = userIdList[Math.floor(Math.random() * userIdList.length)];
      const id = crypto.randomUUID();

      await connection.execute(
        `INSERT INTO comments (id, hotelId, userId, hotelName, userName, rating, content, status, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [id, hotel.id, userId, hotel.name, c.userName, c.rating, c.content, c.status]
      );
      inserted++;
    }

    console.log(`✅ 成功创建 ${inserted} 条评论`);
  } catch (error) {
    console.error('❌ 创建评论失败:', error.message);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seedComments();
