/**
 * 字段白名单配置
 * 用于定义各个表允许更新的字段
 */

// 酒店字段配置
const HOTEL_FIELDS = {
  // 基础信息字段（所有用户可修改）
  basic: [
    'name',
    'nameEn',
    'city',
    'address',
    'star',
    'openDate',
    'phone',
    'email',
    'contactPerson',
    'description'
  ],
  
  // 基础配置字段
  config: [
    'freeParking',
    'freeWifi',
    'breakfastType',
    'familyFriendly',
    'petsAllowed'
  ],
  
  // JSON 复杂字段
  json: [
    'roomTypes',
    'nearbyAttractions',
    'nearbyTransport',
    'nearbyMalls',
    'discounts',
    'customFields'
  ],
  
  // 状态字段（仅管理员可修改）
  status: [
    'status',
    'reviewNote',
    'offlineAt'
  ]
};

/**
 * 获取酒店字段白名单
 * @param {string} userRole - 用户角色 ('merchant' | 'admin')
 * @param {string} operation - 操作类型 ('create' | 'update')
 * @returns {Array<string>} 允许的字段列表
 */
function getHotelAllowedFields(userRole = 'merchant', operation = 'update') {
  const fields = [
    ...HOTEL_FIELDS.basic,
    ...HOTEL_FIELDS.config,
    ...HOTEL_FIELDS.json
  ];
  
  // 管理员可以修改状态字段
  if (userRole === 'admin') {
    fields.push(...HOTEL_FIELDS.status);
  }
  
  // 创建操作时，商户不能设置状态（强制为 pending）
  if (operation === 'create') {
    // 移除状态字段，因为创建时会强制设置为 pending
    return fields.filter(field => !HOTEL_FIELDS.status.includes(field));
  }
  
  return fields;
}

// 用户字段配置
const USER_FIELDS = {
  // 普通用户可修改
  basic: ['nickname', 'avatar'],
  
  // 管理员可修改
  admin: ['username', 'role', 'status']
};

function getUserAllowedFields(userRole) {
  const fields = [...USER_FIELDS.basic];
  if (userRole === 'admin') {
    fields.push(...USER_FIELDS.admin);
  }
  return fields;
}

module.exports = {
  HOTEL_FIELDS,
  getHotelAllowedFields,
  USER_FIELDS,
  getUserAllowedFields
};
