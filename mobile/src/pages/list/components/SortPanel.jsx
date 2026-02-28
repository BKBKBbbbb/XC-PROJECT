import { View, Text } from '@tarojs/components';

export default function SortPanel(props) {
  const { visible, sortOptions, currentSort, onSelect } = props;

  if (!visible) return null;

  return (
    <View className="panel panel-sort">
      {sortOptions.map((option) => (
        <View
          key={option.id}
          className={`sort-item ${currentSort === option.id ? 'active' : ''}`}
          onClick={() => onSelect && onSelect(option)}
        >
          <Text>{option.name}</Text>
          {currentSort === option.id && <Text className="check-icon">✓</Text>}
        </View>
      ))}
    </View>
  );
}

