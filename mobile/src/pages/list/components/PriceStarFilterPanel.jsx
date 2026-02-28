import { View, Text, Slider } from '@tarojs/components';

export default function PriceStarFilterPanel(props) {
  const {
    visible,
    priceRanges,
    priceSliderValue,
    onPriceChange,
    onPriceChanging,
    starOptions,
    selectedStars,
    onToggleStar,
    onReset,
    onDone
  } = props;

  if (!visible) return null;

  return (
    <View className="panel panel-filter">
      <View className="filter-block">
        <Text className="filter-title">价格区间（每晚）</Text>
        <View className="price-slider-row">
          <Slider
            className="price-slider"
            min={0}
            max={priceRanges.length - 1}
            step={1}
            value={priceSliderValue}
            activeColor="#1677ff"
            backgroundColor="#e5e5e5"
            blockSize={16}
            showValue={false}
            onChange={onPriceChange}
            onChanging={onPriceChanging}
          />
          <View className="price-slider-labels">
            {priceRanges.map((range, index) => (
              <Text
                key={range}
                className={`price-slider-label ${index === priceSliderValue ? 'active' : ''}`}
              >
                {range}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <View className="filter-block">
        <Text className="filter-title">酒店星级</Text>
        <View className="filter-options">
          {starOptions.map((star) => {
            const checked = selectedStars.includes(star);
            return (
              <View
                key={star}
                className={`filter-option ${checked ? 'checked' : ''}`}
                onClick={() => onToggleStar && onToggleStar(star)}
              >
                <View className="checkbox">
                  <View className="checkbox-inner" />
                </View>
                <Text className="filter-option-label">{star}星</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className="filter-footer">
        <View className="filter-footer-reset" onClick={onReset}>
          <Text>重置</Text>
        </View>
        <View className="filter-footer-confirm" onClick={onDone}>
          <Text>完成</Text>
        </View>
      </View>
    </View>
  );
}

