import { View, Text, ScrollView } from '@tarojs/components';
import HotelItem from './HotelItem';

export default function VirtualHotelList(props) {
  const {
    loading,
    totalCount,
    topPaddingHeight,
    bottomPaddingHeight,
    visibleHotels,
    clampedStart,
    city,
    onHotelClick,
    hasMore,
    refreshing,
    onLoadMore,
    onRefresh,
    onScroll
  } = props;

  return (
    <ScrollView
      className="hotel-list"
      scrollY
      onScrollToLower={onLoadMore}
      onRefresherRefresh={onRefresh}
      refresherEnabled={true}
      refresherTriggered={refreshing}
      onScroll={onScroll}
    >
      {loading && totalCount === 0 ? (
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      ) : totalCount > 0 ? (
        <View>
          {topPaddingHeight > 0 && <View style={{ height: `${topPaddingHeight}px` }} />}
          {visibleHotels.map((hotel, index) => {
            const globalIndex = clampedStart + index;
            return (
              <HotelItem
                key={hotel._id || hotel.id || `${hotel.name || 'hotel'}-${globalIndex}`}
                hotel={hotel}
                city={city}
                onClick={onHotelClick}
              />
            );
          })}
          {bottomPaddingHeight > 0 && <View style={{ height: `${bottomPaddingHeight}px` }} />}
        </View>
      ) : (
        <View className="empty">
          <Text>暂无酒店数据</Text>
        </View>
      )}

      {totalCount > 0 && (
        <View className="load-more">
          {loading ? <Text>加载中...</Text> : !hasMore ? <Text>没有更多了</Text> : null}
        </View>
      )}

      <View className="list-bottom-space"></View>
    </ScrollView>
  );
}

