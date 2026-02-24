import React from 'react';
import { Card } from 'antd';
import Icon from './Icon';
import { theme } from './theme';

/**
 * 统计卡片组件
 * @param {string} title - 标题
 * @param {number|string} value - 数值
 * @param {string} suffix - 后缀（如：元、人、笔）
 * @param {ReactNode} prefix - 前缀图标
 * @param {string} color - 数值颜色
 * @param {string} subText - 子文本（如：↑ 12% 较昨日）
 * @param {function} onClick - 点击事件
 * @param {boolean} isPending - 是否为待处理状态
 */
const StatCard = ({ 
  title, 
  value, 
  suffix, 
  prefix, 
  color, 
  subText, 
  onClick, 
  isPending 
}) => {
  // 格式化金额（千位分隔符）
  const formatMoney = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{ 
        borderRadius: 8,
        boxShadow: '0 2px 12px 0 rgba(0, 0, 0, 0.05)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        border: isPending ? `2px solid ${theme.warning}` : '1px solid #fff',
      }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: theme.textTertiary, marginBottom: 8 }}>
            {title}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: color || theme.textPrimary, lineHeight: 1.2 }}>
            {formatMoney(value)}
          </div>
          {suffix && (
            <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 4 }}>
              {suffix}
            </div>
          )}
          {subText && (
            <div style={{ 
              fontSize: 12, 
              marginTop: 8,
              color: subText.startsWith('↑') ? theme.error : theme.success,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              {subText.startsWith('↑') ? <Icon type="ArrowUpOutlined" /> : <Icon type="ArrowDownOutlined" />}
              {subText} 较昨日
            </div>
          )}
        </div>
        <div style={{ 
          width: 48, 
          height: 48, 
          borderRadius: 8, 
          background: '#F5F7FA',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: theme.textTertiary,
          fontSize: 22
        }}>
          {prefix}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
