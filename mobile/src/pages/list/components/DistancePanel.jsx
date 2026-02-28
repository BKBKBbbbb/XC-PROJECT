import { View, Text } from '@tarojs/components';

export default function DistancePanel(props) {
  const { visible, distanceFilter, onSelect } = props;

  if (!visible) return null;

  return (
    <View className="panel panel-distance">
      <View className="panel-title-row">
        <Text className="panel-title">位置距离</Text>
      </View>
      <View className="panel-tags">
        {['不限', '距离优先', '1km 内', '3km 内', '5km 内'].map((item) => (
          <View
            key={item}
            className={`panel-tag ${distanceFilter === item ? 'active' : ''}`}
            onClick={() => onSelect && onSelect(item)}
          >
            <Text>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

