const pool = require('./utils/db');

async function checkCommentsTable() {
  try {
    // 检查表是否存在
    const [tables] = await pool.execute("SHOW TABLES LIKE 'comments'");
    
    if (tables.length === 0) {
      console.log('❌ comments 表不存在！');
      console.log('请运行: node init-db.js 来初始化数据库');
      process.exit(1);
    }
    
    console.log('✅ comments 表存在');
    
    // 检查表中的数据
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM comments');
    console.log(`📊 评论数量: ${rows[0].count}`);
    
    // 检查各状态的评论数量
    const [statusRows] = await pool.execute(`
      SELECT status, COUNT(*) as count 
      FROM comments 
      GROUP BY status
    `);
    
    console.log('\n📈 各状态评论数量:');
    statusRows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });
    
    await pool.end();
    console.log('\n✅ 检查完成');
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

checkCommentsTable();
