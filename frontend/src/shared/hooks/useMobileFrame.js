/*
 * Responsive layout helper.
 *
 * All screens use this hook to share the same mobile-first spacing rules. This
 * keeps the Expo app and mobile browser/webview layouts consistent across small
 * and large phones instead of each screen inventing its own dimensions.
 */
import { useWindowDimensions } from "react-native";

export default function useMobileFrame() {
  const { width, height } = useWindowDimensions();
  // These breakpoints tune the phone-sized shell for compact and short devices.
  // The app is intentionally designed around phone widths rather than desktop.
  const isCompactWidth = width < 390;
  const isShortHeight = height < 780;
  const shellPaddingHorizontal = isCompactWidth ? 10 : 14;
  const shellPaddingVertical = isShortHeight ? 12 : 18;
  const innerPaddingHorizontal = isCompactWidth ? 16 : 20;
  const innerPaddingTop = isShortHeight ? 24 : 34;
  const innerPaddingBottom = isShortHeight ? 18 : 26;
  const shellMinHeight = Math.max(
    height - shellPaddingVertical * 2,
    isShortHeight ? 560 : 660,
  );
  // sliderWidth is the outer carousel width; cardWidth is the internal card
  // width after carousel side padding. Keeping both here aligns every screen.
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
