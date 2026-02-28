import { View, Text, Image } from '@tarojs/components';

export default function AlbumSection({ hotel, onPreview }) {
  return (
    <View className="section album-section" id="section-album">
      <View className="section-title">
        <Text>酒店相册</Text>
      </View>
      <View className="album-grid">
        {(hotel.images || []).map((img, idx) => (
          <View
            key={idx}
            className="album-item"
            onClick={() => onPreview(idx)}
          >
            <Image src={img} mode="aspectFill" className="album-image" />
          </View>
        ))}
      </View>
    </View>
  );
}

