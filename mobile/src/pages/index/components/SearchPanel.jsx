import { View, Text, Input, Picker } from '@tarojs/components';

const formatDateLabel = (d) => {
  if (!d) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tTs = today.getTime();
  const dCopy = new Date(d);
  dCopy.setHours(0, 0, 0, 0);
  const dTs = dCopy.getTime();
  const diffDays = (dTs - tTs) / (24 * 60 * 60 * 1000);
  const month = dCopy.getMonth() + 1;
  const date = dCopy.getDate();

  let suffix = '';
  if (diffDays === 0) suffix = ' 今天';
  else if (diffDays === 1) suffix = ' 明天';
  else if (diffDays === 2) suffix = ' 后天';

  return `${month}月${date}日${suffix}`;
};

export default function SearchPanel(props) {
  const {
    currentTab,
    onTabChange,
    cityOptions,
    currentCity,
    onCityChange,
    onGetLocation,
    checkInDate,
    checkOutDate,
    nightLabel,
    onOpenCalendar,
    keyword,
    onKeywordChange,
    filterPanelVisible,
    priceRange,
    selectedStars,
    onFilterPanelChange,
    onPriceRangeChange,
    onToggleStar,
    onResetFilterPanel,
    peoplePanelVisible,
    roomCount,
    adultCount,
    childCount,
    onPeoplePanelChange,
    onChangeCount,
    quickTags,
    selectedTags,
    onToggleTag,
    onSearch
  } = props;

  return (
    <View className="search-panel">
      {/* 选项卡：国内 / 海外 / 民宿 / 钟点房（放在地点上方） */}
      <View className="tabs-wrapper">
        {[
          { key: 'domestic', label: '国内' },
          { key: 'oversea', label: '海外' },
          { key: 'homestay', label: '民宿' },
          { key: 'hour', label: '钟点房' }
        ].map((tab) => (
          <View
            key={tab.key}
            className={currentTab === tab.key ? 'tab-item tab-item-active' : 'tab-item'}
            onClick={() => onTabChange && onTabChange(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      {/* 城市选择（支持 Picker + 定位） */}
      <View className="search-row">
        <Picker mode="selector" range={cityOptions} onChange={onCityChange}>
          <View className="search-item">
            <Text className="label">
              目的地
              <Text className="location-tag">支持定位</Text>
            </Text>
            <Text className="value">
              {currentCity}
              <Text className="arrow-down">▼</Text>
            </Text>
          </View>
        </Picker>

        {/* 定位图标：点击重新触发定位逻辑（模拟/真实均可） */}
        <View className="location-btn" onClick={onGetLocation}>
          <Text className="location-icon">📍</Text>
        </View>
      </View>

      <View className="search-divider"></View>

      {/* 入住 / 离店日期（自定义简易日历组件） */}
      <View className="search-row">
        <View className="search-item" onClick={onOpenCalendar}>
          <Text className="label">入住</Text>
          <Text className="value">
            {checkInDate ? formatDateLabel(checkInDate) : '请选择入住日期'}
          </Text>
        </View>
        <View className="search-item" onClick={onOpenCalendar}>
          <Text className="label">离店</Text>
          <Text className="value">
            {checkOutDate ? formatDateLabel(checkOutDate) : '请选择离店日期'}
          </Text>
        </View>
        <View className="date-arrow">
          <Text>{nightLabel}</Text>
        </View>
      </View>

      <View className="search-divider"></View>

      {/* 关键字搜索 */}
      <View className="search-row">
        <View className="search-item">
          <Text className="label">关键字</Text>
          <Input
            className="keyword-input"
            type="text"
            value={keyword}
            placeholder="位置/品牌/酒店"
            placeholderClass="keyword-placeholder"
            onInput={onKeywordChange}
          />
        </View>
      </View>

      <View className="search-divider"></View>

      {/* 筛选条件：价格 / 星级 */}
      <View
        className="search-row filter-row"
        onClick={() =>
          onFilterPanelChange && onFilterPanelChange(!filterPanelVisible)
        }
      >
        <View className="search-item">
          <Text className="label">筛选条件</Text>
          <Text className="value">
            {priceRange} /
            {selectedStars.length > 0 ? ` ${selectedStars.join('、')}星` : ' 星级不限'}
          </Text>
        </View>
        <View className="filter-arrow">
          <Text>{filterPanelVisible ? '收起' : '展开'}</Text>
        </View>
      </View>

      {filterPanelVisible && (
        <View className="filter-panel">
          <View className="filter-block">
            <Text className="filter-title">价格区间（每晚）</Text>
            <View className="filter-tags">
              {['不限', '¥0-¥300', '¥300-¥600', '¥600-¥1000', '¥1000以上'].map(
                (range) => (
                  <View
                    key={range}
                    className={
                      priceRange === range
                        ? 'filter-tag filter-tag-active'
                        : 'filter-tag'
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      onPriceRangeChange && onPriceRangeChange(range);
                    }}
                  >
                    <Text>{range}</Text>
                  </View>
                )
              )}
            </View>
          </View>

          <View className="filter-block">
            <Text className="filter-title">酒店星级</Text>
            <View className="filter-tags">
              {[1, 2, 3, 4, 5].map((star) => (
                <View
                  key={star}
                  className={
                    selectedStars.includes(star)
                      ? 'filter-tag filter-tag-active'
                      : 'filter-tag'
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar && onToggleStar(star);
                  }}
                >
                  <Text>{star}星</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 底部操作区：重置 + 完成 */}
          <View className="filter-footer">
            <View
              className="filter-footer-reset"
              onClick={(e) => {
                e.stopPropagation();
                onResetFilterPanel && onResetFilterPanel();
              }}
            >
              <Text>重置</Text>
            </View>
            <View
              className="filter-footer-confirm"
              onClick={(e) => {
                e.stopPropagation();
                onFilterPanelChange && onFilterPanelChange(false);
              }}
            >
              <Text>完成</Text>
            </View>
          </View>
        </View>
      )}

      <View className="search-divider"></View>

      {/* 人数选择 */}
      <View
        className="search-row"
        onClick={() =>
          onPeoplePanelChange && onPeoplePanelChange(!peoplePanelVisible)
        }
      >
        <View className="search-item">
          <Text className="label">人数</Text>
          <Text className="value">
            {roomCount}间房 {adultCount}成人 {childCount}儿童
          </Text>
        </View>
      </View>

      {peoplePanelVisible && (
        <View className="people-panel">
          {[
            { key: 'room', label: '房间数', value: roomCount, min: 1 },
            { key: 'adult', label: '成人', value: adultCount, min: 1 },
            { key: 'child', label: '儿童', value: childCount, min: 0 }
          ].map((item) => (
            <View key={item.key} className="people-row">
              <Text className="people-label">{item.label}</Text>
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
                    onChangeCount && onChangeCount(item.key, -1);
                  }}
                >
                  <Text>-</Text>
                </View>
                <Text className="counter-value">{item.value}</Text>
                <View
                  className="counter-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeCount && onChangeCount(item.key, 1);
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
                onPeoplePanelChange && onPeoplePanelChange(false);
              }}
            >
              <Text>完成</Text>
            </View>
          </View>
        </View>
      )}

      {/* 快捷标签 */}
      <View className="quick-tags">
        {quickTags.map((tag) => (
          <View
            key={tag}
            className={
              selectedTags.includes(tag)
                ? 'quick-tag quick-tag-active'
                : 'quick-tag'
            }
            onClick={() => onToggleTag && onToggleTag(tag)}
          >
            <Text>{tag}</Text>
          </View>
        ))}
      </View>

      {/* 搜索按钮：红色通栏大按钮 */}
      <View className="search-btn" onClick={onSearch}>
        <Text className="btn-text">查询</Text>
      </View>
    </View>
  );
}

