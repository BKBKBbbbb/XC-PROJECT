const mysql = require('mysql2/promise');

// 与其他迁移脚本保持一致的数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'hotel_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// 一些统一的默认值（只在字段为 NULL 或空字符串时才会填充）
const DEFAULTS = {
  name: '未命名酒店',
  nameEn: 'Unnamed Hotel',
  city: '北京', // 需是表单里存在的城市选项
  address: '待完善地址',
  star: 3,
  openDate: '2020-01-01',
  phone: '13800000000', // 合法手机号，方便通过前端校验
  freeParking: 0,
  freeWifi: 1,
  breakfastType: 'none',
};

// 生成默认房型数组
function buildDefaultRoomTypes() {
  return [
    {
      name: '标准间',
      basePrice: 100,
      bedType: '大床',
      maxOccupancy: 2,
      remainingRooms: 10,
      description: '',
    },
  ];
}

// 规范化房型 JSON，保证必填字段都有值
function normalizeRoomTypes(raw) {
  if (!raw) {
    return buildDefaultRoomTypes();
  }

  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    return buildDefaultRoomTypes();
  }

  const list = Array.isArray(parsed) ? parsed : [parsed];
  if (list.length === 0) {
    return buildDefaultRoomTypes();
  }

  return list.map((room, index) => {
    const r = room || {};

    const name =
      r.name && String(r.name).trim()
        ? String(r.name).trim()
        : `房型${index + 1}`;

    let basePrice = Number(r.basePrice);
    if (Number.isNaN(basePrice) || basePrice < 0) {
      basePrice = 100;
    }

    const bedType =
      r.bedType && String(r.bedType).trim()
        ? String(r.bedType).trim()
        : '大床';

    let maxOccupancy = Number(r.maxOccupancy);
    if (Number.isNaN(maxOccupancy) || maxOccupancy <= 0) {
      maxOccupancy = 2;
    }

    let remainingRooms = Number(r.remainingRooms);
    if (Number.isNaN(remainingRooms) || remainingRooms < 0) {
      remainingRooms = 10;
    }

    const description = r.description ? String(r.description) : '';

    return {
      name,
      basePrice,
      bedType,
      maxOccupancy,
      remainingRooms,
      description,
    };
  });
}

async function migrate() {
  const pool = await mysql.createPool(dbConfig);

  try {
    console.log('开始为已通过审核（published）的酒店补全必填信息...');

    // 只处理已发布的酒店；如需包含 offline，可自行改为 IN ('published','offline')
    const [rows] = await pool.execute(
      `
      SELECT
        id,
        name,
        nameEn,
        city,
        address,
        star,
        openDate,
        phone,
        freeParking,
        freeWifi,
        breakfastType,
        roomTypes
      FROM hotels
      WHERE status = 'published'
    `
    );

    if (!rows || rows.length === 0) {
      console.log('没有 status = published 的酒店，无需处理。');
      return;
    }

    console.log(`共找到 ${rows.length} 个已发布酒店，开始逐条处理...`);

    let updatedCount = 0;

    for (const row of rows) {
      const updates = {};

      // 仅在字段为 NULL 或空字符串时才填默认值，避免覆盖已有数据
      if (row.name == null || String(row.name).trim() === '') {
        updates.name = DEFAULTS.name;
      }
      if (row.nameEn == null || String(row.nameEn).trim() === '') {
        updates.nameEn = DEFAULTS.nameEn;
      }
      if (row.city == null || String(row.city).trim() === '') {
        updates.city = DEFAULTS.city;
      }
      if (row.address == null || String(row.address).trim() === '') {
        updates.address = DEFAULTS.address;
      }
      if (row.star == null) {
        updates.star = DEFAULTS.star;
      }
      if (row.openDate == null) {
        updates.openDate = DEFAULTS.openDate;
      }
      if (row.phone == null || String(row.phone).trim() === '') {
        updates.phone = DEFAULTS.phone;
      }

      // TINYINT(1) 字段，若为 NULL 则填默认
      if (row.freeParking == null) {
        updates.freeParking = DEFAULTS.freeParking;
      }
      if (row.freeWifi == null) {
        updates.freeWifi = DEFAULTS.freeWifi;
      }
      if (row.breakfastType == null || String(row.breakfastType).trim() === '') {
        updates.breakfastType = DEFAULTS.breakfastType;
      }

      // roomTypes JSON 必填校验与补全
      const normalizedRoomTypes = normalizeRoomTypes(row.roomTypes);
      const roomTypesJson = JSON.stringify(normalizedRoomTypes);
      if (roomTypesJson !== row.roomTypes) {
        updates.roomTypes = roomTypesJson;
      }

      // 如果没有需要更新的字段，则跳过
      if (Object.keys(updates).length === 0) {
        continue;
      }

      const setClause = [];
      const values = [];
      for (const [key, value] of Object.entries(updates)) {
        setClause.push('`' + key + '` = ?');
        values.push(value);
      }
      // 顺便更新 updatedAt
      setClause.push('`updatedAt` = NOW()');

      values.push(row.id);

      const sql = `UPDATE hotels SET ${setClause.join(', ')} WHERE id = ?`;

      await pool.execute(sql, values);
      updatedCount += 1;

      console.log(
        `已更新酒店: ${row.id} ` +
          `(name: ${row.name || '(null)'} -> ${updates.name || row.name || DEFAULTS.name})`
      );
    }

    console.log(`处理完成，共更新 ${updatedCount} 条酒店记录。`);
  } catch (error) {
    console.error('迁移出错:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate()
    .then(() => {
      console.log('✅ 补全必填信息脚本执行完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ 脚本执行失败:', err.message);
      process.exit(1);
    });
}

module.exports = { migrate };

