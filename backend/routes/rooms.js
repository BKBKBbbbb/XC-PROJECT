const express = require('express');
const { rooms, hotels } = require('../utils/store');
const auth = require('../middleware/auth');

const router = express.Router();

// 获取房间列表（可按酒店ID筛选）
router.get('/', async (req, res) => {
  try {
    const { hotelId } = req.query;
    
    let roomList;
    if (hotelId) {
      roomList = rooms.find({ hotelId });
    } else {
      roomList = rooms.find();
    }
    
    // 关联酒店信息
    const result = roomList.map(room => {
      const hotel = hotels.findById(room.hotelId);
      return {
        ...room,
        hotelName: hotel ? hotel.name : ''
      };
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取单个房间详情
router.get('/:id', async (req, res) => {
  try {
    const room = rooms.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }
    
    const hotel = hotels.findById(room.hotelId);
    res.json({
      ...room,
      hotelName: hotel ? hotel.name : ''
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 创建房间
router.post('/', auth, async (req, res) => {
  try {
    const { hotelId, name, price, bedType, capacity, stock, images } = req.body;
    
    // 检查酒店是否存在
    const hotel = hotels.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    // 商户只能为自己的酒店添加房间
    if (hotel.merchantId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限为该酒店添加房间' });
    }
    
    const room = rooms.insert({
      hotelId,
      name,
      price: parseFloat(price),
      bedType: bedType || '大床/双床',
      capacity: capacity || 2,
      stock: stock || 10,
      images: images || []
    });
    
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 更新房间
router.put('/:id', auth, async (req, res) => {
  try {
    const room = rooms.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }
    
    // 检查酒店权限
    const hotel = hotels.findById(room.hotelId);
    if (hotel.merchantId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限修改' });
    }
    
    const updatedRoom = rooms.update(req.params.id, req.body);
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 删除房间
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = rooms.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }
    
    // 检查酒店权限
    const hotel = hotels.findById(room.hotelId);
    if (hotel.merchantId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限删除' });
    }
    
    rooms.remove(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
