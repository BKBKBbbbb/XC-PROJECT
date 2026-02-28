import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import BEDImg from '../../assets/BED.jpg';

export default function RecommendRoomSection(props) {
  const {
    displayedRooms,
    totalRooms,
    showAllRooms,
    minPrice,
    onToggleShowAllRooms,
    formatPrice
  } = props;

  return (
    <View className="section room-section">
      <View className="recommend-header">
        <Text className="recommend-title">为您推荐</Text>
        <Text className="recommend-sub">本店最低价</Text>
        <View className="recommend-price">
          <Text className="price-symbol">¥</Text>
          <Text className="price-value">{formatPrice(minPrice)}</Text>
          <Text className="price-unit">起</Text>
        </View>
      </View>

      <View className="room-list">
        {displayedRooms.map((room) => (
          <View key={room._id} className="room-item">
            <View className="room-image">
              <Image
                className="room-image-placeholder"
                src={BEDImg}
                mode="aspectFill"
              />
            </View>
            <View className="room-info">
              <Text className="room-name">{room.name}</Text>
              <View className="room-meta">
                {room.area && <Text className="meta-item">{room.area}</Text>}
                {room.area && (room.floor || room.maxGuests) && (
                  <Text className="meta-divider">|</Text>
                )}
                {room.floor && (
                  <Text className="meta-item">{room.floor}</Text>
                )}
                {room.floor && room.maxGuests && (
                  <Text className="meta-divider">|</Text>
                )}
                {room.maxGuests && (
                  <Text className="meta-item">可住{room.maxGuests}人</Text>
                )}
              </View>
              {room.bedType && (
                <View className="room-bed">
                  <Text>{room.bedType}</Text>
                </View>
              )}
              <View className="room-amenities">
                {(room.amenities || [])
                  .slice(0, 3)
                  .map((amenity, index) => (
                    <Text key={index} className="amenity-tag">
                      {amenity}
                    </Text>
                  ))}
              </View>
            </View>
            <View className="room-price">
              <Text className="price-symbol">¥</Text>
              <Text className="price-value">
                {formatPrice(Number(room.price || 0))}
              </Text>
              <Text className="price-unit">起</Text>
              <View
                className="book-btn"
                onClick={() =>
                  Taro.showToast({
                    title: '查看房型预订方案开发中',
                    icon: 'none'
                  })
                }
              >
                <Text>查看房型</Text>
              </View>
            </View>
          </View>
        ))}

        {totalRooms > 2 && (
          <View className="show-more-btn" onClick={onToggleShowAllRooms}>
            <Text>
              {showAllRooms
                ? '收起房型'
                : `查看更多${totalRooms - 2}种房型`}
            </Text>
            <Text className="arrow">{showAllRooms ? '▲' : '▼'}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

