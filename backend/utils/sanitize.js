/**
 * 字段白名单过滤工具函数
 * 用于防止 Mass Assignment 攻击和 SQL 错误
 */

/**
 * 过滤数据对象，只保留白名单中的字段
 * @param {Object} data - 需要过滤的数据对象
 * @param {Array<string>} allowedFields - 允许的字段列表
 * @returns {Object} - 过滤后的数据对象
 * 
 * @example
 * const data = { name: '酒店', age: 20, invalidField: 'test' };
 * const allowed = ['name', 'age'];
 * const result = sanitizeFields(data, allowed);
 * // result: { name: '酒店', age: 20 }
 */
function sanitizeFields(data, allowedFields) {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  if (!Array.isArray(allowedFields)) {
    throw new Error('allowedFields must be an array');
  }
  
  const sanitized = {};
  
  for (const key of allowedFields) {
    // 只保留存在且不为 undefined 的字段
    if (data[key] !== undefined) {
      sanitized[key] = data[key];
    }
  }
  
  return sanitized;
}

/**
 * 创建字段过滤中间件
 * @param {Array<string>} allowedFields - 允许的字段列表
 * @returns {Function} Express 中间件函数
 * 
 * @example
 * router.put('/:id', 
 *   auth, 
 *   createSanitizeMiddleware(['name', 'email']),
 *   async (req, res) => {
 *     // req.sanitizedBody 包含过滤后的数据
 *   }
 * );
 */
function createSanitizeMiddleware(allowedFields) {
  return (req, res, next) => {
    try {
      req.sanitizedBody = sanitizeFields(req.body, allowedFields);
      next();
    } catch (error) {
      res.status(400).json({ 
        message: '字段过滤失败', 
        error: error.message 
      });
    }
  };
}

module.exports = {
  sanitizeFields,
  createSanitizeMiddleware
};
