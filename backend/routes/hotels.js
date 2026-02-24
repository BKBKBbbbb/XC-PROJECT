const express = require('express');
const { hotels, rooms } = require('../utils/store');
const auth = require('../middleware/auth');

const router = express.Router();

// ==================== 公开路由 ====================

// 获取酒店列表（公开）- 支持筛选
router.get('/', async (req, res) => {
  try {
    const { city, star, page = 1, limit = 10, minPrice, maxPrice, keyword } = req.query;
    
    let hotelList = await hotels.find({ status: 'published' });
    
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
      
      hotelList = hotelList.filter(async h => {
        const hotelRooms = await rooms.find({ hotelId: h.id });
        if (hotelRooms.length === 0) return false;
        const minRoomPrice = Math.min(...hotelRooms.map(r => r.price));
        return minRoomPrice >= min && minRoomPrice <= max;
      });
      
      // 添加最低价信息
      hotelList = await Promise.all(hotelList.map(async h => {
        const hotelRooms = await rooms.find({ hotelId: h.id });
        const minPrice = hotelRooms.length > 0 ? Math.min(...hotelRooms.map(r => r.price)) : 0;
        return { ...h, minPrice };
      }));
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
    const hotelList = await hotels.find({ merchantId: req.user.id });
    res.json(hotelList);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 创建酒店（商户）
router.post('/', auth, async (req, res) => {
  try {
    // 确保新建酒店的状态为 pending，忽略前端可能传递的 status
    const { status, ...restBody } = req.body;
    
    // 强制设置 status 为 pending，确保新建酒店都是待审核状态
    const hotelData = {
      ...restBody,
      merchantId: req.user.id,
      status: 'pending'  // 强制设置为 pending，忽略任何传入的 status 值
    };
    
    const hotel = await hotels.insert(hotelData);
    
    // 确保返回的酒店状态是 pending
    if (hotel.status !== 'pending') {
      console.warn(`警告: 新建酒店状态不是 pending，实际为: ${hotel.status}`);
      hotel.status = 'pending';
    }
    
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
    
    let hotelList = await hotels.find();
    
    if (status) {
      // 当查询 pending 状态时，同时包含 draft 状态（兼容旧数据）
      if (status === 'pending') {
        hotelList = hotelList.filter(h => h.status === 'pending' || h.status === 'draft');
      } else {
        hotelList = hotelList.filter(h => h.status === status);
      }
    }
    
    // 关联商户信息
    const { users } = require('../utils/store');
    hotelList = await Promise.all(hotelList.map(async h => {
      const merchant = await users.findById(h.merchantId);
      return {
        ...h,
        merchantName: merchant ? merchant.username : '未知'
      };
    }));
    
    hotelList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
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

// 审核酒店（管理员）- status: approved(通过) / rejected(不通过)
router.put('/:id/review', auth, async (req, res) => {
  try {
    console.log('审核接口被调用 - 请求参数:', {
      id: req.params.id,
      body: req.body,
      user: req.user ? { id: req.user.id, role: req.user.role } : null
    });
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限审核' });
    }
    
    const { status, reviewNote } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: '状态必须为 approved 或 rejected' });
    }
    
    // 只有拒绝时才要求填写原因，审核通过时不需要原因，reviewNote字段可为空
    if (status === 'rejected' && !reviewNote) {
      return res.status(400).json({ message: '拒绝时必须填写原因' });
    }
    
    const hotel = await hotels.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    const updateData = {
      status: status === 'approved' ? 'published' : 'rejected'
    };
    
    // 审核通过时清除reviewNote（设置为null），拒绝时设置reviewNote
    if (status === 'approved') {
      // 只有当reviewNote存在时才清除，避免不必要的null赋值
      if (hotel.reviewNote) {
        updateData.reviewNote = null; // 审核通过时清除拒绝原因
      }
    } else if (status === 'rejected') {
      // 确保 reviewNote 不是 undefined
      if (reviewNote !== undefined && reviewNote !== null) {
        updateData.reviewNote = reviewNote;
      } else {
        updateData.reviewNote = '';
      }
    }
    
    // 最后检查：移除所有 undefined 值，确保不会传递到数据库
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    // 调试日志
    console.log('审核酒店 - ID:', req.params.id);
    console.log('审核状态:', status);
    console.log('更新数据:', JSON.stringify(updateData, null, 2));
    
    const updatedHotel = await hotels.update(req.params.id, updateData);
    
    if (!updatedHotel) {
      return res.status(404).json({ message: '更新失败，酒店不存在' });
    }
    
    console.log('审核成功，更新后的酒店:', updatedHotel.id);
    res.json(updatedHotel);
  } catch (error) {
    console.error('审核酒店错误:', error);
    console.error('错误堆栈:', error.stack);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      errno: error.errno,
      sql: error.sql
    });
    
    // 返回详细的错误信息（开发环境）
    const errorResponse = {
      message: '服务器错误',
      error: error.message
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = {
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        errno: error.errno,
        sql: error.sql,
        stack: error.stack
      };
    }
    
    res.status(500).json(errorResponse);
  }
});

// 发布酒店（上线）
router.put('/:id/publish', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限操作' });
    }
    
    const hotel = await hotels.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    const updatedHotel = await hotels.update(req.params.id, {
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date()
    });
    
    res.json(updatedHotel);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 下线酒店（虚拟删除，可恢复）- 仅管理员
router.put('/:id/offline', auth, async (req, res) => {
  try {
    // 只有管理员可以下线
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限操作，只有管理员可以下线酒店' });
    }
    
    const hotel = await hotels.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    // 只能下线已发布的酒店
    if (hotel.status !== 'published') {
      return res.status(400).json({ message: '只能下线已发布的酒店' });
    }
    
    const updatedHotel = await hotels.update(req.params.id, {
      status: 'offline',
      offlineAt: new Date()
    });
    
    res.json(updatedHotel);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 恢复已下线的酒店 - 仅管理员
router.put('/:id/restore', auth, async (req, res) => {
  try {
    // 只有管理员可以恢复
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限操作，只有管理员可以恢复酒店' });
    }
    
    const hotel = await hotels.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    if (hotel.status !== 'offline') {
      return res.status(400).json({ message: '只能恢复已下线的酒店' });
    }
    
    // 调试日志
    console.log('恢复酒店 - ID:', req.params.id);
    console.log('当前状态:', hotel.status);
    
    const updateData = {
      status: 'published',
      offlineAt: null
    };
    
    console.log('更新数据:', JSON.stringify(updateData, null, 2));
    
    const updatedHotel = await hotels.update(req.params.id, updateData);
    
    if (!updatedHotel) {
      return res.status(404).json({ message: '更新失败，酒店不存在' });
    }
    
    console.log('恢复成功，更新后的酒店:', updatedHotel.id);
    res.json(updatedHotel);
  } catch (error) {
    console.error('恢复酒店错误:', error);
    console.error('错误堆栈:', error.stack);
    
    // 如果是 MySQL 错误，提供更详细的错误信息
    const errorResponse = {
      message: '服务器错误',
      error: error.message
    };
    
    if (error.code && error.sqlState) {
      errorResponse.details = {
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        errno: error.errno,
        sql: error.sql,
        stack: error.stack
      };
    }
    
    res.status(500).json(errorResponse);
  }
});

// ==================== 带参数路由（放在最后） ====================

// 获取酒店详情（公开）
router.get('/:id', async (req, res) => {
  try {
    const hotel = await hotels.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    // 关联房间信息
    const hotelRooms = await rooms.find({ hotelId: hotel.id });
    
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
    const hotel = await hotels.findById(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    // 商户只能修改自己的酒店
    if (hotel.merchantId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限修改' });
    }
    
    const updatedHotel = await hotels.update(req.params.id, {
      ...req.body,
      updatedAt: new Date()
    });
    
    res.json(updatedHotel);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 删除酒店
router.delete('/:id', auth, async (req, res) => {
  try {
    const hotel = await hotels.findById(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    if (hotel.merchantId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限删除' });
    }
    
    await hotels.remove(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
