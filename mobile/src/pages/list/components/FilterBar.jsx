import { View, Text, ScrollView } from '@tarojs/components';

export default function FilterBar(props) {
  const {
    showSortMenu,
    showDistanceFilter,
    distanceFilter,
    showFilter,
    priceRange,
    selectedStars,
    selectedTags,
    filterTags,
    hasActiveFilters,
    onToggleSort,
    onToggleDistance,
    onTogglePriceStar,
    onToggleFilter,
    onTagClick,
    onClearAll
  } = props;

  return (
    <View className="ctrip-filter-bar">
      <View className="filter-tabs">
        <View
          className={`filter-tab-item ${showSortMenu ? 'active' : ''}`}
          onClick={onToggleSort}
        >
          <Text className="filter-tab-text">欢迎度排序</Text>
        </View>
        <View
          className={`filter-tab-item ${
            showDistanceFilter || distanceFilter !== '不限' ? 'active' : ''
          }`}
          onClick={onToggleDistance}
        >
          <Text className="filter-tab-text">位置距离</Text>
        </View>
        <View
          className={`filter-tab-item ${
            showFilter && (priceRange !== '不限' || selectedStars.length > 0) ? 'active' : ''
          }`}
          onClick={onTogglePriceStar}
        >
          <Text className="filter-tab-text">价格/星级</Text>
        </View>
        <View
          className={`filter-tab-item ${showFilter ? 'active' : ''}`}
          onClick={onToggleFilter}
        >
          <Text className="filter-tab-text">筛选</Text>
        </View>
      </View>

      <View className="quick-tag-bar-row">
        <ScrollView className="quick-tag-scroll" scrollX>
          {filterTags.map((tag) => (
            <View
              key={tag.id}
              className={`quick-tag ${selectedTags.includes(tag.name) ? 'active' : ''}`}
              onClick={() => onTagClick && onTagClick(tag)}
            >
              <Text className="quick-tag-text">{tag.name}</Text>
            </View>
          ))}
        </ScrollView>
        <View
          className={`clear-all-btn ${hasActiveFilters ? 'visible' : ''}`}
          onClick={hasActiveFilters ? onClearAll : undefined}
        >
          <Text className="clear-all-text">全部清除</Text>
        </View>
      </View>
    </View>
  );
}

