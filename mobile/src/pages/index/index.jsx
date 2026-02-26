import { View, Text, Input, Picker } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

/**
 * 简易日历组件
 * - 逻辑：
 *   1. 生成从「今天开始」连续 N 天的日期数组
 *   2. 第一次点击：选择入住日期 startDate
 *   3. 第二次点击：选择离店日期 endDate（若比 startDate 早，则自动对调）
 *   4. 再次点击任意日期：重新从该日期开始选择新的入住/离店
 *   5. 底部显示「已选几晚」，点击“确定”回传给父组件
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

  // 当前选中的入住/离店日期
  const [startDate, setStartDate] = useState(defaultStartDate || null);
  const [endDate, setEndDate] = useState(defaultEndDate || null);

  useEffect(() => {
    // 当父组件传入默认值变更时，同步本地状态
    setStartDate(defaultStartDate || null);
    setEndDate(defaultEndDate || null);
  }, [defaultStartDate, defaultEndDate]);

  if (!visible) return null;

  // 工具函数：生成从今天开始的日期数组
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
        // 用字符串 key 方便比较
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

  // 工具函数：计算两日期之间的晚数
  const calcNights = (start, end) => {
    if (!start || !end) return 0;
    const ts1 = new Date(start).setHours(0, 0, 0, 0);
    const ts2 = new Date(end).setHours(0, 0, 0, 0);
    const diff = ts2 - ts1;
    if (diff <= 0) return 0;
    return diff / (24 * 60 * 60 * 1000);
  };

  const nights = calcNights(startDate, endDate);

  // 点击某一天时的处理逻辑
  const handleDayClick = (dayObj) => {
    const clickedDate = dayObj.date;

    // 情况 1：目前尚未选中入住，或已同时选中过入住+离店，则重新选择入住
    if (!startDate || (startDate && endDate)) {
      setStartDate(clickedDate);
      setEndDate(null);
      return;
    }

    // 情况 2：已有入住日期、尚未选离店
    if (startDate && !endDate) {
      const startTs = new Date(startDate).setHours(0, 0, 0, 0);
      const clickedTs = new Date(clickedDate).setHours(0, 0, 0, 0);

      // 如果用户选的离店比入住早，则自动对调
      if (clickedTs < startTs) {
        setEndDate(startDate);
        setStartDate(clickedDate);
      } else if (clickedTs === startTs) {
        // 同一天：视作只选入住，不设置离店
        setEndDate(null);
      } else {
        setEndDate(clickedDate);
      }
    }
  };

  // 判断某个日期是否选中 / 在区间内
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
      {/* 阻止点击内容区域冒泡到蒙层 */}
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

        {/* 星期标题行 */}
        <View className="calendar-week-row">
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
            <View key={w} className="calendar-week-cell">
              <Text>{w}</Text>
            </View>
          ))}
        </View>

        {/* 日期格子区域 */}
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

        {/* 底部操作按钮 */}
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

export default function Index() {
  const router = Taro.getCurrentInstance().router;
  const initialParams = router?.params || {};
  // 选项卡：国内 / 海外 / 民宿 / 钟点房
  const [currentTab, setCurrentTab] = useState('domestic');

  // 当前城市
  const [currentCity, setCurrentCity] = useState('上海');
  // 城市选择器候选项（可根据实际项目扩展）
  const cityOptions = ['上海', '北京', '杭州', '广州', '深圳', '成都', '重庆', '西安', '南京'];

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

  const getLocation = () => {
    // 这里演示调用 Taro 自带定位能力，实际项目中可以替换为更丰富的逻辑
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

  useEffect(() => {
    // 默认加载时尝试定位一次
    getLocation();
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

    // 这里演示使用 Taro 路由跳转；在纯 Web 场景中可对应为 router.push('/hotel/list')
    Taro.navigateTo({
      url: `/pages/list/list?city=${city}&checkIn=${checkIn}&checkOut=${checkOut}&nightCount=${nightCount}&rooms=${roomCount}&adults=${adultCount}&children=${childCount}`
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

  // 日期显示文案：2月21日 今天
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

  return (
    <View className="index-page">
      {/* 顶部Banner */}
      <View className="banner-wrapper" onClick={handleAdClick}>
        <View className="banner-image">
          <Text className="banner-title">欢迎使用易宿酒店</Text>
          <Text className="banner-subtitle">找到您的理想住宿</Text>
        </View>
      </View>

      {/* 搜索面板 */}
      <View className="search-panel">
        {/* 选项卡：国内 / 海外 / 民宿 / 钟点房（放在地点上方） */}
        <View className="tabs-wrapper">
          {[
            { key: 'domestic', label: '国内' },
            { key: 'oversea', label: '海外' },
            { key: 'homestay', label: '民宿' },
            { key: 'hour', label: '钟点房' }
          ].map((tab) => (
            <View
              key={tab.key}
              className={
                currentTab === tab.key ? 'tab-item tab-item-active' : 'tab-item'
              }
              onClick={() => setCurrentTab(tab.key)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>

        {/* 城市选择（支持 Picker + 定位） */}
        <View className="search-row">
          <Picker
            mode="selector"
            range={cityOptions}
            onChange={handleCityChange}
          >
            <View className="search-item">
              <Text className="label">
                目的地
                <Text className="location-tag">支持定位</Text>
              </Text>
              <Text className="value">
                {currentCity}
                <Text className="arrow-down">▼</Text>
              </Text>
            </View>
          </Picker>

          {/* 定位图标：点击重新触发定位逻辑（模拟/真实均可） */}
          <View className="location-btn" onClick={getLocation}>
            <Text className="location-icon">📍</Text>
          </View>
        </View>

        <View className="search-divider"></View>

        {/* 入住 / 离店日期（自定义简易日历组件） */}
        <View className="search-row">
          <View
            className="search-item"
            onClick={() => setCalendarVisible(true)}
          >
            <Text className="label">入住</Text>
            <Text className="value">
              {checkInDate ? formatDateLabel(checkInDate) : '请选择入住日期'}
            </Text>
          </View>
          <View
            className="search-item"
            onClick={() => setCalendarVisible(true)}
          >
            <Text className="label">离店</Text>
            <Text className="value">
              {checkOutDate ? formatDateLabel(checkOutDate) : '请选择离店日期'}
            </Text>
          </View>
          <View className="date-arrow">
            <Text>{nightLabel}</Text>
          </View>
        </View>

        <View className="search-divider"></View>

        {/* 关键字搜索 */}
        <View className="search-row">
          <View className="search-item">
            <Text className="label">关键字</Text>
            <Input
              className="keyword-input"
              type="text"
              value={keyword}
              placeholder="位置/品牌/酒店"
              placeholderClass="keyword-placeholder"
              onInput={handleKeywordChange}
            />
          </View>
        </View>

        <View className="search-divider"></View>

        {/* 筛选条件：价格 / 星级 */}
        <View
          className="search-row filter-row"
          onClick={() => setFilterPanelVisible((v) => !v)}
        >
          <View className="search-item">
            <Text className="label">筛选条件</Text>
            <Text className="value">
              {priceRange} /
              {selectedStars.length > 0
                ? ` ${selectedStars.join('、')}星`
                : ' 星级不限'}
            </Text>
          </View>
          <View className="filter-arrow">
            <Text>{filterPanelVisible ? '收起' : '展开'}</Text>
          </View>
        </View>

        {filterPanelVisible && (
          <View className="filter-panel">
            <View className="filter-block">
              <Text className="filter-title">价格区间（每晚）</Text>
              <View className="filter-tags">
                {['不限', '¥0-¥300', '¥300-¥600', '¥600-¥1000', '¥1000以上'].map(
                  (range) => (
                    <View
                      key={range}
                      className={
                        priceRange === range
                          ? 'filter-tag filter-tag-active'
                          : 'filter-tag'
                      }
                      onClick={() => setPriceRange(range)}
                    >
                      <Text>{range}</Text>
                    </View>
                  )
                )}
              </View>
            </View>

            <View className="filter-block">
              <Text className="filter-title">酒店星级</Text>
              <View className="filter-tags">
                {[1, 2, 3, 4, 5].map((star) => (
                  <View
                    key={star}
                    className={
                      selectedStars.includes(star)
                        ? 'filter-tag filter-tag-active'
                        : 'filter-tag'
                    }
                    onClick={() => toggleStar(star)}
                  >
                    <Text>{star}星</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View className="search-divider"></View>

        {/* 人数选择 */}
        <View
          className="search-row"
          onClick={() => setPeoplePanelVisible((v) => !v)}
        >
          <View className="search-item">
            <Text className="label">人数</Text>
            <Text className="value">
              {roomCount}间房 {adultCount}成人 {childCount}儿童
            </Text>
          </View>
        </View>

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
          </View>
        )}

        {/* 快捷标签 */}
        <View className="quick-tags">
          {quickTags.map((tag) => (
            <View
              key={tag}
              className={
                selectedTags.includes(tag)
                  ? 'quick-tag quick-tag-active'
                  : 'quick-tag'
              }
              onClick={() => toggleTag(tag)}
            >
              <Text>{tag}</Text>
            </View>
          ))}
        </View>

        {/* 搜索按钮：红色通栏大按钮 */}
        <View className="search-btn" onClick={handleSearch}>
          <Text className="btn-text">查询</Text>
        </View>
      </View>

      {/* 热门城市 */}
      <View className="city-section">
        <View className="section-title">
          <Text>热门城市</Text>
        </View>
        <View className="city-grid">
          {['上海', '北京', '杭州', '广州', '深圳', '成都', '重庆', '西安'].map(
            (city, index) => (
              <View key={index} className="city-item">
                <Text className="city-name">{city}</Text>
              </View>
            )
          )}
        </View>
      </View>

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
