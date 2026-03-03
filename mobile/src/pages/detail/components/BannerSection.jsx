import { View, Text, Swiper, SwiperItem } from '@tarojs/components';
import Taro from '@tarojs/taro';

// 顶部标签栏配置（封面、亮点、精选、点评、位置、相册）
const topTabs = [
  { id: 'cover', name: '封面', anchor: 'section-cover' },
  { id: 'highlight', name: '亮点', anchor: 'section-highlight' },
  { id: 'selected', name: '精选', anchor: 'section-selected' },
  { id: 'review', name: '点评', anchor: 'section-review' },
  { id: 'map', name: '位置', anchor: 'section-map' },
  { id: 'album', name: '相册', anchor: 'section-album' }
];

export default function BannerSection(props) {
  const {
    bannerImages,
    currentImageIndex,
    activeTab,
    onChangeImage,
    onPreviewImage,
    onBack,
    onTabClick,
    isFavorited,
    onToggleFavorite
  } = props;

  const handleTopTabClick = (tab) => {
    onTabClick?.(tab);
    if (tab.anchor) {
      Taro.pageScrollTo?.({ selector: `#${tab.anchor}`, duration: 300 });
    }
  };

  return (
    <View className="banner-wrapper" id="section-cover">
      <Swiper
        className="banner-swiper"
        circular
        autoplay={{ interval: 3000 }}
        duration={500}
        onChange={onChangeImage}
      >
        {bannerImages.map((image, index) => (
          <SwiperItem key={index}>
            <View className="banner-item" onClick={() => onPreviewImage(index)}>
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
        <View className="nav-left-btn" onClick={onBack}>
          <Text>‹</Text>
        </View>
        <View className="nav-right-group">
          <View
            className={`nav-icon-btn ${isFavorited ? 'nav-icon-btn-favorited' : ''}`}
            onClick={onToggleFavorite}
          >
            <Text>{isFavorited ? '★' : '☆'}</Text>
          </View>
          <View
            className="nav-icon-btn"
            onClick={() =>
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
            className={`banner-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTopTabClick(tab)}
          >
            <Text>{tab.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

