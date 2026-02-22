import { View, Text, ScrollView, Image, Swiper, SwiperItem } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { get } from '../../utils/api';
import './detail.scss';

// Tab配置
const tabs = [
  { id: 'intro', name: '介绍' },
  { id: 'highlight', name: '亮点' },
  { id: 'room', name: '房型' },
  { id: 'review', name: '点评' },
  { id: 'map', name: '位置' }
];

// 模拟酒店数据
const mockHotel = {
  _id: '1',
  name: '上海外滩华尔道夫酒店',
  city: '上海',
  address: '中山东一路2号',
  star: 5,
  rating: 4.9,
  reviewCount: 2856,
  description: '上海外滩华尔道夫酒店坐落于历史悠久的外滩黄金地带，完美的结合了极佳的地理位置、奢华舒适的住宿与外滩的标志性景观。酒店拥有百余间豪华客房及套房，细致周到 的服务为您营造出独树一帜的住宿体验。',
  facilities: ['免费WiFi', '免费停车', '游泳池', '健身房', '餐厅', '会议室', '机场接送', '24小时前台'],
  images: [
    'https://img.zm520.com/hotel1.jpg',
    'https://img.zm520.com/hotel2.jpg',
    'https://img.zm520.com/hotel3.jpg',
    'https://img.zm520.com/hotel4.jpg',
    'https://img.zm520.com/hotel5.jpg'
  ],
  rooms: [
    {
      _id: 'r1',
      name: '豪华客房',
      area: '45㎡',
      floor: '3-10层',
      maxGuests: 2,
      bedType: '大床/双床',
      price: 1888,
      amenities: ['免费WiFi', '早餐', '迷你吧']
    },
    {
      _id: 'r2',
      name: '外滩景观客房',
      area: '50㎡',
      floor: '8-15层',
      maxGuests: 2,
      bedType: '大床',
      price: 2288,
      amenities: ['免费WiFi', '早餐', '迷你吧', '江景']
    },
    {
      _id: 'r3',
      name: '高级套房',
      area: '75㎡',
      floor: '12-20层',
      maxGuests: 3,
      bedType: '大床',
      price: 3288,
      amenities: ['免费WiFi', '早餐', '迷你吧', '江景', '客厅']
    },
    {
      _id: 'r4',
      name: '总统套房',
      area: '280㎡',
      floor: '25层',
      maxGuests: 4,
      bedType: '大床',
      price: 28888,
      amenities: ['免费WiFi', '早餐', '迷你吧', '江景', '客厅', '餐厅', '管家服务']
    }
  ]
};

export default function Detail() {
  const { id } = Taro.getCurrentInstance().router?.params || {};
  
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('intro');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [checkInDate, setCheckInDate] = useState('02.22');
  const [checkOutDate, setCheckOutDate] = useState('02.23');
  const [adults, setAdults] = useState(1);
  const [roomCount, setRoomCount] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHotelDetail();
  }, [id]);

  const fetchHotelDetail = async () => {
    setLoading(true);
    try {
      const res = await get(`/hotels/${id}`);
      setHotel(res);
      if (res.rooms) {
        setRooms(res.rooms);
      }
    } catch (error) {
      console.error('获取酒店详情失败', error);
      // 使用模拟数据
      setHotel(mockHotel);
      setRooms(mockHotel.rooms);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHotelDetail();
  };

  const handleBack = () => {
    router.navigateBack();
  };

  const handleImageChange = (e) => {
    setCurrentImageIndex(e.detail.current);
  };

  const handleImagePreview = (index) => {
    const images = hotel?.images || [];
    Taro.previewImage({
      current: index,
      urls: images
    });
  };

  const handleBookNow = () => {
    Taro.showToast({
      title: '预订功能开发中',
      icon: 'none'
    });
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const displayedRooms = showAllRooms ? rooms : rooms.slice(0, 2);
  const minPrice = rooms.length > 0 ? Math.min(...rooms.map(r => r.price)) : 0;

  if (loading) {
    return (
      <View className="detail-page">
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  if (!hotel) {
    return (
      <View className="detail-page">
        <View className="empty">
          <Text>酒店不存在</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="detail-page">
      <ScrollView 
        className="detail-scroll" 
        scrollY
        refresherEnabled={true}
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        {/* 顶部Banner */}
        <View className="banner-wrapper">
          <Swiper
            className="banner-swiper"
            circular
            autoplay={false}
            onChange={handleImageChange}
          >
            {(hotel.images || []).map((image, index) => (
              <SwiperItem key={index}>
                <View className="banner-item" onClick={() => handleImagePreview(index)}>
                  <View className="image-placeholder">
                    <Text className="placeholder-text">{hotel.name.substring(0, 2)}</Text>
                  </View>
                </View>
              </SwiperItem>
            ))}
          </Swiper>
          <View className="banner-nav">
            <View className="back-btn" onClick={handleBack}>
              <Text>‹</Text>
            </View>
            <View className="share-btn">
              <Text>⋮</Text>
            </View>
          </View>
          <View className="banner-counter">
            <Text>{currentImageIndex + 1}/{hotel.images?.length || 0}</Text>
          </View>
          <View className="banner-tabs">
            {tabs.map((tab) => (
              <View 
                key={tab.id}
                className={`banner-tab ${currentTab === tab.id ? 'active' : ''}`}
                onClick={() => setCurrentTab(tab.id)}
              >
                <Text>{tab.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 酒店基本信息 */}
        <View className="hotel-base">
          <View className="base-header">
            <Text className="hotel-name">{hotel.name}</Text>
            <View className="star-badge">
              <Text>{'⭐'.repeat(hotel.star)}</Text>
            </View>
          </View>
          
          <View className="base-rating">
            <View className="rating-box">
              <Text className="rating-score">{hotel.rating}</Text>
              <Text className="rating-label">携程评分</Text>
            </View>
            <View className="divider"></View>
            <View className="review-box">
              <Text className="review-count">{hotel.reviewCount}条点评</Text>
              <Text className="review-rate">98%推荐</Text>
            </View>
          </View>

          <View className="base-address">
            <View className="address-icon">📍</View>
            <Text className="address-text">{hotel.city} · {hotel.address}</Text>
            <View className="map-btn">
              <Text>地图</Text>
              <Text className="arrow">›</Text>
            </View>
          </View>

          <View className="base-facilities">
            {(hotel.facilities || []).slice(0, 8).map((facility, index) => (
              <View key={index} className="facility-item">
                <Text className="facility-icon">✓</Text>
                <Text className="facility-text">{facility}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 酒店介绍 */}
        {currentTab === 'intro' && (
          <View className="section intro-section">
            <View className="section-title">
              <Text>酒店介绍</Text>
            </View>
            <View className="intro-content">
              <Text className="intro-text">{hotel.description}</Text>
            </View>
          </View>
        )}

        {/* 酒店亮点 */}
        {currentTab === 'highlight' && (
          <View className="section highlight-section">
            <View className="section-title">
              <Text>酒店亮点</Text>
            </View>
            <View className="highlight-list">
              <View className="highlight-item">
                <Text className="highlight-icon">🏙️</Text>
                <View className="highlight-content">
                  <Text className="highlight-title">外滩核心位置</Text>
                  <Text className="highlight-desc">步行可达外滩，欣赏黄浦江两岸美景</Text>
                </View>
              </View>
              <View className="highlight-item">
                <Text className="highlight-icon">⭐</Text>
                <View className="highlight-content">
                  <Text className="highlight-title">奢华住宿体验</Text>
                  <Text className="highlight-desc">国际五星级标准，细致周到服务</Text>
                </View>
              </View>
              <View className="highlight-item">
                <Text className="highlight-icon">🍳</Text>
                <View className="highlight-content">
                  <Text className="highlight-title">精美早餐</Text>
                  <Text className="highlight-desc">丰盛自助早餐，开启美好一天</Text>
                </View>
              </View>
              <View className="highlight-item">
                <Text className="highlight-icon">🅿️</Text>
                <View className="highlight-content">
                  <Text className="highlight-title">免费停车</Text>
                  <Text className="highlight-desc">住客免费停车，轻松出行</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 房型列表 */}
        {currentTab === 'room' && (
          <View className="section room-section">
            <View className="section-title">
              <Text>房型价格</Text>
            </View>
            <View className="room-list">
              {displayedRooms.map((room) => (
                <View key={room._id} className="room-item">
                  <View className="room-image">
                    <View className="room-image-placeholder">
                      <Text>{room.name.substring(0, 2)}</Text>
                    </View>
                  </View>
                  <View className="room-info">
                    <Text className="room-name">{room.name}</Text>
                    <View className="room-meta">
                      <Text className="meta-item">{room.area}</Text>
                      <Text className="meta-divider">|</Text>
                      <Text className="meta-item">{room.floor}</Text>
                      <Text className="meta-divider">|</Text>
                      <Text className="meta-item">可住{room.maxGuests}人</Text>
                    </View>
                    <View className="room-bed">
                      <Text>{room.bedType}</Text>
                    </View>
                    <View className="room-amenities">
                      {(room.amenities || []).slice(0, 3).map((amenity, index) => (
                        <Text key={index} className="amenity-tag">{amenity}</Text>
                      ))}
                    </View>
                  </View>
                  <View className="room-price">
                    <Text className="price-symbol">¥</Text>
                    <Text className="price-value">{formatPrice(room.price)}</Text>
                    <Text className="price-unit">起</Text>
                    <View className="book-btn">
                      <Text>预订</Text>
                    </View>
                  </View>
                </View>
              ))}
              
              {rooms.length > 2 && (
                <View className="show-more-btn" onClick={() => setShowAllRooms(!showAllRooms)}>
                  <Text>{showAllRooms ? '收起房型' : `查看更多${rooms.length - 2}种房型`}</Text>
                  <Text className="arrow">{showAllRooms ? '▲' : '▼'}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 点评 */}
        {currentTab === 'review' && (
          <View className="section review-section">
            <View className="section-title">
              <Text>用户点评</Text>
              <Text className="title-score">{hotel.rating}分</Text>
            </View>
            <View className="review-summary">
              <View className="summary-item">
                <Text className="summary-label">卫生</Text>
                <View className="summary-bar">
                  <View className="summary-progress" style={{ width: '95%' }}></View>
                </View>
                <Text className="summary-score">4.9</Text>
              </View>
              <View className="summary-item">
                <Text className="summary-label">设施</Text>
                <View className="summary-bar">
                  <View className="summary-progress" style={{ width: '94%' }}></View>
                </View>
                <Text className="summary-score">4.8</Text>
              </View>
              <View className="summary-item">
                <Text className="summary-label">服务</Text>
                <View className="summary-bar">
                  <View className="summary-progress" style={{ width: '96%' }}></View>
                </View>
                <Text className="summary-score">4.9</Text>
              </View>
              <View className="summary-item">
                <Text className="summary-label">位置</Text>
                <View className="summary-bar">
                  <View className="summary-progress" style={{ width: '98%' }}></View>
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
                <Text className="review-content">酒店位置非常好，就在外滩边上，出门就是黄浦江。房间设施齐全，服务人员态度热情。早餐种类丰富，味道不错。整体体验非常棒！</Text>
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
                <Text className="review-content">第二次入住了，依然很满意。房间干净整洁，景观房视野很好。前台办理入住很快，推荐！</Text>
              </View>
            </View>
            <View className="view-all-reviews">
              <Text>查看全部{hotel.reviewCount}条点评</Text>
            </View>
          </View>
        )}

        {/* 位置 */}
        {currentTab === 'map' && (
          <View className="section map-section">
            <View className="section-title">
              <Text>酒店位置</Text>
            </View>
            <View className="map-container">
              <View className="map-placeholder">
                <Text>地图加载中...</Text>
              </View>
            </View>
            <View className="map-info">
              <View className="address-icon">📍</View>
              <Text className="address-text">{hotel.city} · {hotel.address}</Text>
            </View>
            <View className="map-actions">
              <View className="map-btn-item">
                <Text>到这里</Text>
              </View>
              <View className="map-btn-item">
                <Text>从这里出发</Text>
              </View>
            </View>
          </View>
        )}

        <View className="bottom-space"></View>
      </ScrollView>

      {/* 底部预订栏 */}
      <View className="footer-bar">
        <View className="footer-left">
          <View className="price-wrapper">
            <Text className="price-symbol">¥</Text>
            <Text className="price-value">{formatPrice(minPrice)}</Text>
            <Text className="price-unit">起</Text>
          </View>
        </View>
        <View className="footer-right">
          <View className="date-info">
            <Text>{checkInDate} - {checkOutDate}</Text>
            <Text className="divider">|</Text>
            <Text>{roomCount}间 {adults}成人</Text>
          </View>
          <View className="book-btn" onClick={handleBookNow}>
            <Text>立即预订</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
