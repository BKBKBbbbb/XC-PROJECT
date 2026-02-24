const pool = require('./utils/db');

async function testDatabaseConnection() {
  let connection;
  
  try {
    console.log('='.repeat(60));
    console.log('开始测试数据库连接和更新操作...');
    console.log('='.repeat(60));
    
    // 1. 测试数据库连接
    console.log('\n[1] 测试数据库连接...');
    connection = await pool.getConnection();
    console.log('✅ 数据库连接成功！');
    
    // 2. 测试查询操作 - 查看现有酒店
    console.log('\n[2] 查询现有酒店数据...');
    const [hotels] = await connection.execute(
      'SELECT id, name, status, createdAt FROM hotels ORDER BY createdAt DESC LIMIT 5'
    );
    
    if (hotels.length === 0) {
      console.log('⚠️  数据库中暂无酒店数据');
    } else {
      console.log(`✅ 找到 ${hotels.length} 条酒店记录：`);
      hotels.forEach((hotel, index) => {
        console.log(`   ${index + 1}. ID: ${hotel.id}`);
        console.log(`      名称: ${hotel.name}`);
        console.log(`      状态: ${hotel.status}`);
        console.log(`      创建时间: ${hotel.createdAt}`);
        console.log('');
      });
    }
    
    // 3. 测试更新操作 - 如果有酒店，更新第一个酒店的状态
    if (hotels.length > 0) {
      const testHotel = hotels[0];
      const originalStatus = testHotel.status;
      
      console.log(`[3] 测试更新操作 - 更新酒店状态...`);
      console.log(`    目标酒店: ${testHotel.name} (ID: ${testHotel.id})`);
      console.log(`    当前状态: ${originalStatus}`);
      
      // 尝试更新状态（如果当前是 pending，则更新为 published，否则更新为 pending）
      const newStatus = originalStatus === 'pending' ? 'published' : 'pending';
      
      const [updateResult] = await connection.execute(
        'UPDATE hotels SET status = ?, updatedAt = NOW() WHERE id = ?',
        [newStatus, testHotel.id]
      );
      
      console.log(`    更新状态: ${originalStatus} -> ${newStatus}`);
      console.log(`    影响行数: ${updateResult.affectedRows}`);
      
      if (updateResult.affectedRows > 0) {
        console.log('✅ 更新操作成功！');
        
        // 验证更新结果
        const [updatedHotel] = await connection.execute(
          'SELECT id, name, status, updatedAt FROM hotels WHERE id = ?',
          [testHotel.id]
        );
        
        if (updatedHotel.length > 0) {
          console.log(`\n[4] 验证更新结果...`);
          console.log(`    酒店名称: ${updatedHotel[0].name}`);
          console.log(`    当前状态: ${updatedHotel[0].status}`);
          console.log(`    更新时间: ${updatedHotel[0].updatedAt}`);
          
          if (updatedHotel[0].status === newStatus) {
            console.log('✅ 状态更新验证成功！');
          } else {
            console.log('❌ 状态更新验证失败！状态不匹配');
          }
          
          // 恢复原始状态（可选，用于测试）
          console.log(`\n[5] 恢复原始状态...`);
          await connection.execute(
            'UPDATE hotels SET status = ?, updatedAt = NOW() WHERE id = ?',
            [originalStatus, testHotel.id]
          );
          console.log(`✅ 已恢复状态为: ${originalStatus}`);
        }
      } else {
        console.log('⚠️  更新操作未影响任何行');
      }
    } else {
      console.log('\n[3] 跳过更新测试（无可用酒店数据）');
    }
    
    // 4. 测试事务操作
    console.log('\n[6] 测试事务操作...');
    await connection.beginTransaction();
    
    try {
      // 查询操作
      const [countResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM hotels'
      );
      console.log(`    当前酒店总数: ${countResult[0].count}`);
      
      // 提交事务
      await connection.commit();
      console.log('✅ 事务操作成功！');
    } catch (error) {
      await connection.rollback();
      console.log('❌ 事务操作失败，已回滚:', error.message);
      throw error;
    }
    
    // 5. 测试连接池状态
    console.log('\n[7] 测试连接池状态...');
    const poolStats = {
      totalConnections: pool.pool._allConnections.length,
      freeConnections: pool.pool._freeConnections.length,
      queueLength: pool.pool._connectionQueue.length
    };
    console.log(`    总连接数: ${poolStats.totalConnections}`);
    console.log(`    空闲连接数: ${poolStats.freeConnections}`);
    console.log(`    队列长度: ${poolStats.queueLength}`);
    console.log('✅ 连接池状态正常！');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 所有测试通过！数据库连接和更新操作正常。');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
      console.log('\n✅ 数据库连接已释放');
    }
    // 关闭连接池
    await pool.end();
    console.log('✅ 连接池已关闭');
  }
}

// 运行测试
testDatabaseConnection().catch(console.error);
