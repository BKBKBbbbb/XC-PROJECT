const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'hotel_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function migrateDatabase() {
  const pool = mysql.createPool(dbConfig);
  
  try {
    console.log('开始迁移数据库，添加酒店联系方式字段...');
    
    // 检查字段是否存在，如果不存在则添加
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'hotels'
    `, [dbConfig.database]);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    if (!existingColumns.includes('phone')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN phone VARCHAR(50)`);
      console.log('✓ 已添加 phone 字段');
    } else {
      console.log('✓ phone 字段已存在');
    }
    
    if (!existingColumns.includes('email')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN email VARCHAR(255)`);
      console.log('✓ 已添加 email 字段');
    } else {
      console.log('✓ email 字段已存在');
    }
    
    if (!existingColumns.includes('contactPerson')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN contactPerson VARCHAR(255)`);
      console.log('✓ 已添加 contactPerson 字段');
    } else {
      console.log('✓ contactPerson 字段已存在');
    }
    
    if (!existingColumns.includes('description')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN description TEXT`);
      console.log('✓ 已添加 description 字段');
    } else {
      console.log('✓ description 字段已存在');
    }
    
    console.log('数据库迁移完成！');
  } catch (error) {
    console.error('迁移失败:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateDatabase().catch(console.error);
