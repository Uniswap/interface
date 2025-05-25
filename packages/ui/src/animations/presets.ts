import type { ViewStyle } from 'tamagui'

// for now only enter/exit though we can change this in the future to support
// any type of animation, likely we'd want to split that into multiple files
type EnterExitStyles = Record<string, Pick<ViewStyle, 'enterStyle' | 'exitStyle'>>

export const animationsEnter = {
  fadeIn: {
    enterStyle: {
      opacity: 0,
    },
  },
  fadeInDown: {
    enterStyle: {
      y: -10,
      opacity: 0,
    },
  },
} satisfies EnterExitStyles

export const animationsExit = {
  fadeOut: {
    exitStyle: {
      opacity: 0,
    },
  },
  fadeOutUp: {
    exitStyle: {
      y: -10,
      opacity: 0,
    },
  },
  fadeOutDown: {
    exitStyle: {
      y: 10,
      opacity: 0,
    },
  },
} satisfies EnterExitStyles

export const animationsEnterExit = {
  fadeInDownOutUp: {
    ...animationsEnter.fadeInDown,
    ...animationsExit.fadeOutUp,
  },
  fadeInDownOutDown: {
    ...animationsEnter.fadeInDown,
    ...animationsExit.fadeOutDown,
  },
  fadeInOut: {
    ...animationsEnter.fadeIn,
    ...animationsExit.fadeOut,
  },
} satisfies EnterExitStyles

export const animationPresets = {
  ...animationsEnter,
  ...animationsExit,
  ...animationsEnterExit,
} satisfies EnterExitStyles
