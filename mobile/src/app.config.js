module.exports = {
  pages: [
    'pages/index/index',
    'pages/list/list',
    'pages/detail/detail'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '易宿酒店',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999',
    selectedColor: '#1890ff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/home.png',
        selectedIconPath: 'assets/home-active.png'
      }
    ]
  }
};
