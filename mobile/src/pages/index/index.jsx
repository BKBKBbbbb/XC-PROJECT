import { View, Text, Image, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import { useNavigate } from '@tarojs/taro';
import { get } from '../utils/api';
import './index.scss';

export default function Index() {
  const [hotels, setHotels] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const res = await get('/hotels', { limit: 10 });
      setHotels(res.list || []);
    } catch (error) {
      console.error('获取酒店列表失败', error);
    }
  };

  const handleHotelClick = (id) => {
    navigate({
      url: `/pages/detail/detail?id=${id}`
    });
  };

  const handleSearch = () => {
    navigate({
      url: '/pages/list/list'
    });
  };

  return (
    <View className="index-page">
      {/* 搜索栏 */}
      <View className="search-bar" onClick={handleSearch}>
        <Text className="search-placeholder">搜索酒店名称/城市</Text>
      </View>

      {/* Banner */}
      <View className="banner">
        <View className="banner-content">
          <Text className="banner-title">易宿酒店</Text>
          <Text className="banner-subtitle">精选酒店，品质保障</Text>
        </View>
      </View>

      {/* 快捷入口 */}
      <View className="quick-entry">
        <View className="entry-item" onClick={() => navigate({ url: '/pages/list/list?city=北京' })}>
          <View className="entry-icon">北京</View>
          <Text className="entry-text">北京</Text>
        </View>
        <View className="entry-item" onClick={() => navigate({ url: '/pages/list/list?city=上海' })}>
          <View className="entry-icon">上海</View>
          <Text className="entry-text">上海</Text>
        </View>
        <View className="entry-item" onClick={() => navigate({ url: '/pages/list/list?city=杭州' })}>
          <View className="entry-icon">杭州</View>
          <Text className="entry-text">杭州</Text>
        </View>
        <View className="entry-item" onClick={() => navigate({ url: '/pages/list/list?city=广州' })}>
          <View className="entry-icon">广州</View>
          <Text className="entry-text">广州</Text>
        </View>
      </View>

      {/* 热门酒店 */}
      <View className="section">
        <View className="section-header">
          <Text className="section-title">热门酒店</Text>
          <Text className="section-more" onClick={() => navigate({ url: '/pages/list/list' })}>更多 &gt;</Text>
        </View>
        
        <ScrollView className="hotel-list" scrollX>
          {hotels.length > 0 ? (
            hotels.map((hotel) => (
              <View 
                key={hotel._id} 
                className="hotel-card"
                onClick={() => handleHotelClick(hotel._id)}
              >
                <View className="hotel-image">
                  <Text className="hotel-img-placeholder">酒店图片</Text>
                </View>
                <View className="hotel-info">
                  <Text className="hotel-name">{hotel.name}</Text>
                  <Text className="hotel-address">{hotel.city} · {hotel.address}</Text>
                  <View className="hotel-bottom">
                    <Text className="hotel-star">{hotel.star}星级</Text>
                    <Text className="hotel-rating">评分 {hotel.rating || '5.0'}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="empty-tip">
              <Text>暂无酒店数据</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
