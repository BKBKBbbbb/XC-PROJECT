/**
 * 数据库结构初始化脚本
 * 自动检测并补充缺失的列，保证表结构与代码一致
 * 启动后端时由 server.js 调用
 */
const pool = require('../utils/db');

const TABLES = {
  comments: `
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hotelId INT NOT NULL,
      userId INT NOT NULL,
      content TEXT,
      rating INT DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending',
      reviewNote TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `,
};

const TABLES_COLUMNS = {
  hotels: [
    { name: 'nameEn',      type: 'VARCHAR(200)' },
    { name: 'openDate',    type: 'DATE' },
    { name: 'phone',       type: 'VARCHAR(50)' },
    { name: 'email',       type: 'VARCHAR(200)' },
    { name: 'contactPerson', type: 'VARCHAR(100)' },
    { name: 'freeParking', type: 'TINYINT(1)' },
    { name: 'freeWifi',    type: 'TINYINT(1)' },
    { name: 'breakfastType', type: 'VARCHAR(50)' },
    { name: 'description', type: 'TEXT' },
    { name: 'familyFriendly', type: 'TINYINT(1)' },
    { name: 'petsAllowed', type: 'TINYINT(1)' },
    { name: 'roomTypes',   type: 'JSON' },
    { name: 'nearbyAttractions', type: 'JSON' },
    { name: 'nearbyTransport', type: 'JSON' },
    { name: 'nearbyMalls', type: 'JSON' },
    { name: 'discounts',   type: 'JSON' },
    { name: 'customFields', type: 'JSON' },
    { name: 'merchantId',  type: 'INT' },
    { name: 'status',       type: 'VARCHAR(20)' },
    { name: 'publishedAt', type: 'DATETIME' },
    { name: 'offlineAt',   type: 'DATETIME' },
  ],
  users: [
    { name: 'nickname', type: 'VARCHAR(100)' },
    { name: 'avatar',   type: 'VARCHAR(500)' },
    { name: 'status',   type: 'VARCHAR(20)' },
  ],
};

async function columnExists(table, column) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as cnt FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function addColumn(table, col) {
  const sql = `ALTER TABLE \`${table}\` ADD COLUMN \`${col.name}\` ${col.type} DEFAULT NULL`;
  try {
    await pool.execute(sql);
    console.log(`  [init-db] ✅ 新增列 ${table}.${col.name}`);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log(`  [init-db] ⏭  列 ${table}.${col.name} 已存在，跳过`);
    } else {
      console.error(`  [init-db] ❌ 新增列 ${table}.${col.name} 失败: ${err.message}`);
    }
  }
}

async function tableExists(table) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as cnt FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [table]
  );
  return rows[0].cnt > 0;
}

async function init() {
  console.log('[init-db] 开始检查并补充数据库缺失列...');

  // 1. 先创建缺失的表
  for (const [table, createSQL] of Object.entries(TABLES)) {
    const exists = await tableExists(table);
    if (!exists) {
      try {
        await pool.execute(createSQL);
        console.log(`[init-db] ✅ 创建表 ${table}`);
      } catch (err) {
        console.error(`[init-db] ❌ 创建表 ${table} 失败: ${err.message}`);
      }
    } else {
      console.log(`[init-db] ⏭  表 ${table} 已存在，跳过`);
    }
  }

  // 2. 再为已有表补充缺失的列
  for (const [table, columns] of Object.entries(TABLES_COLUMNS)) {
    const exists = await tableExists(table);
    if (!exists) {
      console.log(`[init-db] ⏭  表 ${table} 不存在，跳过列检查`);
      continue;
    }
    console.log(`[init-db] 检查表: ${table}`);
    for (const col of columns) {
      const colExists = await columnExists(table, col.name);
      if (!colExists) {
        await addColumn(table, col);
      } else {
        console.log(`  [init-db] ⏭  列 ${table}.${col.name} 已存在，跳过`);
      }
    }
  }
  console.log('[init-db] 数据库结构检查完成。');
}

module.exports = init;
