import { View, Text, ScrollView, Image, Swiper, SwiperItem } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { get } from '../../utils/api';
import { getScoreText, calcNights, getMinHotelPrice } from '../../utils/hotel';
import BEDImg from '../../assets/BED.jpg';
import ININImg from '../../assets/Hotel2.jpg';
import './detail.scss';

// 顶部标签栏配置（对齐携程：封面、亮点、精选、点评、位置、相册）
const topTabs = [
  { id: 'cover', name: '封面', anchor: 'section-cover' },
  { id: 'highlight', name: '亮点', anchor: 'section-highlight' },
  { id: 'selected', name: '精选', anchor: 'section-selected' },
  { id: 'review', name: '点评', anchor: 'section-review' },
  { id: 'map', name: '位置', anchor: 'section-map' },
  { id: 'album', name: '相册', anchor: 'section-album' }
];

// 详情页内的简易日历组件（与首页/列表页交互保持一致）
function DetailCalendar(props) {
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
    const n = calcNights(startDate, endDate) || 1;
    onConfirm && onConfirm(startDate, endDate, n);
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

export default function Detail() {
  const routerParams = Taro.getCurrentInstance().router?.params || {};
  const {
    id,
    name: nameParam,
    city: cityParam,
    address: addressParam,
    price: priceParam
  } = routerParams;

  const initialHotel = (() => {
    const base = {};
    if (id) base._id = id;
    if (nameParam) base.name = decodeURIComponent(nameParam);
    if (cityParam) base.city = decodeURIComponent(cityParam);
    if (addressParam) base.address = decodeURIComponent(addressParam);
    if (priceParam) {
      const p = Number(priceParam);
      if (!Number.isNaN(p)) {
        base.price = p;
      }
    }
    return Object.keys(base).length ? base : null;
  })();

  const [hotel, setHotel] = useState(initialHotel);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cover');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 入住/离店日期与人数信息
  const [checkInDate, setCheckInDate] = useState(null); // Date
  const [checkOutDate, setCheckOutDate] = useState(null); // Date
  const [nightCount, setNightCount] = useState(1);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [roomCount, setRoomCount] = useState(1);
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [peoplePanelVisible, setPeoplePanelVisible] = useState(false);

  // 房型筛选快捷标签
  const quickTags = ['双床房', '江河景房', '含早餐', '大床房', '亲子房', '高楼层'];
  const [selectedQuickTags, setSelectedQuickTags] = useState([]);
  const [roomFilterVisible, setRoomFilterVisible] = useState(false);

  // ScrollView anchor
  const [scrollIntoView, setScrollIntoView] = useState('');

  // 顶部 banner 使用本地 ININ 示意图
  const bannerImages = [ININImg];

  useEffect(() => {
    fetchHotelDetail();
  }, [id]);

  const fetchHotelDetail = async () => {
    const sortRoomsByPrice = (roomList) => {
      if (!Array.isArray(roomList)) return [];
      return [...roomList].sort((a, b) => {
        const pa = Number(a?.price || 0);
        const pb = Number(b?.price || 0);
        return pa - pb;
      });
    };

    // 当后端暂未配置真实房型（rooms / roomTypes 都为空）时，
    // 使用酒店基础价格生成 2 个示意房型，保证「为您推荐」区域不会完全空白
      const buildFallbackRooms = (hotelData) => {
        const basePrice = getMinHotelPrice(hotelData, []);
      const base = Number(basePrice || hotelData.price || 0) || 0;
      // 兜底房型图片也统一用 BED 示意图
      const img = (hotelData.images && hotelData.images[0]) || BEDImg;

      const room1Price = base;
      const room2Price = base > 0 ? base + 300 : base;

      return [
        {
          _id: 'mock-1',
          name: '高级大床房',
          area: '约35㎡',
          floor: '高楼层',
          maxGuests: 2,
          bedType: '大床',
          price: room1Price,
          amenities: ['双人早餐', '免费WiFi', '延迟退房'],
          image: img
        },
        {
          _id: 'mock-2',
          name: '豪华大床房',
          area: '约40㎡',
          floor: '高楼层',
          maxGuests: 2,
          bedType: '大床',
          price: room2Price,
          amenities: ['江景房', '双早', '免费停车'],
          image: img
        }
      ];
    };

    setLoading(true);
    try {
      const res = await get(`/hotels/${id}`);
      const hotelData = res || {};
      setHotel(hotelData);

      // 支持后端直接返回 rooms 数组，或使用 roomTypes 字段构造房型列表
      // 注意：只有当 rooms 为「非空数组」时才优先使用 rooms；否则回退到 roomTypes，避免 rooms: [] 覆盖掉有数据的 roomTypes
      if (Array.isArray(hotelData.rooms) && hotelData.rooms.length > 0) {
        const mappedRooms = hotelData.rooms.map((r, idx) => {
          // 兼容不同字段命名与存储格式（rooms 表 / 历史脚本）
          let amenities = [];
          if (Array.isArray(r.amenities)) {
            amenities = r.amenities;
          } else if (Array.isArray(r.facilities)) {
            amenities = r.facilities;
          } else if (typeof r.facilities === 'string') {
            try {
              const parsed = JSON.parse(r.facilities);
              if (Array.isArray(parsed)) amenities = parsed;
            } catch (e) {}
          }

          let image = r.image;
          if (!image) {
            if (Array.isArray(r.images) && r.images.length > 0) {
              image = r.images[0];
            } else if (typeof r.images === 'string') {
              try {
                const parsedImg = JSON.parse(r.images);
                if (Array.isArray(parsedImg) && parsedImg.length > 0) {
                  image = parsedImg[0];
                }
              } catch (e) {}
            } else if (hotelData.images && hotelData.images[0]) {
              image = hotelData.images[0];
            }
          }

          return {
            _id: r._id || r.id || `room-${idx}`,
            name: r.name || r.type || '标准房型',
            area: r.area || '',
            floor: r.floor || '',
            maxGuests: r.maxGuests || r.capacity || r.maxOccupancy || 2,
            bedType: r.bedType || '大床/双床',
            price: r.price || 0,
            amenities,
            image
          };
        });

        setRooms(sortRoomsByPrice(mappedRooms));
      } else if (hotelData.roomTypes) {
        try {
          const parsed =
            typeof hotelData.roomTypes === 'string'
              ? JSON.parse(hotelData.roomTypes)
              : hotelData.roomTypes;
          const list = Array.isArray(parsed) ? parsed : [];
          const mapped = list.map((r, idx) => ({
            _id: r._id || `rt-${idx}`,
            name: r.name || '标准房型',
            area: r.area || (r.roomArea ? `${r.roomArea}㎡` : ''),
            floor: r.floor || r.floorRange || '',
            maxGuests: r.maxOccupancy || r.maxGuests || 2,
            bedType: r.bedType || '大床/双床',
            price: r.basePrice || r.price || hotelData.price || 0,
            amenities: r.amenities || r.tags || [],
            image: r.image || (hotelData.images && hotelData.images[0])
          }));
          setRooms(sortRoomsByPrice(mapped));
        } catch (e) {
          setRooms(sortRoomsByPrice(buildFallbackRooms(hotelData)));
        }
      } else {
        setRooms(sortRoomsByPrice(buildFallbackRooms(hotelData)));
      }
    } catch (error) {
      console.error('获取酒店详情失败', error);
      // 请求失败时保留路由参数中带过来的酒店基础信息（名称/城市/地址/价格），不再强行覆写为固定模拟数据
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
    Taro.navigateBack();
  };

  const handleImageChange = (e) => {
    setCurrentImageIndex(e.detail.current);
  };

  const handleImagePreview = (index) => {
    const images = bannerImages;
    Taro.previewImage({
      current: images[index] || images[0],
      urls: images
    });
  };

  const handleAskHotel = () => {
    Taro.showToast({
      title: '可在后续对接 IM / 电话咨询功能',
      icon: 'none'
    });
  };

  const handleViewRooms = () => {
    setActiveTab('selected');
    setShowAllRooms(true);
    setScrollIntoView('section-selected');
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const displayedRooms = showAllRooms ? rooms : rooms.slice(0, 2);
  const minPrice = getMinHotelPrice(hotel, rooms);

  // 日期展示文案：2月22日 今天
  const formatDateLabel = (d) => {
    if (!d) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tTs = today.getTime();
    const dCopy = new Date(d);
    dCopy.setHours(0, 0, 0, 0);
    const dTs = dCopy.getTime();
    const diffDays = (dTs - tTs) / (24 * 60 * 60 * 1000);
    const month = dCopy.getMonth() + 1;
    const date = dCopy.getDate();

    let suffix = '';
    if (diffDays === 0) suffix = ' 今天';
    else if (diffDays === 1) suffix = ' 明天';
    else if (diffDays === 2) suffix = ' 后天';

    return `${month}月${date}日${suffix}`;
  };

  const nights = calcNights(checkInDate, checkOutDate) || nightCount || 1;

  const handleCalendarConfirm = (start, end, n) => {
    setCheckInDate(start);
    setCheckOutDate(end);
    setNightCount(n || 1);
    setCalendarVisible(false);
  };

  const changeCount = (type, delta) => {
    if (type === 'room') {
      setRoomCount((v) => Math.max(1, v + delta));
    } else if (type === 'adult') {
      setAdultCount((v) => Math.max(1, v + delta));
    } else if (type === 'child') {
      setChildCount((v) => Math.max(0, v + delta));
    }
  };

  const toggleQuickTag = (tag) => {
    setSelectedQuickTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      return [...prev, tag];
    });
  };

  const handleTopTabClick = (tab) => {
    setActiveTab(tab.id);
    if (tab.anchor) {
      setScrollIntoView(tab.anchor);
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
      <ScrollView
        className="detail-scroll"
        scrollY
        refresherEnabled={true}
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
        scrollIntoView={scrollIntoView}
      >
        {/* 顶部 Banner 区域（封面 + 顶部操作 + 标签栏） */}
        <View className="banner-wrapper" id="section-cover">
          <Swiper
            className="banner-swiper"
            circular
            autoplay={{ interval: 3000 }}
            duration={500}
            onChange={handleImageChange}
          >
            {bannerImages.map((image, index) => (
              <SwiperItem key={index}>
                <View
                  className="banner-item"
                  onClick={() => handleImagePreview(index)}
                >
                  <View
                    className="banner-image"
                    style={{ backgroundImage: `url(${image})` }}
                  />
                  {/* 视频播放按钮（预留交互） */}
                  {index === 0 && (
                    <View className="banner-play-btn">
                      <Text className="play-icon">▶</Text>
                    </View>
                  )}
                </View>
              </SwiperItem>
            ))}
          </Swiper>

          {/* 顶部返回 + 收藏/分享/购物车/更多 */}
          <View className="banner-nav">
            <View className="nav-left-btn" onClick={handleBack}>
              <Text>‹</Text>
            </View>
            <View className="nav-right-group">
              <View
                className="nav-icon-btn"
                onClick={() =>
                  Taro.showToast({ title: '已收藏（示例）', icon: 'none' })
                }
              >
                <Text>☆</Text>
              </View>
              <View
                className="nav-icon-btn"
                onClick={() =>
                  Taro.showShareMenu?.() ||
                  Taro.showToast({ title: '分享功能开发中', icon: 'none' })
                }
              >
                <Text>⇪</Text>
              </View>
              <View
                className="nav-icon-btn"
                onClick={() =>
                  Taro.showToast({ title: '购物车功能开发中', icon: 'none' })
                }
              >
                <Text>🛒</Text>
              </View>
              <View
                className="nav-icon-btn"
                onClick={() =>
                  Taro.showToast({ title: '更多功能开发中', icon: 'none' })
                }
              >
                <Text>⋯</Text>
              </View>
            </View>
          </View>

          {/* 图片计数 */}
          <View className="banner-counter">
            <Text>
              {currentImageIndex + 1}/{bannerImages.length}
            </Text>
          </View>

          {/* 顶部标签栏：封面 / 亮点 / 精选 / 点评 / 位置 / 相册 */}
          <View className="banner-tabs">
            {topTabs.map((tab) => (
              <View
                key={tab.id}
                className={`banner-tab ${
                  activeTab === tab.id ? 'active' : ''
                }`}
                onClick={() => handleTopTabClick(tab)}
              >
                <Text>{tab.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 酒店基本信息（名称 / 星级菱形 / 装修年份 / 榜单标签） */}
        <View className="hotel-base" id="section-highlight">
          <View className="base-header">
            <View className="base-title">
              <Text className="hotel-name">{hotel.name}</Text>
              <View className="hotel-tags-line">
                <View className="star-diamond-wrap">
                  {Array.from({ length: hotel.star || 0 }).map((_, i) => (
                    <Text key={i} className="star-diamond">
                      ◆
                    </Text>
                  ))}
                </View>
                {hotel.openDate && (
                  <Text className="open-year">
                    {new Date(hotel.openDate).getFullYear()}年装修
                  </Text>
                )}
                {hotel.rankLabel && (
                  <View className="rank-badge">
                    <Text>{hotel.rankLabel}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* 评分区：4.7 超棒 / 点评数 / 摘要 */}
          <View className="base-rating">
            <View className="rating-box">
              <Text className="rating-score">
                {hotel.rating ? hotel.rating.toFixed(1) : '--'}
              </Text>
              <Text className="rating-label">
                {getScoreText(hotel.rating)} · 携程用户评分
              </Text>
            </View>
            <View className="divider" />
            <View className="review-box">
              <Text className="review-count">
                {hotel.reviewCount || 0}条点评
              </Text>
              <Text className="review-rate">98%用户推荐（示意）</Text>
            </View>
          </View>

          {/* 酒店亮点图标区（设计师酒店、艺术氛围等，可从 facilities 衍生） */}
          <View className="base-highlights">
            {(hotel.facilities || ['设计师酒店', '艺术氛围', '免费停车', '亲子房'])
              .slice(0, 4)
              .map((item, idx) => (
                <View key={idx} className="highlight-chip">
                  <Text className="highlight-dot">●</Text>
                  <Text className="highlight-text">{item}</Text>
                </View>
              ))}
            <View
              className="highlight-more"
              onClick={() =>
                Taro.showToast({
                  title: '设施政策详情可在后续补充',
                  icon: 'none'
                })
              }
            >
              <Text>查看全部设施与政策</Text>
            </View>
          </View>

          {/* 位置区：地址 / 距地铁距离（示意） / 地图按钮 */}
          <View className="base-address">
            <View className="address-icon">📍</View>
            <View className="address-main">
              <Text className="address-text">
                {hotel.city} · {hotel.address}
              </Text>
              {hotel.locationDesc && (
                <Text className="address-sub">{hotel.locationDesc}</Text>
              )}
            </View>
            <View
              className="map-btn"
              onClick={() =>
                Taro.showToast({ title: '地图查看开发中', icon: 'none' })
              }
            >
              <Text>地图</Text>
              <Text className="arrow">›</Text>
            </View>
          </View>
        </View>

        {/* 日期与房型筛选区 */}
        <View className="date-room-filter" id="section-selected">
          <View className="date-row" onClick={() => setCalendarVisible(true)}>
            <View className="date-main">
              <View className="date-col">
                <Text className="date-label">入住</Text>
                <Text className="date-value">
                  {checkInDate
                    ? formatDateLabel(checkInDate)
                    : '请选择入住日期'}
                </Text>
              </View>
              <View className="date-col">
                <Text className="date-label">离店</Text>
                <Text className="date-value">
                  {checkOutDate
                    ? formatDateLabel(checkOutDate)
                    : '请选择离店日期'}
                </Text>
              </View>
            </View>
            <View className="date-nights">
              <Text>{nights}晚</Text>
            </View>
          </View>

          <View
            className="people-row"
            onClick={() => setPeoplePanelVisible((v) => !v)}
          >
            <Text className="people-label">间数/人数</Text>
            <Text className="people-value">
              {roomCount}间 {adultCount}成人
              {childCount > 0 ? ` ${childCount}儿童` : ''}
            </Text>
          </View>

          {peoplePanelVisible && (
            <View className="people-panel">
              {[
                { key: 'room', label: '房间数', value: roomCount, min: 1 },
                { key: 'adult', label: '成人', value: adultCount, min: 1 },
                { key: 'child', label: '儿童', value: childCount, min: 0 }
              ].map((item) => (
                <View key={item.key} className="people-row-inner">
                  <Text className="people-row-label">{item.label}</Text>
                  <View className="people-counter">
                    <View
                      className={
                        item.value <= item.min
                          ? 'counter-btn counter-btn-disabled'
                          : 'counter-btn'
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.value <= item.min) return;
                        changeCount(item.key, -1);
                      }}
                    >
                      <Text>-</Text>
                    </View>
                    <Text className="counter-value">{item.value}</Text>
                    <View
                      className="counter-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        changeCount(item.key, 1);
                      }}
                    >
                      <Text>+</Text>
                    </View>
                  </View>
                </View>
              ))}
              <View className="people-panel-footer">
                <View
                  className="people-confirm-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPeoplePanelVisible(false);
                  }}
                >
                  <Text>完成</Text>
                </View>
              </View>
            </View>
          )}

          {/* 快捷标签 + 筛选按钮 */}
          <View className="quick-tags-row">
            <ScrollView className="quick-tags-scroll" scrollX>
              {quickTags.map((tag) => (
                <View
                  key={tag}
                  className={`quick-tag ${
                    selectedQuickTags.includes(tag) ? 'active' : ''
                  }`}
                  onClick={() => toggleQuickTag(tag)}
                >
                  <Text>{tag}</Text>
                </View>
              ))}
            </ScrollView>
            <View
              className="filter-btn"
              onClick={() => setRoomFilterVisible((v) => !v)}
            >
              <Text>筛选</Text>
            </View>
          </View>

          {roomFilterVisible && (
            <View className="room-filter-panel">
              <Text className="filter-title">房型筛选（示意）</Text>
              <Text className="filter-sub">
                可按床型、窗景、是否含早等维度拓展
              </Text>
            </View>
          )}
        </View>

        {/* 为您推荐 / 房型价格区 */}
        <View className="section room-section">
          <View className="recommend-header">
            <Text className="recommend-title">为您推荐</Text>
            <Text className="recommend-sub">本店最低价</Text>
            <View className="recommend-price">
              <Text className="price-symbol">¥</Text>
              <Text className="price-value">{formatPrice(minPrice)}</Text>
              <Text className="price-unit">起</Text>
            </View>
          </View>

          <View className="room-list">
            {displayedRooms.map((room) => (
              <View key={room._id} className="room-item">
                <View className="room-image">
                  {/* 统一使用 BED 房型示意图 */}
                  <Image className="room-image-placeholder" src={BEDImg} mode="aspectFill" />
                </View>
                <View className="room-info">
                  <Text className="room-name">{room.name}</Text>
                  <View className="room-meta">
                    {room.area && (
                      <Text className="meta-item">{room.area}</Text>
                    )}
                    {room.area && (room.floor || room.maxGuests) && (
                      <Text className="meta-divider">|</Text>
                    )}
                    {room.floor && (
                      <Text className="meta-item">{room.floor}</Text>
                    )}
                    {room.floor && room.maxGuests && (
                      <Text className="meta-divider">|</Text>
                    )}
                    {room.maxGuests && (
                      <Text className="meta-item">
                        可住{room.maxGuests}人
                      </Text>
                    )}
                  </View>
                  {room.bedType && (
                    <View className="room-bed">
                      <Text>{room.bedType}</Text>
                    </View>
                  )}
                  <View className="room-amenities">
                    {(room.amenities || [])
                      .slice(0, 3)
                      .map((amenity, index) => (
                        <Text key={index} className="amenity-tag">
                          {amenity}
                        </Text>
                      ))}
                  </View>
                </View>
                <View className="room-price">
                  <Text className="price-symbol">¥</Text>
                  <Text className="price-value">
                    {formatPrice(Number(room.price || 0))}
                  </Text>
                  <Text className="price-unit">起</Text>
                  <View
                    className="book-btn"
                    onClick={() =>
                      Taro.showToast({
                        title: '查看房型预订方案开发中',
                        icon: 'none'
                      })
                    }
                  >
                    <Text>查看房型</Text>
                  </View>
                </View>
              </View>
            ))}

            {rooms.length > 2 && (
              <View
                className="show-more-btn"
                onClick={() => setShowAllRooms(!showAllRooms)}
              >
                <Text>
                  {showAllRooms
                    ? '收起房型'
                    : `查看更多${rooms.length - 2}种房型`}
                </Text>
                <Text className="arrow">{showAllRooms ? '▲' : '▼'}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 点评区 */}
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
                <View
                  className="summary-progress"
                  style={{ width: '95%' }}
                />
              </View>
              <Text className="summary-score">4.9</Text>
            </View>
            <View className="summary-item">
              <Text className="summary-label">设施</Text>
              <View className="summary-bar">
                <View
                  className="summary-progress"
                  style={{ width: '94%' }}
                />
              </View>
              <Text className="summary-score">4.8</Text>
            </View>
            <View className="summary-item">
              <Text className="summary-label">服务</Text>
              <View className="summary-bar">
                <View
                  className="summary-progress"
                  style={{ width: '96%' }}
                />
              </View>
              <Text className="summary-score">4.9</Text>
            </View>
            <View className="summary-item">
              <Text className="summary-label">位置</Text>
              <View className="summary-bar">
                <View
                  className="summary-progress"
                  style={{ width: '98%' }}
                />
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

        {/* 位置区块 */}
        <View className="section map-section" id="section-map">
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
            <Text className="address-text">
              {hotel.city} · {hotel.address}
            </Text>
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

        {/* 相册区：简单平铺图片 */}
        <View className="section album-section" id="section-album">
          <View className="section-title">
            <Text>酒店相册</Text>
          </View>
          <View className="album-grid">
            {(hotel.images || []).map((img, idx) => (
              <View
                key={idx}
                className="album-item"
                onClick={() => handleImagePreview(idx)}
              >
                <Image src={img} mode="aspectFill" className="album-image" />
              </View>
            ))}
          </View>
        </View>

        <View className="bottom-space" />
      </ScrollView>

      {/* 底部固定操作栏：问酒店 / 查看房型 */}
      <View className="footer-bar">
        <View className="footer-left">
          <View className="ask-btn" onClick={handleAskHotel}>
            <Text>问酒店</Text>
          </View>
        </View>
        <View className="footer-right">
          <View className="footer-price">
            <Text className="price-symbol">¥</Text>
            <Text className="price-value">{formatPrice(minPrice)}</Text>
            <Text className="price-unit">起</Text>
          </View>
          <View className="footer-room-btn" onClick={handleViewRooms}>
            <Text>查看房型</Text>
          </View>
        </View>
      </View>

      {/* 入住/离店日期弹层 */}
      <DetailCalendar
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onConfirm={handleCalendarConfirm}
        defaultStartDate={checkInDate}
        defaultEndDate={checkOutDate}
      />
    </View>
  );
}
