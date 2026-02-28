module.exports = {
  /**
   * 必须在这里注册所有要跳转的页面
   * 否则 Taro.navigateTo 在 H5/小程序里都会失败或无反应
   */
  pages: [
    'pages/index/index',   // 首页
    'pages/list/list',     // 酒店列表页
    'pages/detail/detail'  // 酒店详情页
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '易宿酒店',
    navigationBarTextStyle: 'black'
  },
  /**
   * 小程序端定位权限说明（用于用户授权弹窗的文案展示）
   * - 若不配置，部分平台/版本可能出现授权失败或文案缺失
   */
  permission: {
    'scope.userLocation': {
      desc: '用于获取您的位置，为您自动选择城市并推荐附近酒店'
    }
  },
  router: {
    mode: 'hash' // 使用 hash 模式，避免刷新白屏
  }
};