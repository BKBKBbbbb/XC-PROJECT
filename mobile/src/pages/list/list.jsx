import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import { useNavigate, useRouter } from '@tarojs/taro';
import { get } from '../../utils/api';
import './list.scss';

export default function List() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState('');
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    const params = router.params;
    if (params.city) {
      setCity(params.city);
      fetchHotels(params.city);
    } else {
      fetchHotels();
    }
  }, []);

  const fetchHotels = async (cityName = '') => {
    setLoading(true);
    try {
      const params = cityName ? { city: cityName } : {};
      const res = await get('/hotels', params);
      setHotels(res.list || []);
    } catch (error) {
      console.error('获取酒店列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHotelClick = (id) => {
    navigate({
      url: `/pages/detail/detail?id=${id}`
    });
  };

  const handleCityClick = (cityName) => {
    setCity(cityName);
    fetchHotels(cityName);
  };

  const cities = ['北京', '上海', '杭州', '广州', '深圳', '成都'];

  return (
    <View className="list-page">
      {/* 城市筛选 */}
      <ScrollView className="city-tabs" scrollX>
        {cities.map((item) => (
          <View 
            key={item}
            className={`city-tab ${city === item ? 'active' : ''}`}
            onClick={() => handleCityClick(item)}
          >
            {item}
          </View>
        ))}
      </ScrollView>

      {/* 酒店列表 */}
      <ScrollView className="hotel-scroll" scrollY>
        {loading ? (
          <View className="loading">
            <Text>加载中...</Text>
          </View>
        ) : hotels.length > 0 ? (
          hotels.map((hotel) => (
            <View 
              key={hotel._id} 
              className="hotel-item"
              onClick={() => handleHotelClick(hotel._id)}
            >
              <View className="hotel-img">
                <Text>酒店图片</Text>
              </View>
              <View className="hotel-content">
                <Text className="hotel-name">{hotel.name}</Text>
                <Text className="hotel-address">{hotel.city} · {hotel.address}</Text>
                <View className="hotel-tags">
                  <Text className="tag">{hotel.star}星级</Text>
                  <Text className="rating">评分 {hotel.rating || '5.0'}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View className="empty">
            <Text>暂无酒店数据</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
