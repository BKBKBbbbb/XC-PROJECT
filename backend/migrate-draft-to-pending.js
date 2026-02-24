/**
 * 迁移脚本：将 draft 状态的酒店迁移为 pending 状态
 * 因为 draft 应该是草稿（未提交），而 pending 是待审核（已提交）
 */

const { hotels } = require('./utils/store');

async function migrateDraftToPending() {
  try {
    console.log('开始迁移 draft 状态的酒店到 pending...');
    
    const draftHotels = await hotels.find({ status: 'draft' });
    console.log(`找到 ${draftHotels.length} 个 draft 状态的酒店`);
    
    if (draftHotels.length === 0) {
      console.log('没有需要迁移的酒店');
      return;
    }
    
    for (const hotel of draftHotels) {
      console.log(`迁移酒店: ${hotel.name} (ID: ${hotel.id})`);
      await hotels.update(hotel.id, { status: 'pending' });
    }
    
    console.log(`✅ 成功迁移 ${draftHotels.length} 个酒店到 pending 状态`);
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateDraftToPending()
    .then(() => {
      console.log('迁移完成');
      process.exit(0);
    })
    .catch(err => {
      console.error('迁移失败:', err);
      process.exit(1);
    });
}

module.exports = { migrateDraftToPending };
