const pool = require('./db');

// MySQL 存储类
class MySqlStore {
  constructor(tableName) {
    this.tableName = tableName;
  }

  // 将 JSON 对象展开成 SQL 字段和值
  _parseItem(item) {
    const fields = [];
    const values = [];
    const placeholders = [];
    
    for (const [key, value] of Object.entries(item)) {
      fields.push(key);
      if (value instanceof Object && !(value instanceof Date)) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      placeholders.push('?');
    }
    
    return { fields, values, placeholders };
  }

  // 查询所有符合条件的记录
  find(query = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        if (Object.keys(query).length === 0) {
          const [rows] = await pool.execute(`SELECT * FROM ${this.tableName}`);
          resolve(rows);
          return;
        }

        const conditions = [];
        const values = [];
        
        for (const [key, value] of Object.entries(query)) {
          if (value instanceof RegExp) {
            conditions.push(`${key} LIKE ?`);
            values.push(value.source);
          } else {
            conditions.push(`${key} = ?`);
            values.push(value);
          }
        }

        const sql = `SELECT * FROM ${this.tableName} WHERE ${conditions.join(' AND ')}`;
        const [rows] = await pool.execute(sql, values);
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    });
  }

  // 根据 ID 查询
  findById(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const [rows] = await pool.execute(
          `SELECT * FROM ${this.tableName} WHERE id = ?`,
          [id]
        );
        resolve(rows[0] || null);
      } catch (error) {
        reject(error);
      }
    });
  }

  // 查询单条记录
  findOne(query) {
    return new Promise(async (resolve, reject) => {
      try {
        const conditions = [];
        const values = [];
        
        for (const [key, value] of Object.entries(query)) {
          conditions.push(`${key} = ?`);
          values.push(value);
        }

        const sql = `SELECT * FROM ${this.tableName} WHERE ${conditions.join(' AND ')} LIMIT 1`;
        const [rows] = await pool.execute(sql, values);
        resolve(rows[0] || null);
      } catch (error) {
        reject(error);
      }
    });
  }

  // 插入记录
  insert(item) {
    return new Promise(async (resolve, reject) => {
      try {
        const newItem = {
          ...item,
          id: require('crypto').randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const { fields, values, placeholders } = this._parseItem(newItem);
        
        const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
        await pool.execute(sql, values);
        
        resolve(newItem);
      } catch (error) {
        reject(error);
      }
    });
  }

  // 更新记录
  update(id, updates) {
    return new Promise(async (resolve, reject) => {
      try {
        const setClause = [];
        const values = [];
        
        for (const [key, value] of Object.entries(updates)) {
          setClause.push(`${key} = ?`);
          if (value instanceof Object && !(value instanceof Date)) {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
        
        setClause.push('updatedAt = ?');
        values.push(new Date());
        values.push(id);

        const sql = `UPDATE ${this.tableName} SET ${setClause.join(', ')} WHERE id = ?`;
        const [result] = await pool.execute(sql, values);
        
        if (result.affectedRows === 0) {
          resolve(null);
          return;
        }

        // 返回更新后的记录
        const [rows] = await pool.execute(
          `SELECT * FROM ${this.tableName} WHERE id = ?`,
          [id]
        );
        resolve(rows[0] || null);
      } catch (error) {
        reject(error);
      }
    });
  }

  // 删除记录
  remove(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const [result] = await pool.execute(
          `DELETE FROM ${this.tableName} WHERE id = ?`,
          [id]
        );
        resolve(result.affectedRows > 0);
      } catch (error) {
        reject(error);
      }
    });
  }

  // 统计数量
  count(query = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        if (Object.keys(query).length === 0) {
          const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM ${this.tableName}`);
          resolve(rows[0].count);
          return;
        }

        const conditions = [];
        const values = [];
        
        for (const [key, value] of Object.entries(query)) {
          conditions.push(`${key} = ?`);
          values.push(value);
        }

        const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${conditions.join(' AND ')}`;
        const [rows] = await pool.execute(sql, values);
        resolve(rows[0].count);
      } catch (error) {
        reject(error);
      }
    });
  }
}

// 导出 store 实例
module.exports = {
  users: new MySqlStore('users'),
  hotels: new MySqlStore('hotels'),
  rooms: new MySqlStore('rooms'),
  orders: new MySqlStore('orders')
};
