// 关键修改：引入 Slider 用于价格滑块组件
import { View, Text, ScrollView, Image, Picker, Slider } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { get } from '../../utils/api';
import RCImage from '../../assets/R-C.jpg';
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

// 将评分映射为中文评价文案（如：4.7 => 超棒）
const getScoreText = (rating) => {
  if (!rating && rating !== 0) return '';
  if (rating >= 4.8) return '超棒';
  if (rating >= 4.5) return '很好';
  if (rating >= 4.0) return '不错';
  return '一般';
};

// 将收藏数格式化为「1.8万」风格
const formatFavoriteCount = (num) => {
  if (!num && num !== 0) return '';
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return `${num}`;
};

// 计算酒店在房型与价格信息中的「基础单价（元）」最小值
// 后端 Hotel 数据中 roomTypes 结构参考后台管理的 HotelForm：
// roomTypes: [{ name, basePrice, bedType, maxOccupancy, remainingRooms, description }, ...]
// 这里做兼容：roomTypes 可能为 JSON 字符串或数组；如果没有有效房型价格，则回退到 hotel.price
const getMinBasePrice = (hotel) => {
  if (!hotel) return 0;

  const fallback = Number(hotel.price || 0) || 0;
  let roomTypes = hotel.roomTypes;

  if (!roomTypes) {
    return fallback;
  }

  try {
    const parsed =
      typeof roomTypes === 'string' ? JSON.parse(roomTypes) : roomTypes;
    const list = Array.isArray(parsed) ? parsed : [];

    const prices = list
      .map((room) => {
        if (!room || room.basePrice === null || room.basePrice === undefined) {
          return NaN;
        }
        const v = Number(room.basePrice);
        return Number.isNaN(v) || v < 0 ? NaN : v;
      })
      .filter((v) => !Number.isNaN(v));

    if (prices.length === 0) {
      return fallback;
    }

    return Math.min(...prices);
  } catch (e) {
    return fallback;
  }
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

/**
 * 简易日历组件（与首页复用的逻辑，实现本页内修改日期）
 */
function SimpleCalendar(props) {
  const {
    visible,
    onClose,
    onConfirm,
    defaultStartDate,
    defaultEndDate,
    daysCount = 60
  } = props;

  const [startDate, setStartDate] = useState(defaultStartDate || null);
  const [endDate, setEndDate] = useState(defaultEndDate || null);

  useEffect(() => {
    setStartDate(defaultStartDate || null);
    setEndDate(defaultEndDate || null);
  }, [defaultStartDate, defaultEndDate]);

  if (!visible) return null;

  const generateDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const date = d.getDate();

      days.push({
        date: d,
        key: `${year}-${month}-${date}`,
        year,
        month,
        day: date,
        weekDay: d.getDay()
      });
    }
    return days;
  };

  const days = generateDays();

  const calcNights = (start, end) => {
    if (!start || !end) return 0;
    const ts1 = new Date(start).setHours(0, 0, 0, 0);
    const ts2 = new Date(end).setHours(0, 0, 0, 0);
    const diff = ts2 - ts1;
    if (diff <= 0) return 0;
    return diff / (24 * 60 * 60 * 1000);
  };

  const nights = calcNights(startDate, endDate);

  const handleDayClick = (dayObj) => {
    const clickedDate = dayObj.date;

    if (!startDate || (startDate && endDate)) {
      setStartDate(clickedDate);
      setEndDate(null);
      return;
    }

    if (startDate && !endDate) {
      const startTs = new Date(startDate).setHours(0, 0, 0, 0);
      const clickedTs = new Date(clickedDate).setHours(0, 0, 0, 0);

      if (clickedTs < startTs) {
        setEndDate(startDate);
        setStartDate(clickedDate);
      } else if (clickedTs === startTs) {
        setEndDate(null);
      } else {
        setEndDate(clickedDate);
      }
    }
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isInRange = (date) => {
    if (!startDate || !endDate) return false;
    const ts = date.getTime();
    const s = startDate.getTime();
    const e = endDate.getTime();
    return ts > s && ts < e;
  };

  const handleConfirm = () => {
    if (!startDate || !endDate) {
      Taro.showToast({
        title: '请选择完整的入住和离店日期',
        icon: 'none'
      });
      return;
    }
    onConfirm && onConfirm(startDate, endDate, nights);
  };

  const formatLabel = (d) => {
    if (!d) return '';
    const month = d.getMonth() + 1;
    const date = d.getDate();
    return `${month}月${date}日`;
  };

  const getDayTag = (d) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tsToday = today.getTime();
    const ts = d.getTime();
    const diff = (ts - tsToday) / (24 * 60 * 60 * 1000);
    if (diff === 0) return '今天';
    if (diff === 1) return '明天';
    if (diff === 2) return '后天';
    return '';
  };

  return (
    <View className="calendar-mask" catchMove onClick={onClose}>
      <View
        className="calendar-container"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <View className="calendar-header">
          <Text className="calendar-title">选择入住/离店日期</Text>
          <Text className="calendar-subtitle">
            {startDate && !endDate && '请选择离店日期'}
            {startDate && endDate && `共${nights}晚`}
            {!startDate && !endDate && '请选择入住日期'}
          </Text>
        </View>

        <View className="calendar-week-row">
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
            <View key={w} className="calendar-week-cell">
              <Text>{w}</Text>
            </View>
          ))}
        </View>

        <View className="calendar-days">
          {days.map((d) => {
            const isStart = isSameDay(d.date, startDate);
            const isEnd = isSameDay(d.date, endDate);
            const inRange = isInRange(d.date);
            const tag = getDayTag(d.date);

            let cellClass = 'calendar-day-cell';
            if (isStart || isEnd) {
              cellClass += ' calendar-day-selected';
            } else if (inRange) {
              cellClass += ' calendar-day-inrange';
            }

            return (
              <View
                key={d.key}
                className={cellClass}
                onClick={() => handleDayClick(d)}
              >
                <Text className="calendar-day-number">{d.day}</Text>
                {!!tag && <Text className="calendar-day-tag">{tag}</Text>}
              </View>
            );
          })}
        </View>

        <View className="calendar-footer">
          <View className="calendar-footer-left">
            <Text className="calendar-footer-text">
              {startDate && endDate
                ? `${formatLabel(startDate)} - ${formatLabel(endDate)} 共${nights}晚`
                : '请选择入住和离店日期'}
            </Text>
          </View>
          <View className="calendar-footer-actions">
            <View className="calendar-btn calendar-btn-cancel" onClick={onClose}>
              <Text>取消</Text>
            </View>
            <View className="calendar-btn calendar-btn-ok" onClick={handleConfirm}>
              <Text>确定</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function List() {
  const params = Taro.getCurrentInstance().router?.params || {};

  const [city, setCity] = useState(decodeURIComponent(params.city || '上海'));
  const [checkInDate, setCheckInDate] = useState(params.checkIn || '');
  const [checkOutDate, setCheckOutDate] = useState(params.checkOut || '');
  const [nightCount, setNightCount] = useState(Number(params.nightCount || 1));
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

  // 位置距离筛选（演示用，可与后端字段联动）
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
        // displayPrice 始终为该酒店所有房型基础单价中的最小值（若无房型则回退到 hotel.price）
        displayPrice: getMinBasePrice(hotel),
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
          matchStars(hotel, selectedStars)
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
        displayPrice: getMinBasePrice(hotel),
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
          matchStars(hotel, selectedStars)
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

  const handleHotelClick = (hotel) => {
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

  return (
    <View className="list-page">
      {/* 顶部携程风格导航栏：返回 + 城市/日期/人数摘要 + 搜索/地图/更多 */}
      <View className={scrolled ? 'ctrip-nav-bar nav-scrolled' : 'ctrip-nav-bar'}>
        <View
          className="nav-left"
          onClick={() => {
            // 返回上一页；若无上一页时可回到首页
            if (Taro.getCurrentPages().length > 1) {
              Taro.navigateBack();
            } else {
              Taro.switchTab?.({ url: '/pages/index/index' }) ||
                Taro.reLaunch({ url: '/pages/index/index' });
            }
          }}
        >
          <Text className="nav-back-icon">‹</Text>
        </View>

        <View className="nav-center">
          <View className="nav-main-line">
            <Picker
              mode="selector"
              range={cityOptions}
              onChange={handleCityChange}
            >
              <Text className="nav-city">{city}</Text>
            </Picker>
            <Text
              className="nav-date"
              onClick={(e) => {
                e.stopPropagation();
                setCalendarVisible(true);
              }}
            >
              {checkInDate && checkOutDate
                ? `${formatDateDisplay(checkInDate)} - ${formatDateDisplay(checkOutDate)}`
                : '选择日期'}
            </Text>
          </View>
          <View className="nav-sub-line">
            <Text
              className="nav-room-info"
              onClick={() => setPeoplePanelVisible((v) => !v)}
            >
              {roomCount}间 {adultCount}成人
              {childCount > 0 ? ` ${childCount}儿童` : ''}
            </Text>
          </View>
        </View>

        <View className="nav-right">
          {/* 搜索入口：实际逻辑依旧跳回条件编辑页 */}
          <View
            className="nav-icon-btn"
            onClick={() => {
              Taro.showToast({
                title: '可在本页直接修改城市、日期和人数',
                icon: 'none'
              });
            }}
          >
            <Text className="nav-icon">🔍</Text>
          </View>
          {/* 地图入口（预留，可根据项目接地图页） */}
          <View
            className="nav-icon-btn"
            onClick={() => {
              Taro.showToast({
                title: '地图模式开发中',
                icon: 'none'
              });
            }}
          >
            <Text className="nav-icon">🗺</Text>
          </View>
          {/* 更多操作入口（预留） */}
          <View
            className="nav-icon-btn"
            onClick={() => {
              Taro.showToast({
                title: '更多功能开发中',
                icon: 'none'
              });
            }}
          >
            <Text className="nav-icon">⋮</Text>
          </View>
        </View>
      </View>

      {/* 房间数 / 人数调节面板（本页修改人数） */}
      {peoplePanelVisible && (
        <View className="people-panel">
          {[
            { key: 'room', label: '房间数', value: roomCount, min: 1 },
            { key: 'adult', label: '成人', value: adultCount, min: 1 },
            { key: 'child', label: '儿童', value: childCount, min: 0 }
          ].map((item) => (
            <View key={item.key} className="people-row">
              <Text className="people-label">{item.label}</Text>
              <View className="people-counter">
                <View
                  className={
                    item.value <= item.min
                      ? 'counter-btn counter-btn-disabled'
                      : 'counter-btn'
                  }
                  onClick={() => {
                    if (item.value <= item.min) return;
                    changeCount(item.key, -1);
                  }}
                >
                  <Text>-</Text>
                </View>
                <Text className="counter-value">{item.value}</Text>
                <View
                  className="counter-btn"
                  onClick={() => {
                    changeCount(item.key, 1);
                  }}
                >
                  <Text>+</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 携程风格筛选栏：欢迎度排序 / 位置距离 / 价格星级 / 筛选 */}
      <View className="ctrip-filter-bar">
        <View className="filter-tabs">
          <View
            className={`filter-tab-item ${showSortMenu ? 'active' : ''}`}
            onClick={() => {
              setShowSortMenu((v) => !v);
              setShowFilter(false);
              setShowDistanceFilter(false);
            }}
          >
            <Text className="filter-tab-text">欢迎度排序</Text>
          </View>
          <View
            className={`filter-tab-item ${showDistanceFilter || distanceFilter !== '不限' ? 'active' : ''}`}
            onClick={() => {
              setShowDistanceFilter((v) => !v);
              setShowSortMenu(false);
              setShowFilter(false);
            }}
          >
            <Text className="filter-tab-text">位置距离</Text>
          </View>
          <View
            className={`filter-tab-item ${showFilter && (priceRange !== '不限' || selectedStars.length > 0) ? 'active' : ''}`}
            onClick={() => {
              setShowFilter((v) => !v);
              setShowSortMenu(false);
              setShowDistanceFilter(false);
            }}
          >
            <Text className="filter-tab-text">价格/星级</Text>
          </View>
          <View
            className={`filter-tab-item ${showFilter ? 'active' : ''}`}
            onClick={() => {
              setShowFilter((v) => !v);
              setShowSortMenu(false);
              setShowDistanceFilter(false);
            }}
          >
            <Text className="filter-tab-text">筛选</Text>
          </View>
        </View>

        {/* 横向滚动快捷标签，如外滩核心区、新春套餐等 */}
        <View className="quick-tag-bar-row">
          <ScrollView className="quick-tag-scroll" scrollX>
            {filterTags.map((tag) => (
              <View
                key={tag.id}
                className={`quick-tag ${selectedTags.includes(tag.name) ? 'active' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                <Text className="quick-tag-text">{tag.name}</Text>
              </View>
            ))}
          </ScrollView>
          <View
            className={`clear-all-btn ${hasActiveFilters ? 'visible' : ''}`}
            onClick={hasActiveFilters ? handleClearAllFilters : undefined}
          >
            <Text className="clear-all-text">全部清除</Text>
          </View>
        </View>
      </View>

      {/* 位置距离筛选面板（示例：只做前端筛选文案展示，可与后端联动） */}
      {showDistanceFilter && (
        <View className="panel panel-distance">
          <View className="panel-title-row">
            <Text className="panel-title">位置距离</Text>
          </View>
          <View className="panel-tags">
            {['不限', '距离优先', '1km 内', '3km 内', '5km 内'].map((item) => (
              <View
                key={item}
                className={`panel-tag ${distanceFilter === item ? 'active' : ''}`}
                onClick={() => setDistanceFilter(item)}
              >
                <Text>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 价格 / 星级等综合筛选面板 */}
      {showFilter && (
        <View className="panel panel-filter">
          <View className="filter-block">
            <Text className="filter-title">价格区间（每晚）</Text>
            {/* 关键修改：价格区间改为滑块组件 + 下方刻度文案 */}
            <View className="price-slider-row">
              <Slider
                className="price-slider"
                min={0}
                max={priceRanges.length - 1}
                step={1}
                value={priceSliderValue}
                activeColor="#1677ff"
                backgroundColor="#e5e5e5"
                blockSize={16}
                showValue={false}
                onChange={handlePriceSliderChange}
                onChanging={handlePriceSliderChanging}
              />
              <View className="price-slider-labels">
                {priceRanges.map((range, index) => (
                  <Text
                    key={range}
                    className={`price-slider-label ${index === priceSliderValue ? 'active' : ''}`}
                  >
                    {range}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          <View className="filter-block">
            <Text className="filter-title">酒店星级</Text>
            {/* 关键修改：星级筛选改为复选框视觉样式 */}
            <View className="filter-options">
              {starOptions.map((star) => {
                const checked = selectedStars.includes(star);
                return (
                  <View
                    key={star}
                    className={`filter-option ${checked ? 'checked' : ''}`}
                    onClick={() => toggleStar(star)}
                  >
                    <View className="checkbox">
                      <View className="checkbox-inner" />
                    </View>
                    <Text className="filter-option-label">{star}星</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* 欢迎度排序下拉面板 */}
      {showSortMenu && (
        <View className="panel panel-sort">
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

      {/* 首住好礼活动横幅 */}
      <View className="activity-banner">
        <View className="activity-left">
          <View className="activity-tag">
            <Text>首住好礼</Text>
          </View>
          <Text className="activity-text">首住特惠 85折起</Text>
        </View>
        <View className="activity-right">
          <View
            className="activity-btn"
            onClick={() => {
              Taro.showToast({
                title: '为你推荐首住精选酒店',
                icon: 'none'
              });
            }}
          >
            <Text>查看</Text>
          </View>
        </View>
      </View>

      {/* 酒店列表：支持上滑自动加载更多 */}
      <ScrollView 
        className="hotel-list" 
        scrollY 
        onScrollToLower={handleLoadMore}
        onRefresherRefresh={handleRefresh}
        refresherEnabled={true}
        refresherTriggered={refreshing}
        // 关键修改：监听页面滚动，控制顶部栏半透明状态
        onScroll={(e) => {
          const top = e?.detail?.scrollTop || 0;
          setScrolled(top > 0);
        }}
      >
        {loading && hotels.length === 0 ? (
          <View className="loading">
            <Text>加载中...</Text>
          </View>
        ) : hotels.length > 0 ? (
          hotels.map((hotel, index) => (
              <View
                key={hotel._id || hotel.id || `${hotel.name || 'hotel'}-${index}`}
                className="hotel-item"
                onClick={() => handleHotelClick(hotel)}
              >
              {/* 左侧：酒店主图 + 视频按钮 + 活动标签 */}
              <View className="hotel-image">
                <Image
                  src={RCImage}
                  className="hotel-image-real"
                  mode="aspectFill"
                />

                {/* 视频播放按钮（示意） */}
                {hotel.hasVideo && (
                  <View className="video-badge">
                    <Text className="video-icon">▶</Text>
                  </View>
                )}

                {/* 左下角活动标签，如「春节特惠精选」 */}
                {hotel.activityTag && (
                  <View className="image-activity-tag">
                    <Text>{hotel.activityTag}</Text>
                  </View>
                )}
              </View>

              {/* 右侧：酒店名称、评分、位置、亮点、标签、榜单、价格信息 */}
              <View className="hotel-content">
                <View className="hotel-title-row">
                  {hotel.isAd && <Text className="ad-badge">广告</Text>}
                  <Text className="hotel-name">{hotel.name}</Text>
                </View>

                <View className="hotel-rating-row">
                  <View className="score-box">
                    <Text className="score-value">
                      {hotel.rating ? hotel.rating.toFixed(1) : '--'}
                    </Text>
                    <Text className="score-text">{getScoreText(hotel.rating)}</Text>
                  </View>
                  {hotel.reviewCount ? (
                    <Text className="review-text">{hotel.reviewCount}条点评</Text>
                  ) : null}
                  {typeof hotel.favoriteCount === 'number' && (
                    <Text className="favorite-text">
                      {formatFavoriteCount(hotel.favoriteCount)}人收藏
                    </Text>
                  )}
                </View>

                <View className="hotel-location-row">
                  <Text className="location-text">
                    {hotel.locationDesc ||
                      (hotel.address ? `近${city}·${hotel.address}` : city)}
                  </Text>
                </View>

                {hotel.highlights && (
                  <View className="hotel-highlights-row">
                    <Text className="highlights-text">{hotel.highlights}</Text>
                  </View>
                )}

                <View className="hotel-tags-row">
                  {hotel.tags &&
                    hotel.tags.map((tag, index) => (
                      <View key={index} className="tag">
                        <Text>{tag}</Text>
                      </View>
                    ))}
                  {hotel.rankLabel && (
                    <View className="rank-tag">
                      <Text>{hotel.rankLabel}</Text>
                    </View>
                  )}
                </View>

                <View className="hotel-price-row">
                  <View className="hotel-price-main">
                    <Text className="price-symbol">¥</Text>
                    <Text className="price-value">
                      {hotel.displayPrice != null && hotel.displayPrice !== undefined
                        ? hotel.displayPrice
                        : hotel.price}
                    </Text>
                    <Text className="price-unit">起</Text>
                  </View>
                  {hotel.couponText && (
                    <View className="price-extra">
                      <Text className="coupon-text">{hotel.couponText}</Text>
                    </View>
                  )}
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
