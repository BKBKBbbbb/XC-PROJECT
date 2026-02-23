import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

export default function Index() {
  const [currentCity, setCurrentCity] = useState('上海');

  useEffect(() => {
    // 获取定位
    getLocation();
  }, []);

  const getLocation = () => {
    Taro.getLocation({
      type: 'wgs84',
      success: (res) => {
        console.log('定位成功', res);
        // 实际项目中可以根据经纬度获取城市
        // 这里模拟定位到上海
        setCurrentCity('上海');
      },
      fail: () => {
        console.log('定位失败，使用默认城市');
      }
    });
  };

  return (
    <View className="index-page">
      {/* 顶部Banner */}
      <View className="banner-wrapper">
        <View className="banner-image">
          <Text className="banner-title">欢迎使用易宿酒店</Text>
          <Text className="banner-subtitle">找到您的理想住宿</Text>
        </View>
      </View>

      {/* 搜索面板 */}
      <View className="search-panel">
        {/* 城市选择 */}
        <View className="search-row">
          <View className="search-item">
            <Text className="label">目的地</Text>
            <Text className="value">{currentCity}</Text>
          </View>
        </View>

        <View className="search-divider"></View>

        {/* 日期选择 */}
        <View className="search-row">
          <View className="search-item">
            <Text className="label">入住</Text>
            <Text className="value">今天</Text>
          </View>
          <View className="date-arrow">
            <Text>1晚</Text>
          </View>
          <View className="search-item">
            <Text className="label">离店</Text>
            <Text className="value">明天</Text>
          </View>
        </View>

        <View className="search-divider"></View>

        {/* 关键字搜索 */}
        <View className="search-row">
          <View className="search-item">
            <Text className="label">关键字</Text>
            <Text className="value">酒店名称/品牌/位置</Text>
          </View>
        </View>

        {/* 搜索按钮 */}
        <View className="search-btn">
          <Text className="btn-text">查询</Text>
        </View>
      </View>

      {/* 热门城市 */}
      <View className="city-section">
        <View className="section-title">
          <Text>热门城市</Text>
        </View>
        <View className="city-grid">
          {['上海', '北京', '杭州', '广州', '深圳', '成都', '重庆', '西安'].map((city, index) => (
            <View key={index} className="city-item">
              <Text className="city-name">{city}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
