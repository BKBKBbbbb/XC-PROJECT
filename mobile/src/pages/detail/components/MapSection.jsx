import { View, Text } from '@tarojs/components';

export default function MapSection({ hotel }) {
  return (
    <View className="section map-section" id="section-map">
      <View className="section-title">
        <Text>酒店位置</Text>
      </View>
      <View className="map-container">
        <View className="map-placeholder">
          <Text>地图加载中...</Text>
        </View>
      </View>
      <View className="map-info">
        <View className="address-icon">📍</View>
        <Text className="address-text">
          {hotel.city} · {hotel.address}
        </Text>
      </View>
      <View className="map-actions">
        <View className="map-btn-item">
          <Text>到这里</Text>
        </View>
        <View className="map-btn-item">
          <Text>从这里出发</Text>
        </View>
      </View>
    </View>
  );
}

