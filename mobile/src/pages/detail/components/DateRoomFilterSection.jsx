import { View, Text, ScrollView } from '@tarojs/components';

export default function DateRoomFilterSection(props) {
  const {
    checkInDate,
    checkOutDate,
    nights,
    onOpenCalendar,
    roomCount,
    adultCount,
    childCount,
    peoplePanelVisible,
    onTogglePeoplePanel,
    onClosePeoplePanel,
    onChangeCount,
    quickTags,
    selectedQuickTags,
    onToggleQuickTag,
    roomFilterVisible,
    onToggleRoomFilter,
    formatDateLabel
  } = props;

  return (
    <View className="date-room-filter" id="section-selected">
      <View className="date-row" onClick={onOpenCalendar}>
        <View className="date-main">
          <View className="date-col">
            <Text className="date-label">入住</Text>
            <Text className="date-value">
              {checkInDate ? formatDateLabel(checkInDate) : '请选择入住日期'}
            </Text>
          </View>
          <View className="date-col">
            <Text className="date-label">离店</Text>
            <Text className="date-value">
              {checkOutDate ? formatDateLabel(checkOutDate) : '请选择离店日期'}
            </Text>
          </View>
        </View>
        <View className="date-nights">
          <Text>{nights}晚</Text>
        </View>
      </View>

      <View className="people-row" onClick={onTogglePeoplePanel}>
        <Text className="people-label">间数/人数</Text>
        <Text className="people-value">
          {roomCount}间 {adultCount}成人
          {childCount > 0 ? ` ${childCount}儿童` : ''}
        </Text>
      </View>

      {peoplePanelVisible && (
        <View className="people-panel">
          {[
            { key: 'room', label: '房间数', value: roomCount, min: 1 },
            { key: 'adult', label: '成人', value: adultCount, min: 1 },
            { key: 'child', label: '儿童', value: childCount, min: 0 }
          ].map((item) => (
            <View key={item.key} className="people-row-inner">
              <Text className="people-row-label">{item.label}</Text>
              <View className="people-counter">
                <View
                  className={
                    item.value <= item.min
                      ? 'counter-btn counter-btn-disabled'
                      : 'counter-btn'
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.value <= item.min) return;
                    onChangeCount(item.key, -1);
                  }}
                >
                  <Text>-</Text>
                </View>
                <Text className="counter-value">{item.value}</Text>
                <View
                  className="counter-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeCount(item.key, 1);
                  }}
                >
                  <Text>+</Text>
                </View>
              </View>
            </View>
          ))}
          <View className="people-panel-footer">
            <View
              className="people-confirm-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClosePeoplePanel();
              }}
            >
              <Text>完成</Text>
            </View>
          </View>
        </View>
      )}

      {/* 快捷标签 + 筛选按钮 */}
      <View className="quick-tags-row">
        <ScrollView className="quick-tags-scroll" scrollX>
          {quickTags.map((tag) => (
            <View
              key={tag}
              className={`quick-tag ${
                selectedQuickTags.includes(tag) ? 'active' : ''
              }`}
              onClick={() => onToggleQuickTag(tag)}
            >
              <Text>{tag}</Text>
            </View>
          ))}
        </ScrollView>
        <View className="filter-btn" onClick={onToggleRoomFilter}>
          <Text>筛选</Text>
        </View>
      </View>

      {roomFilterVisible && (
        <View className="room-filter-panel">
          <Text className="filter-title">房型筛选（示意）</Text>
          <Text className="filter-sub">
            可按床型、窗景、是否含早等维度拓展
          </Text>
        </View>
      )}
    </View>
  );
}

