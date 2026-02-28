import { View, Text, Image } from '@tarojs/components';
import { memo } from 'react';
import { getScoreText, formatFavoriteCount } from '../../../utils/hotel';
import RCImage from '../../../assets/R-C.jpg';

/**
 * 单个酒店卡片组件：使用 React.memo 减少重渲染
 */
const HotelItem = memo(function HotelItem({ hotel, city, onClick }) {
  const handleClick = () => {
    onClick && onClick(hotel);
  };

  // 名称与地址之间优先展示的标签：优先用后端 tags + 服务信息；不足时再用可推导字段兜底
  // 用对象结构方便对“星级”单独上色
  const primaryTags = (() => {
    const tags = [];
    const pushTag = (text, type = 'default') => {
      if (!text) return;
      const normalized = String(text).trim();
      if (!normalized) return;
      // 去重：同文案不重复展示
      if (tags.some((t) => t.text === normalized)) return;
      tags.push({ text: normalized, type });
    };

    // 0) 星级优先（放第一个）
    const star = Number(hotel.star || 0);
    if (star > 0) pushTag(`${star}星`, 'star');

    // 1) 后端原生 tags（如果有）
    if (Array.isArray(hotel.tags)) {
      hotel.tags.filter(Boolean).forEach((t) => pushTag(t, 'default'));
    }

    // 2) 服务信息（有则展示，无则不展示）
    if (hotel.freeParking) pushTag('免费停车', 'service');
    if (hotel.freeWifi) pushTag('免费WiFi', 'service');
    if (hotel.breakfastType) pushTag('早餐', 'service');
    if (hotel.familyFriendly) pushTag('亲子友好', 'service');
    if (hotel.petsAllowed) pushTag('可携带宠物', 'service');

    // 3) 推导字段兜底
    if (hotel.distance) pushTag(`距你${hotel.distance}`, 'default');
    if (hotel.couponText) pushTag('优惠', 'default');
    if (hotel.activityTag) pushTag('活动', 'default');
    if (hotel.hasVideo) pushTag('视频看房', 'default');

    // 星级确保在第一个（防止后端 tags 恰好也推了“X星”导致位置变化）
    tags.sort(
      (a, b) => (a.type === 'star' ? -1 : 0) - (b.type === 'star' ? -1 : 0)
    );
    // 主标签区允许两行展示，但仍做一个上限，避免极端数据导致渲染成本过高
    return tags.slice(0, 12);
  })();

  return (
    <View className="hotel-item" onClick={handleClick}>
      {/* 左侧：酒店主图 + 视频按钮 + 活动标签 */}
      <View className="hotel-image">
        <Image
          src={hotel.image || RCImage}
          className="hotel-image-real"
          mode="aspectFill"
          lazyLoad
        />

        {/* 视频播放按钮（示意） */}
        {hotel.hasVideo && (
          <View className="video-badge">
            <Text className="video-icon">▶</Text>
          </View>
        )}

        {/* 左下角活动标签，如「春节特惠精选」 */}
        {hotel.activityTag && (
          <View className="image-activity-tag">
            <Text>{hotel.activityTag}</Text>
          </View>
        )}
      </View>

      {/* 右侧：酒店名称、评分、位置、亮点、标签、榜单、价格信息 */}
      <View className="hotel-content">
        <View className="hotel-title-row">
          {hotel.isAd && <Text className="ad-badge">广告</Text>}
          <Text className="hotel-name">{hotel.name}</Text>
        </View>

        {((typeof hotel.rating === 'number' &&
          !Number.isNaN(hotel.rating) &&
          hotel.rating > 0) ||
          !!hotel.reviewCount ||
          typeof hotel.favoriteCount === 'number') && (
          <View className="hotel-rating-row">
            {typeof hotel.rating === 'number' &&
              !Number.isNaN(hotel.rating) &&
              hotel.rating > 0 && (
                <View className="score-box">
                  <Text className="score-value">{hotel.rating.toFixed(1)}</Text>
                  <Text className="score-text">{getScoreText(hotel.rating)}</Text>
                </View>
              )}
            {hotel.reviewCount ? (
              <Text className="review-text">{hotel.reviewCount}条点评</Text>
            ) : null}
            {typeof hotel.favoriteCount === 'number' && (
              <Text className="favorite-text">
                {formatFavoriteCount(hotel.favoriteCount)}人收藏
              </Text>
            )}
          </View>
        )}

        {(primaryTags.length > 0 || hotel.rankLabel) && (
          <View className="hotel-tags-row hotel-tags-row--primary">
            {primaryTags.map((tag) => (
              <View
                key={`${tag.type}:${tag.text}`}
                className={`tag${tag.type === 'star' ? ' tag--star' : ''}`}
              >
                <Text>{tag.text}</Text>
              </View>
            ))}
            {hotel.rankLabel && (
              <View className="rank-tag">
                <Text>{hotel.rankLabel}</Text>
              </View>
            )}
          </View>
        )}

        <View className="hotel-location-row">
          <Text className="location-text">
            {hotel.locationDesc || (hotel.address ? `近${city}·${hotel.address}` : city)}
          </Text>
        </View>

        {hotel.highlights && (
          <View className="hotel-highlights-row">
            <Text className="highlights-text">{hotel.highlights}</Text>
          </View>
        )}

        <View className="hotel-price-row">
          <View className="hotel-price-main">
            <Text className="price-symbol">¥</Text>
            <Text className="price-value">
              {hotel.displayPrice != null && hotel.displayPrice !== undefined
                ? hotel.displayPrice
                : hotel.price}
            </Text>
            <Text className="price-unit">起</Text>
          </View>
          {hotel.couponText && (
            <View className="price-extra">
              <Text className="coupon-text">{hotel.couponText}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

export default HotelItem;

