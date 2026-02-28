import { View, Text, Picker } from '@tarojs/components';

export default function CtripNavBar(props) {
  const {
    scrolled,
    city,
    cityOptions,
    onCityChange,
    dateText,
    onOpenCalendar,
    roomText,
    onTogglePeoplePanel,
    onBack,
    onSearch,
    onMap,
    onMore
  } = props;

  return (
    <View className={scrolled ? 'ctrip-nav-bar nav-scrolled' : 'ctrip-nav-bar'}>
      <View className="nav-left" onClick={onBack}>
        <Text className="nav-back-icon">‹</Text>
      </View>

      <View className="nav-center">
        <View className="nav-main-line">
          <Picker mode="selector" range={cityOptions} onChange={onCityChange}>
            <Text className="nav-city">{city}</Text>
          </Picker>
          <Text
            className="nav-date"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCalendar && onOpenCalendar();
            }}
          >
            {dateText}
          </Text>
        </View>
        <View className="nav-sub-line">
          <Text className="nav-room-info" onClick={onTogglePeoplePanel}>
            {roomText}
          </Text>
        </View>
      </View>

      <View className="nav-right">
        <View className="nav-icon-btn" onClick={onSearch}>
          <Text className="nav-icon">🔍</Text>
        </View>
        <View className="nav-icon-btn" onClick={onMap}>
          <Text className="nav-icon">🗺</Text>
        </View>
        <View className="nav-icon-btn" onClick={onMore}>
          <Text className="nav-icon">⋮</Text>
        </View>
      </View>
    </View>
  );
}

