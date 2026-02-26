// 酒店/房型相关的通用工具函数，供列表页与详情页复用

// 评分映射为中文评价文案
export const getScoreText = (rating) => {
  if (!rating && rating !== 0) return '';
  if (rating >= 4.8) return '超棒';
  if (rating >= 4.5) return '很好';
  if (rating >= 4.0) return '不错';
  return '一般';
};

// 收藏数量格式化为「1.8万」风格
export const formatFavoriteCount = (num) => {
  if (!num && num !== 0) return '';
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return `${num}`;
};

// 计算晚数（入住/离店日期差值）
export const calcNights = (start, end) => {
  if (!start || !end) return 0;
  const ts1 = new Date(start).setHours(0, 0, 0, 0);
  const ts2 = new Date(end).setHours(0, 0, 0, 0);
  const diff = ts2 - ts1;
  if (diff <= 0) return 0;
  return diff / (24 * 60 * 60 * 1000);
};

// 获取酒店最低价：
// 1）优先根据 rooms（房型列表）中 price 字段；
// 2）其次根据 hotel.roomTypes（JSON 字段）中的 basePrice；
// 3）最后回退到 hotel.price。
export const getMinHotelPrice = (hotel, rooms) => {
  if (!hotel && (!rooms || rooms.length === 0)) return 0;

  // rooms 优先
  if (Array.isArray(rooms) && rooms.length > 0) {
    const validPrices = rooms
      .map((r) => {
        const v = Number(r?.price || 0);
        return Number.isNaN(v) || v < 0 ? NaN : v;
      })
      .filter((v) => !Number.isNaN(v));

    if (validPrices.length > 0) {
      return Math.min(...validPrices);
    }
  }

  const fallback = Number(hotel?.price || 0) || 0;
  let roomTypes = hotel?.roomTypes;

  if (!roomTypes) {
    return fallback;
  }

  try {
    const parsed =
      typeof roomTypes === 'string' ? JSON.parse(roomTypes) : roomTypes;
    const list = Array.isArray(parsed) ? parsed : [];

    const prices = list
      .map((room) => {
        if (!room || room.basePrice == null) {
          return NaN;
        }
        const v = Number(room.basePrice);
        return Number.isNaN(v) || v < 0 ? NaN : v;
      })
      .filter((v) => !Number.isNaN(v));

    if (prices.length === 0) {
      return fallback;
    }

    return Math.min(...prices);
  } catch (e) {
    return fallback;
  }
};

