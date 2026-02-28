import { View, Text } from '@tarojs/components';

export default function PeoplePanel(props) {
  const { visible, roomCount, adultCount, childCount, onChangeCount, onClose } = props;

  if (!visible) return null;

  const rows = [
    { key: 'room', label: '房间数', value: roomCount, min: 1 },
    { key: 'adult', label: '成人', value: adultCount, min: 1 },
    { key: 'child', label: '儿童', value: childCount, min: 0 }
  ];

  return (
    <View className="people-panel">
      {rows.map((item) => (
        <View key={item.key} className="people-row">
          <Text className="people-label">{item.label}</Text>
          <View className="people-counter">
            <View
              className={
                item.value <= item.min ? 'counter-btn counter-btn-disabled' : 'counter-btn'
              }
              onClick={() => {
                if (item.value <= item.min) return;
                onChangeCount && onChangeCount(item.key, -1);
              }}
            >
              <Text>-</Text>
            </View>
            <Text className="counter-value">{item.value}</Text>
            <View
              className="counter-btn"
              onClick={() => {
                onChangeCount && onChangeCount(item.key, 1);
              }}
            >
              <Text>+</Text>
            </View>
          </View>
        </View>
      ))}
      <View className="people-panel-footer">
        <View className="people-confirm-btn" onClick={onClose}>
          <Text>完成</Text>
        </View>
      </View>
    </View>
  );
}

