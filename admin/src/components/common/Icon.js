import React from 'react';
import * as Icons from '@ant-design/icons';

/**
 * 图标组件 - 统一管理Ant Design图标
 * @param {string} type - 图标类型，如 'HomeOutlined', 'UserOutlined' 等
 */
const Icon = ({ type, ...props }) => {
  const IconComponent = Icons[type];
  return IconComponent ? <IconComponent {...props} /> : null;
};

export default Icon;
