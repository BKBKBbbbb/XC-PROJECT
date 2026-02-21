import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import { useRouter } from '@tarojs/taro';
import { get } from '../../utils/api';
import './detail.scss';

export default function Detail() {
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { id } = router.params;

  useEffect(() => {
    if (id) {
      fetchHotelDetail(id);
    }
  }, [id]);

  const fetchHotelDetail = async (hotelId) => {
    setLoading(true);
    try {
      const res = await get(`/hotels/${hotelId}`);
      setHotel(res);
    } catch (error) {
      console.error('获取酒店详情失败', error);
    } finally {
      setLoading(false);
    }
  };

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
      <ScrollView className="detail-scroll" scrollY>
        {/* 酒店图片 */}
        <View className="hotel-banner">
          <Text className="banner-text">酒店图片</Text>
        </View>

        {/* 酒店基本信息 */}
        <View className="hotel-base">
          <Text className="hotel-name">{hotel.name}</Text>
          <View className="hotel-meta">
            <Text className="star">{hotel.star}星级</Text>
            <Text className="rating">评分 {hotel.rating || '5.0'}</Text>
          </View>
          <View className="hotel-address">
            <Text>地址：{hotel.city} · {hotel.address}</Text>
          </View>
        </View>

        {/* 酒店设施 */}
        {hotel.facilities && hotel.facilities.length > 0 && (
          <View className="section">
            <Text className="section-title">酒店设施</Text>
            <View className="facilities">
              {hotel.facilities.map((item, index) => (
                <Text key={index} className="facility-tag">{item}</Text>
              ))}
            </View>
          </View>
        )}

        {/* 酒店描述 */}
        {hotel.description && (
          <View className="section">
            <Text className="section-title">酒店介绍</Text>
            <Text className="description">{hotel.description}</Text>
          </View>
        )}

        {/* 底部占位 */}
        <View className="bottom-space"></View>
      </ScrollView>

      {/* 底部预订栏 */}
      <View className="footer-bar">
        <View className="price">
          <Text className="price-label}>¥</Text>
          <Text className="price-value">888</Text>
          <Text className="price-label">起</Text>
        </View>
        <View className="book-btn">
          <Text>立即预订</Text>
        </View>
      </View>
    </View>
  );
}
