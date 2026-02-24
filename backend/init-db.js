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

async function initDatabase() {
  // 先连接不带数据库，创建数据库
  const configWithoutDb = { ...dbConfig, database: undefined };
  const connection = await mysql.createConnection(configWithoutDb);
  
  await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.end();

  // 再连接带数据库，创建表
  const pool = mysql.createPool(dbConfig);
  
  // 创建 users 表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      nickname VARCHAR(255),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_role (role)
    )
  `);

  // 创建 hotels 表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS hotels (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      nameEn VARCHAR(255),
      city VARCHAR(255),
      address TEXT,
      star INT DEFAULT 0,
      openDate DATE,
      phone VARCHAR(50),
      email VARCHAR(255),
      contactPerson VARCHAR(255),
      description TEXT,
      nearbyAttractions JSON,
      nearbyTransport JSON,
      nearbyMalls JSON,
      discounts JSON,
      customFields JSON,
      merchantId VARCHAR(36),
      status VARCHAR(50) DEFAULT 'pending',
      reviewNote TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_city (city),
      INDEX idx_merchantId (merchantId),
      INDEX idx_status (status)
    )
  `);
  
  // 为已存在的表添加新字段（如果字段不存在）
  try {
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'hotels'
    `, [dbConfig.database]);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    if (!existingColumns.includes('phone')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN phone VARCHAR(50)`);
    }
    if (!existingColumns.includes('email')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN email VARCHAR(255)`);
    }
    if (!existingColumns.includes('contactPerson')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN contactPerson VARCHAR(255)`);
    }
    if (!existingColumns.includes('description')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN description TEXT`);
    }
    if (!existingColumns.includes('reviewNote')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN reviewNote TEXT`);
    }
    if (!existingColumns.includes('nameEn')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN nameEn VARCHAR(255)`);
    }
    if (!existingColumns.includes('openDate')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN openDate DATE`);
    }
    if (!existingColumns.includes('nearbyAttractions')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN nearbyAttractions JSON`);
    }
    if (!existingColumns.includes('nearbyTransport')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN nearbyTransport JSON`);
    }
    if (!existingColumns.includes('nearbyMalls')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN nearbyMalls JSON`);
    }
    if (!existingColumns.includes('discounts')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN discounts JSON`);
    }
    if (!existingColumns.includes('offlineAt')) {
      await pool.execute(`ALTER TABLE hotels ADD COLUMN offlineAt DATETIME NULL`);
    }
    
    // 确保 status 字段的默认值为 'pending'（如果表已存在，更新默认值）
    await pool.execute(`ALTER TABLE hotels MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'`);
    
    // 将现有的 'draft' 状态更新为 'pending'
    await pool.execute(`UPDATE hotels SET status = 'pending' WHERE status = 'draft'`);
  } catch (error) {
    // 如果字段已存在，忽略错误
    console.log('字段检查/添加时出错（可能已存在）:', error.message);
  }

  // 创建 rooms 表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS rooms (
      id VARCHAR(36) PRIMARY KEY,
      hotelId VARCHAR(36) NOT NULL,
      type VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      total INT DEFAULT 1,
      available INT DEFAULT 1,
      facilities JSON,
      images JSON,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_hotelId (hotelId)
    )
  `);

  // 创建 comments 表（评论审核）
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id VARCHAR(36) PRIMARY KEY,
      hotelId VARCHAR(36) NOT NULL,
      userId VARCHAR(36) NOT NULL,
      hotelName VARCHAR(255) NOT NULL,
      userName VARCHAR(255) NOT NULL,
      rating INT DEFAULT 5,
      content TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      reviewNote TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_hotelId (hotelId),
      INDEX idx_userId (userId),
      INDEX idx_status (status)
    )
  `);

  // 创建 orders 表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL,
      hotelId VARCHAR(36) NOT NULL,
      roomId VARCHAR(36) NOT NULL,
      checkInDate DATE NOT NULL,
      checkOutDate DATE NOT NULL,
      guestName VARCHAR(255) NOT NULL,
      guestPhone VARCHAR(50) NOT NULL,
      totalPrice DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_userId (userId),
      INDEX idx_hotelId (hotelId),
      INDEX idx_status (status)
    )
  `);

  await pool.end();
  console.log('数据库初始化完成！');
}

initDatabase().catch(console.error);
