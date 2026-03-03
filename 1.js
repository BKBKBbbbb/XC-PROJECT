/**
 * 字段白名单过滤使用示例
 * 展示如何在路由中使用字段过滤功能
 */

const { sanitizeFields } = require('./backend/utils/sanitize');
const { getHotelAllowedFields } = require('./backend/config/fieldConfig');

// ==================== 示例 1: 基础使用 ====================
router.put('/hotels/:id', auth, async (req, res) => {
  try {
    // 1. 获取字段白名单（根据用户角色）
    const allowedFields = getHotelAllowedFields(req.user.role, 'update');
    
    // 2. 过滤请求体
    const sanitizedUpdates = sanitizeFields(req.body, allowedFields);
    
    // 3. 执行更新
    const updatedHotel = await hotels.update(req.params.id, {
      ...sanitizedUpdates,
      updatedAt: new Date()
    });
    
    res.json(updatedHotel);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// ==================== 示例 2: 使用中间件 ====================
const { createSanitizeMiddleware } = require('./backend/utils/sanitize');

router.put('/hotels/:id', 
  auth,
  // 动态创建中间件，根据用户角色过滤字段
  (req, res, next) => {
    const allowedFields = getHotelAllowedFields(req.user.role, 'update');
    return createSanitizeMiddleware(allowedFields)(req, res, next);
  },
  async (req, res) => {
    // req.sanitizedBody 已经包含过滤后的数据
    const updatedHotel = await hotels.update(req.params.id, {
      ...req.sanitizedBody,
      updatedAt: new Date()
    });
    res.json(updatedHotel);
  }
);

// ==================== 示例 3: 创建酒店（强制状态为 pending）====================
router.post('/hotels', auth, async (req, res) => {
  try {
    // 获取创建时的字段白名单（不包含状态字段）
    const allowedFields = getHotelAllowedFields(req.user.role, 'create');
    
    // 过滤请求体
    const sanitizedBody = sanitizeFields(req.body, allowedFields);
    
    // 强制设置状态为 pending
    const hotelData = {
      ...sanitizedBody,
      merchantId: req.user.id,
      status: 'pending'  // 强制设置，忽略前端传递的 status
    };
    
    const hotel = await hotels.insert(hotelData);
    res.status(201).json(hotel);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// ==================== 示例 4: 手动定义白名单（简单场景）====================
router.put('/hotels/:id', auth, async (req, res) => {
  try {
    // 直接定义允许的字段
    const allowedFields = [
      'name',
      'nameEn',
      'city',
      'address',
      'phone',
      'email'
    ];
    
    // 过滤并更新
    const sanitizedUpdates = sanitizeFields(req.body, allowedFields);
    const updatedHotel = await hotels.update(req.params.id, sanitizedUpdates);
    
    res.json(updatedHotel);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// ==================== 示例 5: 带字段验证的过滤 ====================
router.put('/hotels/:id', auth, async (req, res) => {
  try {
    const allowedFields = getHotelAllowedFields(req.user.role, 'update');
    const sanitizedUpdates = sanitizeFields(req.body, allowedFields);
    
    // 额外的字段验证
    if (sanitizedUpdates.star && (sanitizedUpdates.star < 1 || sanitizedUpdates.star > 5)) {
      return res.status(400).json({ message: '星级必须在 1-5 之间' });
    }
    
    if (sanitizedUpdates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedUpdates.email)) {
      return res.status(400).json({ message: '邮箱格式不正确' });
    }
    
    const updatedHotel = await hotels.update(req.params.id, sanitizedUpdates);
    res.json(updatedHotel);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// ==================== 测试示例 ====================
// 测试字段过滤功能
function testSanitizeFields() {
  const { sanitizeFields } = require('./backend/utils/sanitize');
  
  const testData = {
    name: '测试酒店',
    email: 'test@example.com',
    invalidField: '不应该被保留',
    anotherInvalid: '也不应该被保留',
    star: 5
  };
  
  const allowedFields = ['name', 'email', 'star'];
  
  const result = sanitizeFields(testData, allowedFields);
  
  console.log('原始数据:', testData);
  console.log('过滤后:', result);
  // 输出: { name: '测试酒店', email: 'test@example.com', star: 5 }
  // invalidField 和 anotherInvalid 被过滤掉了
}
