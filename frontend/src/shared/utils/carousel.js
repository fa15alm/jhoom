export function getPagedCarouselIndex(event, pageWidth, itemCount) {
  if (!pageWidth || itemCount <= 0) {
    return 0;
  }

  const offsetX = event?.nativeEvent?.contentOffset?.x ?? 0;
  const nextIndex = Math.round(offsetX / pageWidth);

  return Math.max(0, Math.min(nextIndex, itemCount - 1));
}
