import { View, Text } from '@tarojs/components';
import { getScoreText } from '../../utils/hotel';
import Taro from '@tarojs/taro';

export default function BaseInfoSection({ hotel }) {
  return (
    <View className="hotel-base" id="section-highlight">
      <View className="base-header">
        <View className="base-title">
          <Text className="hotel-name">{hotel.name}</Text>
          <View className="hotel-tags-line">
            <View className="star-diamond-wrap">
              {Array.from({ length: hotel.star || 0 }).map((_, i) => (
                <Text key={i} className="star-diamond">
                  ◆
                </Text>
              ))}
            </View>
            {hotel.openDate && (
              <Text className="open-year">
                {new Date(hotel.openDate).getFullYear()}年装修
              </Text>
            )}
            {hotel.rankLabel && (
              <View className="rank-badge">
                <Text>{hotel.rankLabel}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 评分区：4.7 超棒 / 点评数 / 摘要 */}
      <View className="base-rating">
        <View className="rating-box">
          <Text className="rating-score">
            {hotel.rating ? hotel.rating.toFixed(1) : '--'}
          </Text>
          <Text className="rating-label">
            {getScoreText(hotel.rating)} · 携程用户评分
          </Text>
        </View>
        <View className="divider" />
        <View className="review-box">
          <Text className="review-count">{hotel.reviewCount || 0}条点评</Text>
          <Text className="review-rate">98%用户推荐（示意）</Text>
        </View>
      </View>

      {/* 酒店亮点图标区 */}
      <View className="base-highlights">
        {(hotel.facilities || ['设计师酒店', '艺术氛围', '免费停车', '亲子房'])
          .slice(0, 4)
          .map((item, idx) => (
            <View key={idx} className="highlight-chip">
              <Text className="highlight-dot">●</Text>
              <Text className="highlight-text">{item}</Text>
            </View>
          ))}
        <View
          className="highlight-more"
          onClick={() =>
            Taro.showToast({
              title: '设施政策详情可在后续补充',
              icon: 'none'
            })
          }
        >
          <Text>查看全部设施与政策</Text>
        </View>
      </View>

      {/* 位置区：地址 / 距地铁距离（示意） / 地图按钮 */}
      <View className="base-address">
        <View className="address-icon">📍</View>
        <View className="address-main">
          <Text className="address-text">
            {hotel.city} · {hotel.address}
          </Text>
          {hotel.locationDesc && (
            <Text className="address-sub">{hotel.locationDesc}</Text>
          )}
        </View>
        <View
          className="map-btn"
          onClick={() =>
            Taro.showToast({ title: '地图查看开发中', icon: 'none' })
          }
        >
          <Text>地图</Text>
          <Text className="arrow">›</Text>
        </View>
      </View>
    </View>
  );
}

