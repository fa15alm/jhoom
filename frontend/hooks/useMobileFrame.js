import { useWindowDimensions } from "react-native";

export default function useMobileFrame() {
  const { width, height } = useWindowDimensions();
  const isCompactWidth = width < 390;
  const isShortHeight = height < 780;
  const shellPaddingHorizontal = isCompactWidth ? 10 : 14;
  const shellPaddingVertical = isShortHeight ? 12 : 18;
  const innerPaddingHorizontal = isCompactWidth ? 16 : 20;
  const innerPaddingTop = isShortHeight ? 24 : 34;
  const innerPaddingBottom = isShortHeight ? 18 : 26;
  const shellMinHeight = Math.max(height - shellPaddingVertical * 2, 660);
  const sliderWidth = Math.min(width - (isCompactWidth ? 52 : 72), 420);
  const cardWidth = sliderWidth - 36;
  const wordmarkSize = isCompactWidth ? 44 : 52;

  return {
    width,
    height,
    isCompactWidth,
    isShortHeight,
    shellPaddingHorizontal,
    shellPaddingVertical,
    innerPaddingHorizontal,
    innerPaddingTop,
    innerPaddingBottom,
    shellMinHeight,
    sliderWidth,
    cardWidth,
    wordmarkSize,
  };
}
