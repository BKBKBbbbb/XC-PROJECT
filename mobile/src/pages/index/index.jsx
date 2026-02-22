import { View, Text, ScrollView, Input } from '@tarojs/components';
import { useState, useRef, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

// 模拟Banner数据
const bannerList = [
  { id: 1, hotelId: '1', title: '上海外滩华尔道夫酒店', subtitle: '奢华体验' },
  { id: 2, hotelId: '2', title: '度假精选', subtitle: '休闲好去处' },
  { id: 3, hotelId: '3', title: '商务出行', subtitle: '便捷高效' }
];

// 热门标签
const hotTags = [
  { id: 1, name: '亲子', icon: '👨‍👩‍👧' },
  { id: 2, name: '豪华', icon: '⭐' },
  { id: 3, name: '免费停车', icon: '🅿️' },
  { id: 4, name: '机场接送', icon: '✈️' },
  { id: 5, name: '游泳池', icon: '🏊' },
  { id: 6, name: '健身房', icon: '🏋️' }
];

// 热门城市
const hotCities = ['上海', '北京', '杭州', '广州', '深圳', '成都', '重庆', '西安'];

// 筛选条件选项
const starOptions = [
  { id: 5, name: '五星级', icon: '⭐⭐⭐⭐⭐' },
  { id: 4, name: '四星级', icon: '⭐⭐⭐⭐' },
  { id: 3, name: '三星级', icon: '⭐⭐⭐' }
];

const priceRanges = [
  { id: '0-300', name: '300元以下', min: 0, max: 300 },
  { id: '300-500', name: '300-500元', min: 300, max: 500 },
  { id: '500-800', name: '500-800元', min: 500, max: 800 },
  { id: '800-1000', name: '800-1000元', min: 800, max: 1000 },
  { id: '1000+', name: '1000元以上', min: 1000, max: null }
];

export default function Index() {
  
  // 状态管理
  const [currentCity, setCurrentCity] = useState('上海');
  const [keyword, setKeyword] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [checkInFullDate, setCheckInFullDate] = useState('');
  const [checkOutFullDate, setCheckOutFullDate] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [currentTab, setCurrentTab] = useState(0); // 0: 入住, 1: 离店
  
  // 筛选条件状态
  const [selectedStars, setSelectedStars] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  
  // 日历状态
  const [calendarDates, setCalendarDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    // 设置默认日期
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setCheckInDate(formatDate(today));
    setCheckOutDate(formatDate(tomorrow));
    setCheckInFullDate(formatFullDate(today));
    setCheckOutFullDate(formatFullDate(tomorrow));
    
    // 生成日历数据
    generateCalendarDates(today.getFullYear(), today.getMonth());
    
    // Banner自动轮播
    let timer;
    timer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % bannerList.length);
    }, 3000);
    
    // 获取定位
    getLocation();
    
    return () => clearInterval(timer);
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

  const generateCalendarDates = (year, month) => {
    const dates = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    // 上月日期
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      dates.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i)
      });
    }
    
    // 当月日期
    for (let i = 1; i <= totalDays; i++) {
      dates.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }
    
    // 下月日期
    const remainingDays = 42 - dates.length;
    for (let i = 1; i <= remainingDays; i++) {
      dates.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
    
    setCalendarDates(dates);
  };

  const formatDate = (date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}.${day}`;
  };

  const formatFullDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatMonth = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}年${month}月`;
  };

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
    generateCalendarDates(newMonth.getFullYear(), newMonth.getMonth());
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
    generateCalendarDates(newMonth.getFullYear(), newMonth.getMonth());
  };

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSelected = (date) => {
    const checkIn = checkInFullDate ? new Date(checkInFullDate) : null;
    const checkOut = checkOutFullDate ? new Date(checkOutFullDate) : null;
    
    if (checkIn && date.toDateString() === checkIn.toDateString()) return 'checkin';
    if (checkOut && date.toDateString() === checkOut.toDateString()) return 'checkout';
    if (checkIn && checkOut && date > checkIn && date < checkOut) return 'range';
    return false;
  };

  const handleDateClick = (item) => {
    if (!item.isCurrentMonth || isDateDisabled(item.date)) return;
    
    if (currentTab === 0) {
      // 选择入住日期
      setCheckInDate(formatDate(item.date));
      setCheckInFullDate(formatFullDate(item.date));
      setCurrentTab(1);
    } else {
      // 选择离店日期
      const checkIn = new Date(checkInFullDate);
      if (item.date <= checkIn) {
        // 如果选择的离店日期早于入住日期，自动设置为入住+1天
        const nextDay = new Date(checkIn);
        nextDay.setDate(nextDay.getDate() + 1);
        setCheckOutDate(formatDate(nextDay));
        setCheckOutFullDate(formatFullDate(nextDay));
      } else {
        setCheckOutDate(formatDate(item.date));
        setCheckOutFullDate(formatFullDate(item.date));
      }
      setShowDatePicker(false);
    }
  };

  const handleBannerClick = (item) => {
    Taro.navigateTo({
      url: `/pages/detail/detail?id=${item.hotelId}`
    });
  };

  const handleCitySelect = (city) => {
    setCurrentCity(city);
    setShowCityPicker(false);
  };

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag.name)) {
      setSelectedTags(selectedTags.filter(t => t !== tag.name));
    } else {
      setSelectedTags([...selectedTags, tag.name]);
    }
  };

  const handleStarSelect = (star) => {
    if (selectedStars.includes(star.id)) {
      setSelectedStars(selectedStars.filter(s => s !== star.id));
    } else {
      setSelectedStars([...selectedStars, star.id]);
    }
  };

  const handlePriceSelect = (range) => {
    setSelectedPriceRange(range.id === selectedPriceRange?.id ? null : range);
  };

  const clearFilters = () => {
    setSelectedStars([]);
    setSelectedPriceRange(null);
  };

  const handleSearch = () => {
    const query = {
      city: currentCity,
      keyword,
      checkIn: checkInFullDate,
      checkOut: checkOutFullDate,
      tags: selectedTags.join(','),
      stars: selectedStars.join(','),
      priceMin: selectedPriceRange?.min || '',
      priceMax: selectedPriceRange?.max || ''
    };
    
    const queryStr = Object.entries(query)
      .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    
    Taro.navigateTo({
      url: `/pages/list/list?${queryStr}`
    });
  };

  const handleCityQuickClick = (city) => {
    Taro.navigateTo({
      url: `/pages/list/list?city=${city}`
    });
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <View className="index-page">
      {/* 顶部Banner */}
      <View className="banner-wrapper">
        <ScrollView 
          className="banner-scroll" 
          scrollX 
          scrollIntoView={`banner-${bannerIndex}`}
        >
          {bannerList.map((item, index) => (
            <View 
              key={item.id} 
              className="banner-item" 
              id={`banner-${index}`}
              onClick={() => handleBannerClick(item)}
            >
              <View className="banner-image">
                <Text className="banner-title-text">{item.title}</Text>
                <Text className="banner-subtitle-text">{item.subtitle}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        <View className="banner-dots">
          {bannerList.map((_, index) => (
            <View 
              key={index} 
              className={`dot ${index === bannerIndex ? 'active' : ''}`}
            />
          ))}
        </View>
      </View>

      {/* 搜索面板 */}
      <View className="search-panel">
        {/* 城市选择 */}
        <View className="search-row" onClick={() => setShowCityPicker(true)}>
          <View className="search-item city-item">
            <Text className="label">目的地</Text>
            <View className="value-wrapper">
              <Text className="value">{currentCity}</Text>
              <Text className="arrow">▼</Text>
            </View>
          </View>
        </View>

        <View className="search-divider"></View>

        {/* 日期选择 */}
        <View className="search-row date-row">
          <View className="search-item" onClick={() => { setCurrentTab(0); setShowDatePicker(true); }}>
            <Text className="label">入住</Text>
            <Text className="value">{checkInDate || '请选择'}</Text>
          </View>
          <View className="date-arrow">
            <Text>1晚</Text>
          </View>
          <View className="search-item" onClick={() => { setCurrentTab(1); setShowDatePicker(true); }}>
            <Text className="label">离店</Text>
            <Text className="value">{checkOutDate || '请选择'}</Text>
          </View>
        </View>

        <View className="search-divider"></View>

        {/* 关键字搜索 */}
        <View className="search-row keyword-row">
          <View className="search-item keyword-item">
            <Text className="label">关键字</Text>
            <Input 
              className="keyword-input"
              placeholder="酒店名称/品牌/位置"
              value={keyword}
              onInput={(e) => setKeyword(e.detail.value)}
            />
          </View>
        </View>

        {/* 筛选和快捷标签按钮 */}
        <View className="filter-row">
          <View className="filter-btn" onClick={() => setShowFilter(!showFilter)}>
            <Text className="filter-icon">☰</Text>
            <Text>筛选</Text>
            {(selectedStars.length > 0 || selectedPriceRange) && <View className="filter-badge"></View>}
          </View>
          <View className="tags-row">
            {hotTags.slice(0, 4).map((tag) => (
              <View 
                key={tag.id}
                className={`tag-item ${selectedTags.includes(tag.name) ? 'active' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                <Text>{tag.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 筛选面板 */}
      {showFilter && (
        <View className="filter-panel">
          <View className="filter-section">
            <View className="filter-title">
              <Text>酒店星级</Text>
            </View>
            <View className="filter-options">
              {starOptions.map((star) => (
                <View 
                  key={star.id}
                  className={`filter-option ${selectedStars.includes(star.id) ? 'active' : ''}`}
                  onClick={() => handleStarSelect(star)}
                >
                  <Text>{star.icon}</Text>
                  <Text className="option-name">{star.name}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View className="filter-section">
            <View className="filter-title">
              <Text>价格区间</Text>
            </View>
            <View className="filter-options price-options">
              {priceRanges.map((range) => (
                <View 
                  key={range.id}
                  className={`filter-option price-option ${selectedPriceRange?.id === range.id ? 'active' : ''}`}
                  onClick={() => handlePriceSelect(range)}
                >
                  <Text className="option-name">{range.name}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View className="filter-actions">
            <View className="clear-btn" onClick={clearFilters}>
              <Text>清空</Text>
            </View>
            <View className="confirm-btn" onClick={() => setShowFilter(false)}>
              <Text>确定</Text>
            </View>
          </View>
        </View>
      )}

      {/* 快捷城市 */}
      <View className="city-section">
        <View className="section-title">
          <Text className="title-text">热门城市</Text>
        </View>
        <View className="city-grid">
          {hotCities.map((city, index) => (
            <View 
              key={index}
              className={`city-item ${currentCity === city ? 'active' : ''}`}
              onClick={() => handleCityQuickClick(city)}
            >
              <Text className="city-name">{city}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 搜索按钮 */}
      <View className="search-btn-wrapper">
        <View className="search-btn" onClick={handleSearch}>
          <Text className="btn-text">查询</Text>
        </View>
      </View>

      {/* 城市选择弹窗 */}
      {showCityPicker && (
        <View className="picker-mask" onClick={() => setShowCityPicker(false)}>
          <View className="picker-content" onClick={(e) => e.stopPropagation()}>
            <View className="picker-header">
              <Text className="picker-title">选择城市</Text>
              <View className="picker-close" onClick={() => setShowCityPicker(false)}>×</View>
            </View>
            <ScrollView className="picker-list" scrollY>
              <View className="picker-section-title">热门城市</View>
              {hotCities.map((city, index) => (
                <View 
                  key={index}
                  className={`picker-item ${currentCity === city ? 'active' : ''}`}
                  onClick={() => handleCitySelect(city)}
                >
                  <Text>{city}</Text>
                  {currentCity === city && <Text className="check-icon">✓</Text>}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* 日期选择弹窗 */}
      {showDatePicker && (
        <View className="picker-mask" onClick={() => setShowDatePicker(false)}>
          <View className="date-picker-content" onClick={(e) => e.stopPropagation()}>
            <View className="picker-header">
              <Text className="picker-title">
                {currentTab === 0 ? '选择入住日期' : '选择离店日期'}
              </Text>
              <View className="picker-close" onClick={() => setShowDatePicker(false)}>×</View>
            </View>
            
            <View className="date-tabs">
              <View 
                className={`date-tab ${currentTab === 0 ? 'active' : ''}`}
                onClick={() => setCurrentTab(0)}
              >
                <Text>入住 {checkInDate || '请选择'}</Text>
              </View>
              <View 
                className={`date-tab ${currentTab === 1 ? 'active' : ''}`}
                onClick={() => setCurrentTab(1)}
              >
                <Text>离店 {checkOutDate || '请选择'}</Text>
              </View>
            </View>
            
            <View className="calendar-header">
              <View className="calendar-nav" onClick={handlePrevMonth}>
                <Text>‹</Text>
              </View>
              <Text className="calendar-month">{formatMonth(currentMonth)}</Text>
              <View className="calendar-nav" onClick={handleNextMonth}>
                <Text>›</Text>
              </View>
            </View>
            
            <View className="calendar-weekdays">
              {weekDays.map((day, index) => (
                <View key={index} className="weekday">
                  <Text>{day}</Text>
                </View>
              ))}
            </View>
            
            <View className="calendar-dates">
              {calendarDates.map((item, index) => {
                const selected = isSelected(item.date);
                const disabled = !item.isCurrentMonth || isDateDisabled(item.date);
                return (
                  <View 
                    key={index}
                    className={`calendar-date ${item.isCurrentMonth ? '' : 'other-month'} ${selected || ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => handleDateClick(item)}
                  >
                    <Text>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
