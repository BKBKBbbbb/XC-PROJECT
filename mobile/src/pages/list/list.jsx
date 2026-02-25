import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { get } from '../../utils/api';
import './list.scss';

// 筛选标签
const filterTags = [
  { id: 1, name: '外滩核心区' },
  { id: 2, name: '新春套餐' },
  { id: 3, name: '近地铁' },
  { id: 4, name: '亲子游' },
  { id: 5, name: '豪华型' },
  { id: 6, name: '免费停车' }
];

// 排序选项
const sortOptions = [
  // 需求要求按价格从低到高排序，这里只保留价格升序这一项作为主排序方式
  { id: 'price_asc', name: '价格从低到高' }
];

// 价格区间选项
const priceRanges = ['不限', '¥0-¥300', '¥300-¥600', '¥600-¥1000', '¥1000以上'];

// 星级选项
const starOptions = [1, 2, 3, 4, 5];

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}.${day}`;
};

export default function List() {
  const params = Taro.getCurrentInstance().router?.params || {};
  
  const [city] = useState(decodeURIComponent(params.city || '上海'));
  const [checkInDate] = useState(params.checkIn || '');
  const [checkOutDate] = useState(params.checkOut || '');
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentSort, setCurrentSort] = useState('price_asc');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [priceRange, setPriceRange] = useState('不限');
  const [selectedStars, setSelectedStars] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const roomCount = Number(params.rooms || 1);
  const adultCount = Number(params.adults || 1);
  const childCount = Number(params.children || 0);

  useEffect(() => {
    fetchHotels(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, currentSort, selectedTags, priceRange, selectedStars, checkInDate, checkOutDate]);

  const fetchHotels = async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    const currentPage = reset ? 1 : page;
    
    try {
      const queryParams = {
        city,
        page: currentPage,
        pageSize: 10,
        sort: currentSort,
        tags: selectedTags.join(','),
        priceRange,
        stars: selectedStars.join(','),
        checkIn: checkInDate,
        checkOut: checkOutDate
      };
      
      // 这里预留真实后端接口数据结构：
      // 后端可返回 { list: HotelItem[], total: number }，其中 HotelItem 至少包含
      // { _id, name, rating, address, price, star, tags, image, distance }
      const res = await get('/hotels', queryParams);
      const newHotels = res.list || [];

      const merged = reset ? newHotels : [...hotels, ...newHotels];
      // 按价格从低到高排序，满足需求中的价格排序要求
      merged.sort((a, b) => (a.price || 0) - (b.price || 0));

      setHotels(merged);
      setPage(currentPage + 1);
      
      setHasMore(newHotels.length >= 10);
    } catch (error) {
      console.error('获取酒店列表失败', error);
      // 使用模拟数据
      const mockData = getMockHotels();
      const mergedMock = reset ? mockData : [...hotels, ...mockData];
      mergedMock.sort((a, b) => (a.price || 0) - (b.price || 0));
      setHotels(mergedMock);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getMockHotels = () => {
    return [
      {
        _id: '1',
        name: '上海外滩华尔道夫酒店',
        address: '中山东一路2号',
        city: '上海',
        star: 5,
        rating: 4.9,
        reviewCount: 2856,
        price: 2888,
        tags: ['外滩核心区', '豪华型', '江景房'],
        image: 'https://img.zm520.com/hotel1.jpg',
        distance: '0.5km'
      },
      {
        _id: '2',
        name: '上海浦东丽思卡尔顿酒店',
        address: '世纪大道8号',
        city: '上海',
        star: 5,
        rating: 4.8,
        reviewCount: 3245,
        price: 2588,
        tags: ['近地铁', '豪华型', '浦东新区'],
        image: 'https://img.zm520.com/hotel2.jpg',
        distance: '1.2km'
      },
      {
        _id: '3',
        name: '上海静安香格里拉大酒店',
        address: '延安中路1218号',
        city: '上海',
        star: 5,
        rating: 4.7,
        reviewCount: 2156,
        price: 1988,
        tags: ['静安区', '豪华型', '近地铁'],
        image: 'https://img.zm520.com/hotel3.jpg',
        distance: '2.0km'
      },
      {
        _id: '4',
        name: '上海金茂君悦大酒店',
        address: '世纪大道88号',
        city: '上海',
        star: 5,
        rating: 4.6,
        reviewCount: 1876,
        price: 1688,
        tags: ['浦东新区', '豪华型', '江景房'],
        image: 'https://img.zm520.com/hotel4.jpg',
        distance: '1.8km'
      },
      {
        _id: '5',
        name: '上海虹桥雅居乐万豪酒店',
        address: '虹桥路550号',
        city: '上海',
        star: 5,
        rating: 4.5,
        reviewCount: 1234,
        price: 1288,
        tags: ['虹桥区', '近机场', '游泳池'],
        image: 'https://img.zm520.com/hotel5.jpg',
        distance: '5.0km'
      }
    ];
  };

  const handleHotelClick = (id) => {
    Taro.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  };

  const handleSortChange = (sort) => {
    setCurrentSort(sort.id);
    setShowSortMenu(false);
    setPage(1);
  };

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag.name)) {
      setSelectedTags(selectedTags.filter(t => t !== tag.name));
    } else {
      setSelectedTags([...selectedTags, tag.name]);
    }
    setPage(1);
  };

  const handlePriceChange = (range) => {
    setPriceRange(range);
    setPage(1);
  };

  const toggleStar = (star) => {
    setSelectedStars((prev) => {
      if (prev.includes(star)) {
        return prev.filter((s) => s !== star);
      }
      return [...prev, star];
    });
    setPage(1);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchHotels(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchHotels(true);
  };

  const handleEditSearch = () => {
    Taro.navigateTo({
      url: '/pages/index/index'
    });
  };

  return (
    <View className="list-page">
      {/* 顶部搜索条件栏 */}
      <View className="top-bar">
        <View className="bar-content">
          <View className="city-date" onClick={handleEditSearch}>
            <Text className="city">{city}</Text>
            <Text className="divider">|</Text>
            <Text className="date">
              {checkInDate && checkOutDate
                ? `${formatDateDisplay(checkInDate)} - ${formatDateDisplay(checkOutDate)}`
                : '日期未选择'}
            </Text>
          </View>
          <View className="room-info">
            <Text>
              {roomCount}间 {adultCount}成人{childCount > 0 ? ` ${childCount}儿童` : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* 筛选和排序 */}
      <View className="filter-bar">
        <ScrollView className="filter-tags" scrollX>
          {filterTags.map((tag) => (
            <View 
              key={tag.id}
              className={`filter-tag ${selectedTags.includes(tag.name) ? 'active' : ''}`}
              onClick={() => handleTagClick(tag)}
            >
              <Text>{tag.name}</Text>
            </View>
          ))}
        </ScrollView>
        <View className="sort-btn" onClick={() => setShowSortMenu(!showSortMenu)}>
          <Text>{sortOptions.find(s => s.id === currentSort)?.name || '排序'}</Text>
          <Text className="arrow">{showSortMenu ? '▲' : '▼'}</Text>
        </View>
      </View>

      {/* 详细筛选（星级、价格区间，默认折叠） */}
      <View
        className="filter-detail-row"
        onClick={() => setShowFilter((v) => !v)}
      >
        <View className="filter-detail-left">
          <Text className="filter-detail-label">筛选</Text>
          <Text className="filter-detail-value">
            {priceRange} /
            {selectedStars.length > 0
              ? ` ${selectedStars.join('、')}星`
              : ' 星级不限'}
          </Text>
        </View>
        <View className="filter-detail-arrow">
          <Text>{showFilter ? '收起' : '展开'}</Text>
        </View>
      </View>

      {showFilter && (
        <View className="filter-panel">
          <View className="filter-block">
            <Text className="filter-title">价格区间（每晚）</Text>
            <View className="filter-tags">
              {priceRanges.map((range) => (
                <View
                  key={range}
                  className={`filter-tag ${priceRange === range ? 'active' : ''}`}
                  onClick={() => handlePriceChange(range)}
                >
                  <Text>{range}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="filter-block">
            <Text className="filter-title">酒店星级</Text>
            <View className="filter-tags">
              {starOptions.map((star) => (
                <View
                  key={star}
                  className={`filter-tag ${selectedStars.includes(star) ? 'active' : ''}`}
                  onClick={() => toggleStar(star)}
                >
                  <Text>{star}星</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 排序下拉菜单 */}
      {showSortMenu && (
        <View className="sort-menu">
          {sortOptions.map((option) => (
            <View 
              key={option.id}
              className={`sort-item ${currentSort === option.id ? 'active' : ''}`}
              onClick={() => handleSortChange(option)}
            >
              <Text>{option.name}</Text>
              {currentSort === option.id && <Text className="check-icon">✓</Text>}
            </View>
          ))}
        </View>
      )}

      {/* 酒店列表 */}
      <ScrollView 
        className="hotel-list" 
        scrollY 
        onScrollToLower={handleLoadMore}
        onRefresherRefresh={handleRefresh}
        refresherEnabled={true}
        refresherTriggered={refreshing}
      >
        {loading && hotels.length === 0 ? (
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
              <View className="hotel-image">
                <View className="image-placeholder">
                  <Text className="placeholder-text">{hotel.name.substring(0, 2)}</Text>
                </View>
                {hotel.tags && hotel.tags.includes('外滩核心区') && (
                  <View className="tag-badge">
                    <Text>外滩精选</Text>
                  </View>
                )}
              </View>
              <View className="hotel-content">
                <Text className="hotel-name">{hotel.name}</Text>
                <View className="hotel-rating">
                  <View className="rating-star">
                    <Text className="star">{'⭐'.repeat(hotel.star)}</Text>
                  </View>
                  <Text className="rating-score">{hotel.rating}</Text>
                  <Text className="review-count">{hotel.reviewCount}条点评</Text>
                </View>
                <View className="hotel-address">
                  <Text className="address-text">{hotel.address}</Text>
                  <Text className="distance">{hotel.distance}</Text>
                </View>
                <View className="hotel-tags">
                  {hotel.tags && hotel.tags.map((tag, index) => (
                    <View key={index} className="tag">
                      <Text>{tag}</Text>
                    </View>
                  ))}
                </View>
                <View className="hotel-price">
                  <Text className="price-symbol">¥</Text>
                  <Text className="price-value">{hotel.price}</Text>
                  <Text className="price-unit">起</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View className="empty">
            <Text>暂无酒店数据</Text>
          </View>
        )}
        
        {/* 加载更多 */}
        {hotels.length > 0 && (
          <View className="load-more">
            {loading ? (
              <Text>加载中...</Text>
            ) : !hasMore ? (
              <Text>没有更多了</Text>
            ) : null}
          </View>
        )}
        
        <View className="list-bottom-space"></View>
      </ScrollView>
    </View>
  );
}
