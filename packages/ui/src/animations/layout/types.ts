import type { LayoutAnimationStatic } from 'react-native'

export type LayoutAnimationOptions = {
  shouldSkip?: boolean
  preset?: keyof LayoutAnimationStatic['Presets']
  duration?: number
}
