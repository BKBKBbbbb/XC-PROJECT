import { View, Text } from '@tarojs/components';

export default function ReviewSection({ hotel }) {
  return (
    <View className="section review-section" id="section-review">
      <View className="section-title">
        <Text>用户点评</Text>
        <Text className="title-score">
          {hotel.rating ? hotel.rating.toFixed(1) : '--'}分
        </Text>
      </View>
      <View className="review-summary">
        <View className="summary-item">
          <Text className="summary-label">卫生</Text>
          <View className="summary-bar">
            <View className="summary-progress" style={{ width: '95%' }} />
          </View>
          <Text className="summary-score">4.9</Text>
        </View>
        <View className="summary-item">
          <Text className="summary-label">设施</Text>
          <View className="summary-bar">
            <View className="summary-progress" style={{ width: '94%' }} />
          </View>
          <Text className="summary-score">4.8</Text>
        </View>
        <View className="summary-item">
          <Text className="summary-label">服务</Text>
          <View className="summary-bar">
            <View className="summary-progress" style={{ width: '96%' }} />
          </View>
          <Text className="summary-score">4.9</Text>
        </View>
        <View className="summary-item">
          <Text className="summary-label">位置</Text>
          <View className="summary-bar">
            <View className="summary-progress" style={{ width: '98%' }} />
          </View>
          <Text className="summary-score">5.0</Text>
        </View>
      </View>
      <View className="review-list">
        <View className="review-item">
          <View className="review-header">
            <View className="review-avatar">
              <Text>张</Text>
            </View>
            <View className="review-user">
              <Text className="user-name">张先生</Text>
              <Text className="review-date">2024-01-15</Text>
            </View>
            <View className="review-rating">
              <Text>5.0</Text>
            </View>
          </View>
          <Text className="review-content">
            酒店位置非常好，就在外滩边上，出门就是黄浦江。房间设施齐全，服务人员态度热情。早餐种类丰富，味道不错。整体体验非常棒！
          </Text>
        </View>
        <View className="review-item">
          <View className="review-header">
            <View className="review-avatar">
              <Text>李</Text>
            </View>
            <View className="review-user">
              <Text className="user-name">李女士</Text>
              <Text className="review-date">2024-01-10</Text>
            </View>
            <View className="review-rating">
              <Text>4.8</Text>
            </View>
          </View>
          <Text className="review-content">
            第二次入住了，依然很满意。房间干净整洁，景观房视野很好。前台办理入住很快，推荐！
          </Text>
        </View>
      </View>
      <View className="view-all-reviews">
        <Text>查看全部{hotel.reviewCount || 0}条点评</Text>
      </View>
    </View>
  );
}

