import { LayoutAnimation, UIManager } from 'react-native'
import { LayoutAnimationOptions } from 'ui/src/animations/layout/types'
import { isAndroid } from 'utilities/src/platform'

const DEFAULT_OPTIONS: Required<LayoutAnimationOptions> = {
  preset: 'easeInEaseOut',
  shouldSkip: false,
}

// Required for Android, at least as of RN 0.76.x
// https://reactnative.dev/docs/animations.html#layoutanimation-api
if (isAndroid) {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true)
  }
}

export function easeInEaseOutLayoutAnimation(options?: LayoutAnimationOptions): void {
  const mergedOptions = options ? { ...DEFAULT_OPTIONS, ...options } : DEFAULT_OPTIONS

  if (mergedOptions?.shouldSkip) {
    return
  }

  LayoutAnimation.configureNext(LayoutAnimation.Presets[mergedOptions.preset])
}
