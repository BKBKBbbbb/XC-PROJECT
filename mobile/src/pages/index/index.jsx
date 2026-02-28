import { View } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import SimpleCalendar from './components/SimpleCalendar';
import TopBanner from './components/TopBanner';
import SearchPanel from './components/SearchPanel';
import HotCitySection from './components/HotCitySection';
import './index.scss';

export default function Index() {
  const router = Taro.getCurrentInstance().router;
  const initialParams = router?.params || {};
  // 选项卡：国内 / 海外 / 民宿 / 钟点房
  const [currentTab, setCurrentTab] = useState('domestic');

  // 城市列表：区分国内 / 海外
  const domesticCityOptions = [
    '上海',
    '北京',
    '杭州',
    '广州',
    '深圳',
    '成都',
    '重庆',
    '西安',
    '南京'
  ];
  const overseaCityOptions = [
    '东京',
    '首尔',
    '新加坡',
    '曼谷',
    '吉隆坡',
    '伦敦',
    '巴黎',
    '纽约',
    '悉尼'
  ];

  // 当前城市 & 当前下拉候选
  const [currentCity, setCurrentCity] = useState('上海');
  const [cityOptions, setCityOptions] = useState(domesticCityOptions);

  // 关键字搜索
  const [keyword, setKeyword] = useState('');

  // 入住/离店日期 & 简易日历
  const [checkInDate, setCheckInDate] = useState(null); // Date
  const [checkOutDate, setCheckOutDate] = useState(null); // Date
  const [nightCount, setNightCount] = useState(1);
  const [calendarVisible, setCalendarVisible] = useState(
    initialParams.openCalendar === '1'
  );

  // 筛选条件：价格/星级
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
  const [priceRange, setPriceRange] = useState('不限');
  const [selectedStars, setSelectedStars] = useState([]); // [1,2,3,...]

  // 人数选择
  const [peoplePanelVisible, setPeoplePanelVisible] = useState(false);
  const [roomCount, setRoomCount] = useState(1);
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);

  // 快捷标签
  const quickTags = [
    '口碑榜',
    '特价套餐',
    '超值低价',
    '亲子',
    '豪华',
    '免费停车场',
    '含早餐'
  ];
  const [selectedTags, setSelectedTags] = useState([]);

  const normalizeLocationError = (err) => {
    const raw = err?.errMsg || err?.message || (typeof err === 'string' ? err : '') || '';
    const msg = String(raw);

    // H5 常见：非安全上下文（HTTP + 非 localhost）
    if (
      /secure context|Only secure origins|Only secure contexts|not allowed by user agent/i.test(
        msg
      )
    ) {
      return 'H5网页定位需要HTTPS或localhost（当前为HTTP，浏览器已拦截）';
    }

    // 小程序/浏览器常见：用户拒绝授权
    if (/auth deny|authorize:fail|permission denied|denied/i.test(msg)) {
      return '未授权定位，请在系统/浏览器设置中允许定位权限';
    }

    if (/timeout/i.test(msg)) return '定位超时，请重试';
    if (/unavailable|position unavailable/i.test(msg)) return '暂时无法获取位置，请稍后重试';

    return msg || '定位失败';
  };

  const getLocation = async () => {
    // 这里演示调用 Taro 自带定位能力，实际项目中可替换为：逆地理解析(经纬度 -> 城市)
    const env = Taro.getEnv();

    // H5：多数手机浏览器要求 HTTPS（或 localhost）才能使用定位
    if (env === Taro.ENV_TYPE.H5) {
      const isSecure =
        typeof window !== 'undefined' &&
        (window.isSecureContext ||
          window.location?.hostname === 'localhost' ||
          window.location?.hostname === '127.0.0.1');

      if (!isSecure) {
        Taro.showToast({
          title: 'H5定位需要HTTPS/localhost（当前HTTP会失败）',
          icon: 'none',
          duration: 3000
        });
        console.log('定位失败：H5 非安全上下文，浏览器禁止定位', window?.location?.href);
        return;
      }
    }

    try {
      const res = await Taro.getLocation({ type: 'wgs84' });
      console.log('定位成功', res);
      // 实际项目中：根据经纬度获取城市；此处仍保持示例逻辑
      setCurrentCity('上海');
    } catch (err) {
      const tip = normalizeLocationError(err);
      console.log('定位失败', err);
      Taro.showToast({ title: tip, icon: 'none', duration: 3000 });

      // 小程序端：若用户拒绝，可引导去设置打开权限
      if (
        (Taro.getEnv() === Taro.ENV_TYPE.WEAPP ||
          Taro.getEnv() === Taro.ENV_TYPE.ALIPAY ||
          Taro.getEnv() === Taro.ENV_TYPE.SWAN ||
          Taro.getEnv() === Taro.ENV_TYPE.TT) &&
        /未授权定位|拒绝|denied|auth deny/i.test(tip)
      ) {
        // 不强制弹窗，避免打扰；用户可点击右侧📍再次触发
        // 如需强引导，可改为 Taro.showModal + Taro.openSetting()
      }
    }
  };

  useEffect(() => {
    // 默认加载时尝试定位一次：H5(网页)在手机上常因 HTTP/权限策略失败，避免自动打扰与失败日志
    if (Taro.getEnv() !== Taro.ENV_TYPE.H5) {
      getLocation();
    }
  }, []);

  // 查询按钮点击：收集所有表单数据，并跳转到酒店列表页
  const handleSearch = () => {
    const queryPayload = {
      tabType: currentTab,
      city: currentCity,
      keyword,
      checkInDate: checkInDate ? checkInDate.toISOString().split('T')[0] : '',
      checkOutDate: checkOutDate ? checkOutDate.toISOString().split('T')[0] : '',
      nightCount,
      priceRange,
      stars: selectedStars,
      rooms: roomCount,
      adults: adultCount,
      children: childCount,
      tags: selectedTags
    };

    // 实际项目中可以在这里调用后端接口；本需求只要求跳转即可
    console.log('查询参数：', queryPayload);

    const city = encodeURIComponent(currentCity || '');
    const checkIn = checkInDate ? checkInDate.toISOString().split('T')[0] : '';
    const checkOut = checkOutDate ? checkOutDate.toISOString().split('T')[0] : '';
    const keywordParam = encodeURIComponent(keyword || '');
    const priceRangeParam = encodeURIComponent(priceRange || '');
    const starsParam = selectedStars.join(',');
    const tagsParam = encodeURIComponent(selectedTags.join(','));

    // 这里演示使用 Taro 路由跳转；在纯 Web 场景中可对应为 router.push('/hotel/list')
    // 关键修改：将关键词与筛选条件一并透传到列表页
    Taro.navigateTo({
      url: `/pages/list/list?city=${city}&checkIn=${checkIn}&checkOut=${checkOut}&nightCount=${nightCount}&rooms=${roomCount}&adults=${adultCount}&children=${childCount}&keyword=${keywordParam}&priceRange=${priceRangeParam}&stars=${starsParam}&tags=${tagsParam}`
    });
  };

  // 顶部广告点击：跳转到「上海静安香格里拉大酒店」相关酒店列表
  const handleAdClick = () => {
    const city = encodeURIComponent('上海');
    const keyword = encodeURIComponent('上海静安香格里拉大酒店');

    Taro.navigateTo({
      url: `/pages/list/list?city=${city}&keyword=${keyword}`
    });
  };

  // 城市 Picker 选择
  const handleCityChange = (e) => {
    const index = e.detail.value;
    const city = cityOptions[index];
    setCurrentCity(city);
  };

  // 关键字输入
  const handleKeywordChange = (e) => {
    setKeyword(e.detail.value);
  };

  // 日历组件确认
  const handleCalendarConfirm = (start, end, nights) => {
    setCheckInDate(start);
    setCheckOutDate(end);
    setNightCount(nights || 1);
    setCalendarVisible(false);
  };

  // 夜晚数展示（默认 1 晚）
  const nightLabel = `${nightCount || 1}晚`;

  // 星级选择切换
  const toggleStar = (star) => {
    setSelectedStars((prev) => {
      if (prev.includes(star)) {
        return prev.filter((s) => s !== star);
      }
      return [...prev, star];
    });
  };

  // 快捷标签切换
  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      return [...prev, tag];
    });
  };

  // 人数增减
  const changeCount = (type, delta) => {
    if (type === 'room') {
      setRoomCount((v) => Math.max(1, v + delta));
    } else if (type === 'adult') {
      setAdultCount((v) => Math.max(1, v + delta));
    } else if (type === 'child') {
      setChildCount((v) => Math.max(0, v + delta));
    }
  };

  // 首页筛选条件卡片：只重置价格区间和星级选择
  const handleResetFilterPanel = () => {
    setPriceRange('不限');
    setSelectedStars([]);
  };

  const handleFilterPanelChange = (visible) => {
    setFilterPanelVisible(visible);
  };

  const handlePeoplePanelChange = (visible) => {
    setPeoplePanelVisible(visible);
  };

  const handlePriceRangeChange = (range) => {
    setPriceRange(range);
  };

  // Tab 切换：同步更新城市列表和默认城市
  const handleTabChange = (tabKey) => {
    setCurrentTab(tabKey);

    if (tabKey === 'oversea') {
      setCityOptions(overseaCityOptions);
      setCurrentCity(overseaCityOptions[0]);
    } else {
      // 其他类型默认使用国内城市
      setCityOptions(domesticCityOptions);
      // 如果当前城市不在国内列表中，重置为第一个国内城市
      if (!domesticCityOptions.includes(currentCity)) {
        setCurrentCity(domesticCityOptions[0]);
      }
    }
  };

  return (
    <View className="index-page">
      {/* 顶部Banner */}
      <TopBanner onClick={handleAdClick} />

      {/* 搜索面板 */}
      <SearchPanel
        currentTab={currentTab}
        onTabChange={handleTabChange}
        cityOptions={cityOptions}
        currentCity={currentCity}
        onCityChange={handleCityChange}
        onGetLocation={getLocation}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        nightLabel={nightLabel}
        onOpenCalendar={() => setCalendarVisible(true)}
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        filterPanelVisible={filterPanelVisible}
        priceRange={priceRange}
        selectedStars={selectedStars}
        onFilterPanelChange={handleFilterPanelChange}
        onPriceRangeChange={handlePriceRangeChange}
        onToggleStar={toggleStar}
        onResetFilterPanel={handleResetFilterPanel}
        peoplePanelVisible={peoplePanelVisible}
        roomCount={roomCount}
        adultCount={adultCount}
        childCount={childCount}
        onPeoplePanelChange={handlePeoplePanelChange}
        onChangeCount={changeCount}
        quickTags={quickTags}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
        onSearch={handleSearch}
      />

      {/* 热门城市 */}
      <HotCitySection />

      {/* 入住/离店日历弹层 */}
      <SimpleCalendar
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onConfirm={handleCalendarConfirm}
        defaultStartDate={checkInDate}
        defaultEndDate={checkOutDate}
      />
    </View>
  );
}
