const express = require('express');
const { comments } = require('../utils/store');
const auth = require('../middleware/auth');

const router = express.Router();

// 路由模块加载确认
console.log('评论路由模块已加载');

// 添加一个中间件来记录所有进入评论路由的请求
router.use((req, res, next) => {
  console.log(`📝 评论路由中间件: ${req.method} ${req.path}`);
  next();
});

// 测试路由（用于调试）
router.get('/test', (req, res) => {
  console.log('✅ 评论路由测试端点被访问');
  console.log('请求路径:', req.path);
  console.log('原始URL:', req.originalUrl);
  console.log('完整URL:', req.url);
  res.json({ message: '评论路由正常工作', path: req.path, originalUrl: req.originalUrl });
});

// 管理员获取评论列表（按状态筛选）
router.get('/', auth, async (req, res) => {
  try {
    console.log('收到评论列表请求:', req.method, req.path, '用户:', req.user?.role);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    console.log('查询参数:', { status, page, limit });

    let list = await comments.find();
    console.log('从数据库获取的评论数量:', list.length);
    
    if (status) {
      list = list.filter(c => c.status === status);
      console.log('筛选后的评论数量:', list.length);
    }

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = list.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedList = list.slice(start, start + parseInt(limit));

    console.log('返回评论数量:', paginatedList.length);

    res.json({
      list: paginatedList,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 审核通过
router.put('/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限' });
    }

    const comment = await comments.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    const updated = await comments.update(req.params.id, {
      status: 'published',
      reviewNote: null,
      updatedAt: new Date()
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 审核拒绝
router.put('/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限' });
    }

    const { reviewNote } = req.body;
    const comment = await comments.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    const updated = await comments.update(req.params.id, {
      status: 'rejected',
      reviewNote: reviewNote || '审核不通过',
      updatedAt: new Date()
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 删除（虚拟删除，可恢复）
router.put('/:id/delete', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限' });
    }

    const comment = await comments.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    const updated = await comments.update(req.params.id, {
      status: 'deleted',
      updatedAt: new Date()
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 恢复已删除的评论
router.put('/:id/restore', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限' });
    }

    const comment = await comments.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    if (comment.status !== 'deleted') {
      return res.status(400).json({ message: '只能恢复已删除的评论' });
    }

    const updated = await comments.update(req.params.id, {
      status: 'pending',
      updatedAt: new Date()
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
