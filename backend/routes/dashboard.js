const express = require('express');
const auth = require('../middleware/auth');
const { hotels, comments } = require('../utils/store');

const router = express.Router();

/**
 * 获取运营概览统计数据（酒店总数、待审核数量、评论总数）
 * - 酒店总数：只统计已通过审核的酒店（status = 'published'），即已上线可预订的酒店
 * - 待审核数量：待审核的评论条数
 * - 评论总数：所有评论
 * 需要登录，管理员和商户均可访问
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const [hotelCount, pendingCount, reviewCount] = await Promise.all([
      hotels.count({ status: 'published' }),  // 已通过的酒店 = 酒店总数（已上线可预订）
      comments.count({ status: 'pending' }),
      comments.count(),
    ]);

    const payload = {
      hotelCount: Number(hotelCount ?? 0),
      pendingCount: Number(pendingCount ?? 0),
      reviewCount: Number(reviewCount ?? 0),
    };
    console.log('[Dashboard] stats:', payload);
    res.json(payload);
  } catch (error) {
    console.error('获取运营统计失败:', error);
    res.status(500).json({ message: '获取统计数据失败', error: error.message });
  }
});

module.exports = router;
