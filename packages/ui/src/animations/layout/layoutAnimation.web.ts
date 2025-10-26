import { DEFAULT_LAYOUT_ANIMATION_DURATION } from 'ui/src/animations/layout/constants'
import type { LayoutAnimationOptions } from 'ui/src/animations/layout/types'

const DEFAULT_OPTIONS: Required<LayoutAnimationOptions> = {
  preset: 'easeInEaseOut',
  shouldSkip: false,
  duration: DEFAULT_LAYOUT_ANIMATION_DURATION,
}

export function easeInEaseOutLayoutAnimation(options?: LayoutAnimationOptions): void {
  const mergedOptions = options ? { ...DEFAULT_OPTIONS, ...options } : DEFAULT_OPTIONS

  if (mergedOptions.shouldSkip) {
    return
  }

  // Apply a global CSS class to trigger animations
  const animationClass = getCssClassForPreset(mergedOptions.preset)
  document.body.classList.add(animationClass)

  // Remove the class after the animation ends
  setTimeout(() => {
    document.body.classList.remove(animationClass)
  }, getAnimationDurationForPreset(mergedOptions.preset))
}

function getCssClassForPreset(preset: string): string {
  // These are defined in apps/web/src/global.css
  switch (preset) {
    case 'easeInEaseOut':
      return 'layout-animation-ease-in-ease-out'
    case 'linear':
      return 'layout-animation-linear'
    default:
      return 'layout-animation-ease-in-ease-out'
  }
}

function getAnimationDurationForPreset(preset: string): number {
  // Be sure these match up with the durations in apps/web/src/global.css
  switch (preset) {
    case 'easeInEaseOut':
      return 300
    case 'linear':
      return 200
    default:
      return 300
  }
}
