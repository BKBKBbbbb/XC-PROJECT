import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { get } from '../../utils/api';
import { calcNights, getMinHotelPrice } from '../../utils/hotel';
import ININImg from '../../assets/Hotel2.jpg';
import './detail.scss';
import BannerSection from './components/BannerSection';
import BaseInfoSection from './components/BaseInfoSection';
import DateRoomFilterSection from './components/DateRoomFilterSection';
import RecommendRoomSection from './components/RecommendRoomSection';
import ReviewSection from './components/ReviewSection';
import MapSection from './components/MapSection';
import AlbumSection from './components/AlbumSection';
import FooterBar from './components/FooterBar';
import DetailCalendar from './components/DetailCalendar';

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
        <BannerSection
          bannerImages={bannerImages}
          currentImageIndex={currentImageIndex}
          activeTab={activeTab}
          onChangeImage={handleImageChange}
          onPreviewImage={handleImagePreview}
          onBack={handleBack}
          onTabClick={handleTopTabClick}
        />

        <BaseInfoSection hotel={hotel} />

        <DateRoomFilterSection
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          nights={nights}
          onOpenCalendar={() => setCalendarVisible(true)}
          roomCount={roomCount}
          adultCount={adultCount}
          childCount={childCount}
          peoplePanelVisible={peoplePanelVisible}
          onTogglePeoplePanel={() => setPeoplePanelVisible((v) => !v)}
          onClosePeoplePanel={() => setPeoplePanelVisible(false)}
          onChangeCount={changeCount}
          quickTags={quickTags}
          selectedQuickTags={selectedQuickTags}
          onToggleQuickTag={toggleQuickTag}
          roomFilterVisible={roomFilterVisible}
          onToggleRoomFilter={() => setRoomFilterVisible((v) => !v)}
          formatDateLabel={formatDateLabel}
        />

        <RecommendRoomSection
          displayedRooms={displayedRooms}
          totalRooms={rooms.length}
          showAllRooms={showAllRooms}
          minPrice={minPrice}
          onToggleShowAllRooms={() => setShowAllRooms(!showAllRooms)}
          formatPrice={formatPrice}
        />

        <ReviewSection hotel={hotel} />

        <MapSection hotel={hotel} />

        <AlbumSection hotel={hotel} onPreview={handleImagePreview} />

        <View className="bottom-space" />
      </ScrollView>

      <FooterBar
        minPrice={minPrice}
        formatPrice={formatPrice}
        onAskHotel={handleAskHotel}
        onViewRooms={handleViewRooms}
      />

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
