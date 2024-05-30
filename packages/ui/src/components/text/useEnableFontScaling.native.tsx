import { useWindowDimensions } from 'react-native'

const DEFAULT_FONT_SCALE = 1

export const useEnableFontScaling = (allowFontScaling?: boolean): boolean => {
  const { fontScale } = useWindowDimensions()
  return allowFontScaling ?? fontScale > DEFAULT_FONT_SCALE
}
