import { View, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';

/**
 * 简易日历组件（与首页复用的逻辑，实现本页内修改日期）
 */
export default function SimpleCalendar(props) {
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

