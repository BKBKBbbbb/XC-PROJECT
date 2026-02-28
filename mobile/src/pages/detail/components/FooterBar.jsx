import { View, Text } from '@tarojs/components';

export default function FooterBar({ minPrice, formatPrice, onAskHotel, onViewRooms }) {
  return (
    <View className="footer-bar">
      <View className="footer-left">
        <View className="ask-btn" onClick={onAskHotel}>
          <Text>问酒店</Text>
        </View>
      </View>
      <View className="footer-right">
        <View className="footer-price">
          <Text className="price-symbol">¥</Text>
          <Text className="price-value">{formatPrice(minPrice)}</Text>
          <Text className="price-unit">起</Text>
        </View>
        <View className="footer-room-btn" onClick={onViewRooms}>
          <Text>查看房型</Text>
        </View>
      </View>
    </View>
  );
}

