import { View, Text } from '@tarojs/components';

export default function TopBanner({ onClick }) {
  return (
    <View className="banner-wrapper" onClick={onClick}>
      <View className="banner-image">
        <Text className="banner-title">欢迎使用易宿酒店</Text>
        <Text className="banner-subtitle">找到您的理想住宿</Text>
      </View>
    </View>
  );
}

