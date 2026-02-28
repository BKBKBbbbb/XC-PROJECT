import { View } from '@tarojs/components';
import { useState, useEffect, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { get } from '../../utils/api';
import { getMinHotelPrice } from '../../utils/hotel';
import SimpleCalendar from './components/SimpleCalendar';
import CtripNavBar from './components/CtripNavBar';
import PeoplePanel from './components/PeoplePanel';
import FilterBar from './components/FilterBar';
import DistancePanel from './components/DistancePanel';
import PriceStarFilterPanel from './components/PriceStarFilterPanel';
import SortPanel from './components/SortPanel';
import ActivityBanner from './components/ActivityBanner';
import VirtualHotelList from './components/VirtualHotelList';
import './list.scss';

// 顶部下拉筛选快捷标签（横向滚动）
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
  // 价格从低到高 / 价格从高到低
  { id: 'price_asc', name: '价格从低到高' },
  { id: 'price_desc', name: '价格从高到低' }
];

// 城市选择候选项（与首页保持一致）
const cityOptions = ['上海', '北京', '杭州', '广州', '深圳', '成都', '重庆', '西安', '南京'];

// 价格区间选项
const priceRanges = ['不限', '¥0-¥300', '¥300-¥600', '¥600-¥1000', '¥1000以上'];

// 星级选项
const starOptions = [1, 2, 3, 4, 5];

// 顶部日期展示：2.21 - 2.23
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}.${day}`;
};

// 根据当前价格区间文案判断价格是否命中
const matchPriceRange = (price, range) => {
  if (!range || range === '不限') return true;
  const v = Number(price || 0) || 0;

  switch (range) {
    case '¥0-¥300':
      return v >= 0 && v <= 300;
    case '¥300-¥600':
      return v > 300 && v <= 600;
    case '¥600-¥1000':
      return v > 600 && v <= 1000;
    case '¥1000以上':
      return v > 1000;
    default:
      return true;
  }
};

// 根据已选择的星级数组判断酒店星级是否命中（未选择则不过滤）
const matchStars = (hotel, selectedStars) => {
  if (!selectedStars || selectedStars.length === 0) return true;
  const star = Number(hotel.star || 0);
  return selectedStars.includes(star);
};

// 关键词命中判断：在酒店名称 / 地址 / 城市 / 标签等字段里模糊匹配
const matchKeyword = (hotel, keyword) => {
  if (!keyword) return true;
  const kw = String(keyword).trim().toLowerCase();
  if (!kw) return true;

  const fields = [
    hotel.name,
    hotel.city,
    hotel.address,
    hotel.locationDesc,
    hotel.highlights,
    hotel.rankLabel
  ].filter(Boolean);

  let text = fields.join(' ').toLowerCase();
  if (Array.isArray(hotel.tags)) {
    text += ` ${hotel.tags.join(' ').toLowerCase()}`;
  }

  return text.includes(kw);
};

// 标签筛选命中判断：酒店标签数组中只要包含任意一个已选标签即可
const matchTagFilter = (hotel, selectedTags) => {
  if (!selectedTags || selectedTags.length === 0) return true;
  if (!Array.isArray(hotel.tags) || hotel.tags.length === 0) return false;
  return selectedTags.some((tag) => hotel.tags.includes(tag));
};

// 虚拟列表相关常量：单个酒店卡片高度
const ITEM_HEIGHT = 260; // px
const BASE_VISIBLE_COUNT = 10; // 基础可见条数
const OVERSCAN_COUNT = 4; // 上下缓冲条数

export default function List() {
  const params = Taro.getCurrentInstance().router?.params || {};
  
  const [city, setCity] = useState(decodeURIComponent(params.city || '上海'));
  const [checkInDate, setCheckInDate] = useState(params.checkIn || '');
  const [checkOutDate, setCheckOutDate] = useState(params.checkOut || '');
  const [nightCount, setNightCount] = useState(Number(params.nightCount || 1));
  const [keyword, setKeyword] = useState(
    params.keyword ? decodeURIComponent(params.keyword) : ''
  );
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentSort, setCurrentSort] = useState('price_asc');
  const [selectedTags, setSelectedTags] = useState(
    params.tags ? decodeURIComponent(params.tags).split(',').filter(Boolean) : []
  );
  const [showFilter, setShowFilter] = useState(false);
  const [priceRange, setPriceRange] = useState(
    params.priceRange ? decodeURIComponent(params.priceRange) : '不限'
  );
  const [selectedStars, setSelectedStars] = useState(
    params.stars
      ? params.stars
          .split(',')
          .map((s) => Number(s))
          .filter((n) => !Number.isNaN(n) && n > 0)
      : []
  );
  const [refreshing, setRefreshing] = useState(false);

  // 位置距离筛选
  const [showDistanceFilter, setShowDistanceFilter] = useState(false);
  const [distanceFilter, setDistanceFilter] = useState('不限');

  const [roomCount, setRoomCount] = useState(Number(params.rooms || 1));
  const [adultCount, setAdultCount] = useState(Number(params.adults || 1));
  const [childCount, setChildCount] = useState(Number(params.children || 0));

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [peoplePanelVisible, setPeoplePanelVisible] = useState(false);
  // 关键修改：顶部导航栏滚动时变为半透明
  const [scrolled, setScrolled] = useState(false);
  // 关键修改：价格滑块当前步进值（对应 priceRanges 索引）
  const [priceSliderValue, setPriceSliderValue] = useState(0);
  // 虚拟列表当前可见区间
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  // 修复：不要在渲染过程中直接 setState，同步 priceRange -> 滑块值 使用 useEffect
  useEffect(() => {
    const idx = priceRanges.indexOf(priceRange);
    if (idx >= 0) {
      setPriceSliderValue(idx);
    } else {
      setPriceSliderValue(0);
    }
  }, [priceRange]);

  useEffect(() => {
    fetchHotels(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, currentSort, selectedTags, priceRange, selectedStars, checkInDate, checkOutDate, keyword]);

  // 酒店列表数据变化时，初始化虚拟列表的可见区间
  useEffect(() => {
    const total = hotels.length;
    if (!total) {
      setVisibleRange({ start: 0, end: 0 });
      return;
    }
    const visibleCount = BASE_VISIBLE_COUNT + OVERSCAN_COUNT * 2;
    const end = Math.min(total, visibleCount);
    setVisibleRange((prev) => {
      if (prev.start === 0 && prev.end === end) return prev;
      return { start: 0, end };
    });
  }, [hotels.length]);

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
        keyword,
        tags: selectedTags.join(','),
        priceRange,
        stars: selectedStars.join(','),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        rooms: roomCount,
        adults: adultCount,
        children: childCount
      };
      
      // 这里预留真实后端接口数据结构：
      // 后端可返回 { list: HotelItem[], total: number }，其中 HotelItem 至少包含
      // { _id, name, rating, address, price, star, tags, image, distance }
      const res = await get('/hotels', queryParams);
      const newHotels = (res.list || []).map((hotel) => ({
        ...hotel,
        // displayPrice 始终为该酒店最低价（房型/roomTypes/hotel.price 兜底）
        displayPrice: getMinHotelPrice(hotel),
      }));

      const merged = reset ? newHotels : [...hotels, ...newHotels];
      // 根据当前排序规则对「基础单价（元）」排序
      merged.sort((a, b) => {
        const priceA = a.displayPrice || 0;
        const priceB = b.displayPrice || 0;
        if (currentSort === 'price_desc') {
          return priceB - priceA; // 价格从高到低
        }
        return priceA - priceB; // 默认价格从低到高
      });

      // 前端补充价格区间 & 星级筛选（避免后端暂未实现筛选逻辑时无效果）
      const filteredMerged = merged.filter((hotel) => {
        const priceValue =
          hotel.displayPrice != null && hotel.displayPrice !== undefined
            ? hotel.displayPrice
            : hotel.price || 0;
        return (
          matchPriceRange(priceValue, priceRange) &&
          matchStars(hotel, selectedStars) &&
          matchKeyword(hotel, keyword) &&
          matchTagFilter(hotel, selectedTags)
        );
      });

      setHotels(filteredMerged);
        setPage(currentPage + 1);
      
      setHasMore(newHotels.length >= 10);
    } catch (error) {
      console.error('获取酒店列表失败', error);
      // 使用模拟数据
      const mockData = getMockHotels().map((hotel) => ({
        ...hotel,
        displayPrice: getMinHotelPrice(hotel),
      }));
      const mergedMock = reset ? mockData : [...hotels, ...mockData];
      mergedMock.sort((a, b) => {
        const priceA = a.displayPrice || 0;
        const priceB = b.displayPrice || 0;
        if (currentSort === 'price_desc') {
          return priceB - priceA; // 价格从高到低
        }
        return priceA - priceB; // 默认价格从低到高
      });

      const filteredMergedMock = mergedMock.filter((hotel) => {
        const priceValue =
          hotel.displayPrice != null && hotel.displayPrice !== undefined
            ? hotel.displayPrice
            : hotel.price || 0;
        return (
          matchPriceRange(priceValue, priceRange) &&
          matchStars(hotel, selectedStars) &&
          matchKeyword(hotel, keyword) &&
          matchTagFilter(hotel, selectedTags)
        );
      });

      setHotels(filteredMergedMock);
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
        favoriteCount: 18654,
        price: 2888,
        tags: ['外滩核心区', '豪华型', '江景房'],
        image: 'https://img.zm520.com/hotel1.jpg',
        distance: '0.5km',
        locationDesc: '近外滩·南京路步行街',
        highlights: '270度尽览东方明珠外滩江景',
        rankLabel: '上海豪华酒店榜 No.5',
        activityTag: '春节特惠精选',
        couponText: '门店首单立减200元',
        hasVideo: true,
        isAd: true
      },
      {
        _id: '2',
        name: '上海浦东丽思卡尔顿酒店',
        address: '世纪大道8号',
        city: '上海',
        star: 5,
        rating: 4.8,
        reviewCount: 3245,
        favoriteCount: 13280,
        price: 2588,
        tags: ['近地铁', '豪华型', '浦东新区'],
        image: 'https://img.zm520.com/hotel2.jpg',
        distance: '1.2km',
        locationDesc: '近陆家嘴·东方明珠',
        highlights: '高区景观房可俯瞰黄浦江夜景',
        rankLabel: '浦东江景酒店榜 No.2',
        activityTag: '新春套餐',
        couponText: '限时连住享 9 折',
        hasVideo: false,
        isAd: false
      },
      {
        _id: '3',
        name: '上海静安香格里拉大酒店',
        address: '延安中路1218号',
        city: '上海',
        star: 5,
        rating: 4.7,
        reviewCount: 2156,
        favoriteCount: 9560,
        price: 1988,
        tags: ['静安区', '豪华型', '近地铁'],
        image: 'https://img.zm520.com/hotel3.jpg',
        distance: '2.0km',
        locationDesc: '近南京西路商圈',
        highlights: '连通大型商场，逛街休闲一步到位',
        rankLabel: '静安商务酒店榜 No.3',
        activityTag: '双床房推荐',
        couponText: '门店首单赠欢迎水果',
        hasVideo: false,
        isAd: false
      },
      {
        _id: '4',
        name: '上海金茂君悦大酒店',
        address: '世纪大道88号',
        city: '上海',
        star: 5,
        rating: 4.6,
        reviewCount: 1876,
        favoriteCount: 8421,
        price: 1688,
        tags: ['浦东新区', '豪华型', '江景房'],
        image: 'https://img.zm520.com/hotel4.jpg',
        distance: '1.8km',
        locationDesc: '金茂大厦内，俯瞰陆家嘴夜景',
        highlights: '高空酒吧与无敌江景泳池',
        rankLabel: '陆家嘴打卡酒店榜 No.1',
        activityTag: '外滩核心区推荐',
        couponText: '新用户专享返现',
        hasVideo: true,
        isAd: false
      },
      {
        _id: '5',
        name: '上海虹桥雅居乐万豪酒店',
        address: '虹桥路550号',
        city: '上海',
        star: 5,
        rating: 4.5,
        reviewCount: 1234,
        favoriteCount: 5632,
        price: 1288,
        tags: ['虹桥区', '近机场', '游泳池'],
        image: 'https://img.zm520.com/hotel5.jpg',
        distance: '5.0km',
        locationDesc: '近虹桥机场·国家会展中心',
        highlights: '商务出行首选，免费接机服务',
        rankLabel: '虹桥商务酒店榜 No.4',
        activityTag: '新春特惠',
        couponText: '连住 2 晚送双早',
        hasVideo: false,
        isAd: false
      }
    ];
  };

  const handleHotelClick = useCallback((hotel) => {
    // 兼容后端真实数据（使用 id 字段）和本地模拟数据（使用 _id 字段）
    const id = hotel.id || hotel._id;
    const name = encodeURIComponent(hotel.name || '');
    const cityParam = encodeURIComponent(hotel.city || '');
    const addressParam = encodeURIComponent(hotel.address || '');
    const priceValue =
      hotel.displayPrice != null && hotel.displayPrice !== undefined
        ? hotel.displayPrice
        : hotel.price || 0;

    Taro.navigateTo({
      url: `/pages/detail/detail?id=${id}&name=${name}&city=${cityParam}&address=${addressParam}&price=${priceValue}`
    });
  }, []);

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

  // 关键修改：价格滑块变更时，映射为 priceRanges 中的区间文案
  const handlePriceSliderChange = (e) => {
    const step = e.detail.value;
    const range = priceRanges[step] || '不限';
    setPriceRange(range);
    setPage(1);
  };

  const handlePriceSliderChanging = (e) => {
    setPriceSliderValue(e.detail.value);
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

  // 顶部城市修改
  const handleCityChange = (e) => {
    const index = e.detail.value;
    const newCity = cityOptions[index];
    setCity(newCity);
    setPage(1);
  };

  // 日历组件确认：在本页内直接修改日期
  const handleCalendarConfirm = (start, end, nights) => {
    const startStr = start ? start.toISOString().split('T')[0] : '';
    const endStr = end ? end.toISOString().split('T')[0] : '';
    setCheckInDate(startStr);
    setCheckOutDate(endStr);
    setNightCount(nights || 1);
    setCalendarVisible(false);
    setPage(1);
  };

  // 房间数 / 人数增减
  const changeCount = (type, delta) => {
    if (type === 'room') {
      setRoomCount((v) => Math.max(1, v + delta));
    } else if (type === 'adult') {
      setAdultCount((v) => Math.max(1, v + delta));
    } else if (type === 'child') {
      setChildCount((v) => Math.max(0, v + delta));
    }
    setPage(1);
  };

  // 虚拟列表滚动处理：根据 scrollTop 计算可见区间
  const handleScroll = (e) => {
    const top = e?.detail?.scrollTop || 0;
    setScrolled(top > 0);

    const total = hotels.length;
    if (!total || ITEM_HEIGHT <= 0) return;

    const visibleCount = BASE_VISIBLE_COUNT + OVERSCAN_COUNT * 2;

    let start = Math.floor(top / ITEM_HEIGHT) - OVERSCAN_COUNT;
    start = Math.max(0, start);

    let end = start + visibleCount;
    if (end > total) {
      end = total;
      start = Math.max(0, end - visibleCount);
    }

    setVisibleRange((prev) => {
      if (prev.start === start && prev.end === end) {
        return prev;
      }
      return { start, end };
    });
  };

  // 根据当前可见区间预先计算虚拟列表需要渲染的数据与上下占位高度
  const totalCount = hotels.length;
  const startIndex = visibleRange.start;
  const endIndex = visibleRange.end;
  const clampedStart = Math.max(0, Math.min(startIndex, totalCount));
  const clampedEnd = Math.max(clampedStart, Math.min(endIndex, totalCount));
  const visibleHotels = hotels.slice(clampedStart, clampedEnd);
  const topPaddingHeight = clampedStart * ITEM_HEIGHT;
  const bottomPaddingHeight = Math.max(0, (totalCount - clampedEnd) * ITEM_HEIGHT);

  // 关键修改：是否存在激活中的筛选条件，用于控制“全部清除”按钮显隐
  const hasActiveFilters =
    selectedTags.length > 0 ||
    priceRange !== '不限' ||
    selectedStars.length > 0 ||
    distanceFilter !== '不限';

  // 关键修改：一键清除所有筛选（标签 / 价格 / 星级 / 距离）
  const handleClearAllFilters = () => {
    setSelectedTags([]);
    setPriceRange('不限');
    setSelectedStars([]);
    setDistanceFilter('不限');
    setPage(1);
  };

  // 综合筛选面板：仅重置价格 / 星级，不影响快捷标签与距离
  const handleResetFilterPanel = () => {
    setPriceRange('不限');
    setSelectedStars([]);
    setPage(1);
  };

  const handleBack = () => {
    // 返回上一页；若无上一页时可回到首页
    if (Taro.getCurrentPages().length > 1) {
      Taro.navigateBack();
    } else {
      Taro.switchTab?.({ url: '/pages/index/index' }) ||
        Taro.reLaunch({ url: '/pages/index/index' });
    }
  };

  const handleSearchClick = () => {
    Taro.showToast({
      title: '可在本页直接修改城市、日期和人数',
      icon: 'none'
    });
  };

  const handleMapClick = () => {
    Taro.showToast({
      title: '地图模式开发中',
      icon: 'none'
    });
  };

  const handleMoreClick = () => {
    Taro.showToast({
      title: '更多功能开发中',
      icon: 'none'
    });
  };

  const handleActivityView = () => {
    Taro.showToast({
      title: '为你推荐首住精选酒店',
      icon: 'none'
    });
  };

  const handleToggleSortMenu = () => {
    setShowSortMenu((v) => !v);
    setShowFilter(false);
    setShowDistanceFilter(false);
  };

  const handleToggleDistanceFilter = () => {
    setShowDistanceFilter((v) => !v);
    setShowSortMenu(false);
    setShowFilter(false);
  };

  const handleTogglePriceStarPanel = () => {
    setShowFilter((v) => !v);
    setShowSortMenu(false);
    setShowDistanceFilter(false);
  };

  const handleToggleFilterPanel = () => {
    setShowFilter((v) => !v);
    setShowSortMenu(false);
    setShowDistanceFilter(false);
  };

  return (
    <View className="list-page">
      {/* 顶部携程风格导航栏：返回 + 城市/日期/人数摘要 + 搜索/地图/更多 */}
      <CtripNavBar
        scrolled={scrolled}
        city={city}
        cityOptions={cityOptions}
        onCityChange={handleCityChange}
        dateText={
          checkInDate && checkOutDate
            ? `${formatDateDisplay(checkInDate)} - ${formatDateDisplay(checkOutDate)}`
            : '选择日期'
        }
        onOpenCalendar={() => setCalendarVisible(true)}
        roomText={`${roomCount}间 ${adultCount}成人${childCount > 0 ? ` ${childCount}儿童` : ''}`}
        onTogglePeoplePanel={() => setPeoplePanelVisible((v) => !v)}
        onBack={handleBack}
        onSearch={handleSearchClick}
        onMap={handleMapClick}
        onMore={handleMoreClick}
      />

      {/* 房间数 / 人数调节面板（本页修改人数） */}
      <PeoplePanel
        visible={peoplePanelVisible}
        roomCount={roomCount}
        adultCount={adultCount}
        childCount={childCount}
        onChangeCount={changeCount}
        onClose={() => setPeoplePanelVisible(false)}
      />

      {/* 携程风格筛选栏：欢迎度排序 / 位置距离 / 价格星级 / 筛选 */}
      <FilterBar
        showSortMenu={showSortMenu}
        showDistanceFilter={showDistanceFilter}
        distanceFilter={distanceFilter}
        showFilter={showFilter}
        priceRange={priceRange}
        selectedStars={selectedStars}
        selectedTags={selectedTags}
        filterTags={filterTags}
        hasActiveFilters={hasActiveFilters}
        onToggleSort={handleToggleSortMenu}
        onToggleDistance={handleToggleDistanceFilter}
        onTogglePriceStar={handleTogglePriceStarPanel}
        onToggleFilter={handleToggleFilterPanel}
        onTagClick={handleTagClick}
        onClearAll={handleClearAllFilters}
      />

      {/* 位置距离筛选面板（示例：只做前端筛选文案展示，可与后端联动） */}
      <DistancePanel
        visible={showDistanceFilter}
        distanceFilter={distanceFilter}
        onSelect={(item) => setDistanceFilter(item)}
      />

      {/* 价格 / 星级等综合筛选面板 */}
      <PriceStarFilterPanel
        visible={showFilter}
        priceRanges={priceRanges}
        priceSliderValue={priceSliderValue}
        onPriceChange={handlePriceSliderChange}
        onPriceChanging={handlePriceSliderChanging}
        starOptions={starOptions}
        selectedStars={selectedStars}
        onToggleStar={toggleStar}
        onReset={handleResetFilterPanel}
        onDone={() => setShowFilter(false)}
      />

      {/* 欢迎度排序下拉面板 */}
      <SortPanel
        visible={showSortMenu}
        sortOptions={sortOptions}
        currentSort={currentSort}
        onSelect={handleSortChange}
      />

      {/* 首住好礼活动横幅 */}
      <ActivityBanner onView={handleActivityView} />

      {/* 酒店列表：支持上滑自动加载更多 + 虚拟列表渲染 */}
      <VirtualHotelList
        loading={loading}
        totalCount={totalCount}
        topPaddingHeight={topPaddingHeight}
        bottomPaddingHeight={bottomPaddingHeight}
        visibleHotels={visibleHotels}
        clampedStart={clampedStart}
        city={city}
        onHotelClick={handleHotelClick}
        hasMore={hasMore}
        refreshing={refreshing}
        onLoadMore={handleLoadMore}
        onRefresh={handleRefresh}
        onScroll={handleScroll}
      />

      {/* 入住/离店日历弹层（本页内修改日期） */}
      <SimpleCalendar
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onConfirm={handleCalendarConfirm}
        defaultStartDate={checkInDate ? new Date(checkInDate) : null}
        defaultEndDate={checkOutDate ? new Date(checkOutDate) : null}
      />
    </View>
  );
}
