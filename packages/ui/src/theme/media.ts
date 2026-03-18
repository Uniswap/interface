import { createMedia } from '@tamagui/react-native-media-driver'
import { breakpoints, heightBreakpoints } from 'ui/src/theme'

export const media = createMedia({
  // the order here is important: least strong to most
  xxxl: { maxWidth: breakpoints.xxxl },
  xxl: { maxWidth: breakpoints.xxl },
  xl: { maxWidth: breakpoints.xl },
  lg: { maxWidth: breakpoints.lg },
  md: { maxWidth: breakpoints.md },
  sm: { maxWidth: breakpoints.sm },
  xs: { maxWidth: breakpoints.xs },
  xxs: { maxWidth: breakpoints.xxs },
  short: { maxHeight: heightBreakpoints.short },
  midHeight: { maxHeight: heightBreakpoints.midHeight },
  lgHeight: { maxHeight: heightBreakpoints.lgHeight },
})
