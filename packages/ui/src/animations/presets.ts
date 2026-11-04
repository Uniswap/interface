// for now only enter/exit though we can change this in the future to support
// any type of animation, likely we'd want to split that into multiple files

/** `x`/`y` are the legacy transform shorthands, not CSS properties. */
type EnterExitStyle = { opacity?: number; x?: number; y?: number }

type EnterExitStyles = Record<string, { enterStyle?: EnterExitStyle; exitStyle?: EnterExitStyle }>

// TODO(INFRA-4485): Move the remaining consumers to mycelium's enter/exit preset classes, then delete this file.

/** @deprecated Use `ENTER_PRESET_CLASSES` from `@universe/mycelium/compat`, with `Presence` from `@universe/mycelium/presence`, instead. */
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
  // The directional presets below are named for the enter ORIGIN (from the
  // left / right / below), mirroring their spore-enter-fade-in-* keyframe
  // names — unlike fadeInDown, which is named for the motion direction.
  fadeInLeft: {
    enterStyle: {
      x: -10,
      opacity: 0,
    },
  },
  fadeInRight: {
    enterStyle: {
      x: 10,
      opacity: 0,
    },
  },
  fadeInBelow: {
    enterStyle: {
      y: 10,
      opacity: 0,
    },
  },
} satisfies EnterExitStyles

/** @deprecated Use `EXIT_PRESET_CLASSES` from `@universe/mycelium/compat`, with `Presence` from `@universe/mycelium/presence`, instead. */
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

/** @deprecated Use `ENTER_EXIT_PRESET_CLASSES` from `@universe/mycelium/compat`, with `Presence` from `@universe/mycelium/presence`, instead. */
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

/** @deprecated Use `ENTER_PRESET_CLASSES` / `EXIT_PRESET_CLASSES` / `ENTER_EXIT_PRESET_CLASSES` from `@universe/mycelium/compat`, with `Presence` from `@universe/mycelium/presence`, instead. */
export const animationPresets = {
  ...animationsEnter,
  ...animationsExit,
  ...animationsEnterExit,
} satisfies EnterExitStyles
