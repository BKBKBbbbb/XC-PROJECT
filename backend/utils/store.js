const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 简单的 JSON 文件存储
class JsonStore {
  constructor(filename) {
    this.filename = filename;
    this.filepath = path.join(DATA_DIR, `${filename}.json`);
    this.data = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filepath)) {
        const content = fs.readFileSync(this.filepath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error(`加载 ${this.filename} 失败:`, error);
    }
    return [];
  }

  _save() {
    fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  find(query = {}) {
    return this.data.filter(item => {
      return Object.keys(query).every(key => {
        if (query[key] instanceof RegExp) {
          return query[key].test(item[key]);
        }
        return item[key] === query[key];
      });
    });
  }

  findById(id) {
    return this.data.find(item => item._id === id);
  }

  findOne(query) {
    return this.data.find(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  insert(item) {
    const newItem = {
      ...item,
      _id: require('crypto').randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.push(newItem);
    this._save();
    return newItem;
  }

  update(id, updates) {
    const index = this.data.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    this.data[index] = {
      ...this.data[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this._save();
    return this.data[index];
  }

  remove(id) {
    const index = this.data.findIndex(item => item._id === id);
    if (index === -1) return false;
    
    this.data.splice(index, 1);
    this._save();
    return true;
  }

  count(query = {}) {
    return this.find(query).length;
  }
}

module.exports = {
  users: new JsonStore('users'),
  hotels: new JsonStore('hotels'),
  rooms: new JsonStore('rooms'),
  orders: new JsonStore('orders')
};
