import { ImageResizeMode, StyleSheet } from 'react-native'

const RESIZE_MODE_CONTAIN: ImageResizeMode = 'contain'

export const style = StyleSheet.create({
  image: {
    resizeMode: RESIZE_MODE_CONTAIN,
  },
  innerWrapper: {
    borderRadius: 6,
  },
})

export const SHADOW_OFFSET = { width: 0, height: 2 }

export const THIN_BORDER = 0.5
