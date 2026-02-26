const mysql = require('mysql2/promise');

// 与其他迁移脚本保持一致的数据库配置
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
    console.log('开始检查 / 添加 hotels 表字段...');

    // 读取当前 hotels 表已有的字段
    const [columns] = await pool.execute(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'hotels'
    `,
      [dbConfig.database]
    );

    const existingColumns = columns.map((col) => col.COLUMN_NAME);

    // 一个小工具方法，避免重复代码
    async function ensureColumn(name, ddl) {
      if (!existingColumns.includes(name)) {
        console.log(`准备添加字段: ${name} ...`);
        await pool.execute(`ALTER TABLE hotels ADD COLUMN ${ddl}`);
        console.log(`✓ 已添加字段: ${name}`);
      } else {
        console.log(`✓ 字段已存在: ${name}`);
      }
    }

    // 基础信息字段（如果你之前手动建表，有缺的会自动补齐）
    await ensureColumn('name', 'name VARCHAR(255) NOT NULL');
    await ensureColumn('nameEn', 'nameEn VARCHAR(255) NULL');
    await ensureColumn('city', 'city VARCHAR(255) NULL');
    await ensureColumn('address', 'address VARCHAR(500) NULL');
    await ensureColumn('star', 'star INT NULL');
    await ensureColumn('openDate', 'openDate DATE NULL');

    // 联系方式 & 描述（这里有一个旧迁移脚本 migrate-add-hotel-fields.js，如果你已经跑过，它会直接提示已存在）
    await ensureColumn('phone', 'phone VARCHAR(50) NULL');
    await ensureColumn('email', 'email VARCHAR(255) NULL');
    await ensureColumn('contactPerson', 'contactPerson VARCHAR(255) NULL');
    await ensureColumn('description', 'description TEXT NULL');

    // 基础配置（布尔值用 TINYINT(1) 存，0 = false, 1 = true）
    await ensureColumn(
      'freeParking',
      'freeParking TINYINT(1) NOT NULL DEFAULT 0 COMMENT \'是否免费停车场\''
    );
    await ensureColumn(
      'freeWifi',
      'freeWifi TINYINT(1) NOT NULL DEFAULT 0 COMMENT \'是否免费 WiFi\''
    );
    await ensureColumn(
      'breakfastType',
      "breakfastType VARCHAR(50) NULL COMMENT '早餐类型：none/single/double/buffet'"
    );
    await ensureColumn(
      'familyFriendly',
      'familyFriendly TINYINT(1) NOT NULL DEFAULT 0 COMMENT \'是否亲子友好\''
    );
    await ensureColumn(
      'petsAllowed',
      'petsAllowed TINYINT(1) NOT NULL DEFAULT 0 COMMENT \'是否可携带宠物\''
    );

    // 复杂 JSON / 列表字段
    // 为了兼容所有 MySQL 版本，这里统一使用 TEXT 存 JSON 字符串，前后端照常用 JSON.parse / JSON.stringify 即可
    await ensureColumn(
      'roomTypes',
      'roomTypes TEXT NULL COMMENT \'房型与基础价格信息（JSON 数组）\''
    );
    await ensureColumn(
      'nearbyAttractions',
      'nearbyAttractions TEXT NULL COMMENT \'附近景点（JSON 数组）\''
    );
    await ensureColumn(
      'nearbyTransport',
      'nearbyTransport TEXT NULL COMMENT \'附近交通（JSON 数组）\''
    );
    await ensureColumn(
      'nearbyMalls',
      'nearbyMalls TEXT NULL COMMENT \'附近商场（JSON 数组）\''
    );
    await ensureColumn(
      'discounts',
      'discounts TEXT NULL COMMENT \'价格优惠（JSON 数组）\''
    );
    await ensureColumn(
      'customFields',
      'customFields TEXT NULL COMMENT \'自定义维度（JSON 数组）\''
    );

    // 状态相关字段
    await ensureColumn(
      'status',
      "status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT '审核 / 上线状态'"
    );
    await ensureColumn(
      'reviewNote',
      'reviewNote TEXT NULL COMMENT \'审核备注 / 拒绝原因\''
    );
    await ensureColumn(
      'offlineAt',
      'offlineAt DATETIME NULL COMMENT \'下线时间\''
    );
    await ensureColumn(
      'publishedAt',
      'publishedAt DATETIME NULL COMMENT \'上线时间\''
    );

    console.log('✅ hotels 表字段检查 / 补齐完成！');
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateDatabase().catch((err) => {
  console.error('执行失败:', err.message);
  process.exit(1);
});

