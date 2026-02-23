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
      city VARCHAR(255),
      address TEXT,
      star INT DEFAULT 0,
      customFields JSON,
      merchantId VARCHAR(36),
      status VARCHAR(50) DEFAULT 'draft',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_city (city),
      INDEX idx_merchantId (merchantId),
      INDEX idx_status (status)
    )
  `);

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
