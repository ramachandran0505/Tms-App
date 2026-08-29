import { useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const BREAKPOINTS = {
  smallMobile: 480,
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
};

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallMobile = width < BREAKPOINTS.smallMobile;
  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.tablet;
  const isLargeDesktop = width >= BREAKPOINTS.desktop;

  const isPortrait = height >= width;
  const isLandscape = width > height;

  /**
   * Helper to calculate responsive grid column widths
   * @param {number} smallMobileCols
   * @param {number} mobileCols
   * @param {number} tabletCols
   * @param {number} desktopCols
   * @param {number} gap
   */
  const getGridItemWidth = (
    smallMobileCols = 1,
    mobileCols = 1,
    tabletCols = 2,
    desktopCols = 4,
    gap = 12
  ) => {
    let cols = desktopCols;
    if (isSmallMobile) cols = smallMobileCols;
    else if (isMobile) cols = mobileCols;
    else if (isTablet) cols = tabletCols;

    if (cols <= 1) return '100%';
    if (Platform.OS === 'web') {
      const percent = 100 / cols;
      const gapOffset = ((cols - 1) * gap) / cols;
      return `calc(${percent}% - ${gapOffset}px)`;
    }
    const availableWidth = width - horizontalPadding * 2;
    const itemWidth = Math.floor((availableWidth - (cols - 1) * gap) / cols);
    return Math.max(0, itemWidth);
  };

  /**
   * Dynamic container max-width for web
   */
  const containerMaxWidth = Math.min(1300, width - (isMobile ? 24 : 48));

  /**
   * Content horizontal padding
   */
  const horizontalPadding = isSmallMobile ? 12 : isMobile ? 16 : isTablet ? 24 : 32;

  return {
    width,
    height,
    insets,
    isSmallMobile,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isPortrait,
    isLandscape,
    isWeb: Platform.OS === 'web',
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    getGridItemWidth,
    containerMaxWidth,
    horizontalPadding,
  };
};

export default useResponsive;
