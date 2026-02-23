const express = require('express');
const { orders, hotels, rooms, users } = require('../utils/store');
const auth = require('../middleware/auth');

const router = express.Router();

// 创建订单
router.post('/', async (req, res) => {
  try {
    const { hotelId, roomId, checkIn, checkOut, guestName, guestPhone, nights, totalPrice } = req.body;
    
    // 验证酒店
    const hotel = await hotels.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }
    
    // 验证房间
    const room = await rooms.findById(roomId);
    if (!room || room.hotelId !== hotelId) {
      return res.status(404).json({ message: '房型不存在' });
    }
    
    // 检查库存
    if (room.stock < 1) {
      return res.status(400).json({ message: '该房型已售罄' });
    }
    
    // 获取用户ID（如果已登录）
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let userId = null;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const config = require('../config');
        const decoded = jwt.verify(token, config.jwtSecret);
        userId = decoded.id;
      } catch (e) {
        // 未登录用户也可以下单，userId 为 null
      }
    }
    
    // 创建订单
    const order = await orders.insert({
      userId,
      hotelId,
      roomId,
      checkIn,
      checkOut: checkOut || new Date(new Date(checkIn).getTime() + nights * 24 * 60 * 60 * 1000).toISOString(),
      nights: nights || 1,
      totalPrice: parseFloat(totalPrice) || (room.price * (nights || 1)),
      guestName,
      guestPhone,
      status: 'pending',
      createdAt: new Date()
    });
    
    // 减少库存
    await rooms.update(roomId, { stock: room.stock - 1 });
    
    res.status(201).json({
      ...order,
      hotelName: hotel.name,
      roomName: room.name
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取订单列表
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query; // 'user' 或 'merchant'
    
    let orderList;
    
    if (type === 'merchant') {
      // 商户查看自己酒店的订单
      const merchantHotels = await hotels.find({ merchantId: req.user.id });
      const hotelIds = merchantHotels.map(h => h.id);
      const allOrders = await orders.find();
      orderList = allOrders.filter(o => hotelIds.includes(o.hotelId));
    } else if (type === 'user' || !req.user.role) {
      // 用户查看自己的订单
      orderList = await orders.find({ userId: req.user.id });
    } else {
      // 管理员查看所有订单
      orderList = await orders.find();
    }
    
    // 关联酒店和房间信息
    const result = await Promise.all(orderList.map(async order => {
      const hotel = await hotels.findById(order.hotelId);
      const room = await rooms.findById(order.roomId);
      const user = order.userId ? await users.findById(order.userId) : null;
      
      return {
        ...order,
        hotelName: hotel ? hotel.name : '',
        roomName: room ? room.name : '',
        userName: user ? user.username : '游客'
      };
    }));
    
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取订单详情
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await orders.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const hotel = await hotels.findById(order.hotelId);
    const room = await rooms.findById(order.roomId);
    const user = order.userId ? await users.findById(order.userId) : null;
    
    res.json({
      ...order,
      hotelName: hotel ? hotel.name : '',
      hotelAddress: hotel ? hotel.address : '',
      roomName: room ? room.name : '',
      userName: user ? user.username : '游客'
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 更新订单状态
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await orders.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    // 权限检查
    const hotel = await hotels.findById(order.hotelId);
    const isMerchant = hotel && hotel.merchantId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isMerchant && !isAdmin) {
      return res.status(403).json({ message: '无权限操作' });
    }
    
    // 验证状态转换
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled'],
      'cancelled': [],
      'completed': []
    };
    
    if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
      return res.status(400).json({ message: '无效的状态转换' });
    }
    
    // 如果取消订单，恢复库存
    if (status === 'cancelled') {
      const room = await rooms.findById(order.roomId);
      if (room) {
        await rooms.update(order.roomId, { stock: room.stock + 1 });
      }
    }
    
    const updatedOrder = await orders.update(req.params.id, { 
      status,
      updatedAt: new Date()
    });
    
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 取消订单（用户）
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await orders.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    // 用户只能取消自己的订单
    if (order.userId && order.userId !== req.user.id) {
      return res.status(403).json({ message: '无权限操作' });
    }
    
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({ message: '当前状态不可取消' });
    }
    
    // 恢复库存
    const room = await rooms.findById(order.roomId);
    if (room) {
      await rooms.update(order.roomId, { stock: room.stock + 1 });
    }
    
    const updatedOrder = await orders.update(req.params.id, { 
      status: 'cancelled',
      cancelledAt: new Date()
    });
    
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
