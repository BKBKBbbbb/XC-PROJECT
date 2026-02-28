import { View, Text } from '@tarojs/components';

const defaultCities = ['上海', '北京', '杭州', '广州', '深圳', '成都', '重庆', '西安'];

export default function HotCitySection({ cities = defaultCities }) {
  return (
    <View className="city-section">
      <View className="section-title">
        <Text>热门城市</Text>
      </View>
      <View className="city-grid">
        {cities.map((city, index) => (
          <View key={index} className="city-item">
            <Text className="city-name">{city}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

