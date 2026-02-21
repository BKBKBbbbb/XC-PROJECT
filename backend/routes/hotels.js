const express = require('express');
const { hotels, rooms } = require('../utils/store');
const auth = require('../middleware/auth');

const router = express.Router();

// ==================== 公开路由 ====================

// 获取酒店列表（公开）- 支持筛选
router.get('/', async (req, res) => {
  try {
    const { city, star, page = 1, limit = 10, minPrice, maxPrice, keyword } = req.query;
    
    let hotelList = hotels.find({ status: 'published' });
    
    // 城市筛选
    if (city) {
      hotelList = hotelList.filter(h => h.city && h.city.includes(city));
    }
    
    // 星级筛选
    if (star) {
      hotelList = hotelList.filter(h => h.star === parseInt(star));
    }
    
    // 关键字搜索
    if (keyword) {
      hotelList = hotelList.filter(h => 
        (h.name && h.name.includes(keyword)) || 
        (h.city && h.city.includes(keyword)) ||
        (h.address && h.address.includes(keyword))
      );
    }
    
    // 价格筛选（需要关联房间）
    if (minPrice || maxPrice) {
      const min = parseFloat(minPrice) || 0;
      const max = parseFloat(maxPrice) || Infinity;
      
      hotelList = hotelList.filter(h => {
        const hotelRooms = rooms.find({ hotelId: h._id });
        if (hotelRooms.length === 0) return false;
        const minRoomPrice = Math.min(...hotelRooms.map(r => r.price));
        return minRoomPrice >= min && minRoomPrice <= max;
      });
      
      // 添加最低价信息
      hotelList = hotelList.map(h => {
        const hotelRooms = rooms.find({ hotelId: h._id });
        const minPrice = hotelRooms.length > 0 ? Math.min(...hotelRooms.map(r => r.price)) : 0;
        return { ...h, minPrice };
      });
    }
    
    // 分页
    const total = hotelList.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedList = hotelList.slice(start, start + parseInt(limit));
    
    res.json({
      list: paginatedList,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// ==================== 商户路由 ====================

// 获取我的酒店列表（商户）
router.get('/merchant/my', auth, async (req, res) => {
  try {
    const hotelList = hotels.find({ merchantId: req.user.id });
    res.json(hotelList);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 创建酒店（商户）
router.post('/', auth, async (req, res) => {
  try {
    const hotel = hotels.insert({
      ...req.body,
      merchantId: req.user.id,
      status: 'draft'
    });
    
    res.status(201).json(hotel);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// ==================== 管理员路由 ====================

// 管理员获取所有酒店（包含待审核）
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限' });
    }
    
    const { status, page = 1, limit = 10 } = req.query;
    
    let hotelList = hotels.find();
    
    if (status) {
      hotelList = hotelList.filter(h => h.status === status);
    }
    
    // 关联商户信息
    const { users } = require('../utils/store');
    hotelList = hotelList.map(h => {
      const merchant = users.findById(h.merchantId);
      return {
        ...h,
        merchantName: merchant ? merchant.username : '未知'
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 分页
    const total = hotelList.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedList = hotelList.slice(start, start + parseInt(limit));
    
    res.json({
      list: paginatedList,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 审核酒店（管理员）
router.put('/:id/review', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限审核' });
    }
    
    const { status, reviewNote } = req.body;
    
    const hotel = hotels.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    const updatedHotel = hotels.update(req.params.id, {
      status,
      reviewNote,
      updatedAt: new Date().toISOString()
    });
    
    res.json(updatedHotel);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 发布酒店（上线）
router.put('/:id/publish', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限操作' });
    }
    
    const hotel = hotels.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    const updatedHotel = hotels.update(req.params.id, {
      status: 'published',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    res.json(updatedHotel);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 下线酒店
router.put('/:id/offline', auth, async (req, res) => {
  try {
    // 商户和管理员都可以下线
    const hotel = hotels.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    if (hotel.merchantId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限操作' });
    }
    
    const updatedHotel = hotels.update(req.params.id, {
      status: 'offline',
      offlineAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    res.json(updatedHotel);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// ==================== 带参数路由（放在最后） ====================

// 获取酒店详情（公开）
router.get('/:id', async (req, res) => {
  try {
    const hotel = hotels.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    // 关联房间信息
    const hotelRooms = rooms.find({ hotelId: hotel._id });
    
    res.json({
      ...hotel,
      rooms: hotelRooms,
      minPrice: hotelRooms.length > 0 ? Math.min(...hotelRooms.map(r => r.price)) : 0
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 更新酒店（商户只能修改自己的）
router.put('/:id', auth, async (req, res) => {
  try {
    const hotel = hotels.findById(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    // 商户只能修改自己的酒店
    if (hotel.merchantId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限修改' });
    }
    
    const updatedHotel = hotels.update(req.params.id, {
      ...req.body,
      updatedAt: new Date().toISOString()
    });
    
    res.json(updatedHotel);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 删除酒店
router.delete('/:id', auth, async (req, res) => {
  try {
    const hotel = hotels.findById(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    if (hotel.merchantId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限删除' });
    }
    
    hotels.remove(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
