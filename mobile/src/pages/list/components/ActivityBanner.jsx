import { View, Text } from '@tarojs/components';

export default function ActivityBanner(props) {
  const { onView } = props;

  return (
    <View className="activity-banner">
      <View className="activity-left">
        <View className="activity-tag">
          <Text>首住好礼</Text>
        </View>
        <Text className="activity-text">首住特惠 85折起</Text>
      </View>
      <View className="activity-right">
        <View className="activity-btn" onClick={onView}>
          <Text>查看</Text>
        </View>
      </View>
    </View>
  );
}

