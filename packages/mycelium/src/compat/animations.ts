/**
 * Enter/exit animation presets mirroring `ui/src/animations/presets.ts`.
 *
 * Each preset maps to a `--animate-spore-*` utility from
 * `@universe/tailwind/css/compat.css`:
 *  - Enter presets apply on mount — the keyframes declare only the start frame
 *    (the Tamagui `enterStyle`), so the animation ends at the element's own
 *    computed style, exactly like Tamagui animating enterStyle → base style.
 *    Presets with an opacity enter state also pin the base `opacity` end
 *    state, mirroring what Tamagui emits for the same props.
 *  - Exit presets are gated behind `[data-exiting]`: pure CSS cannot observe
 *    unmount, so the caller (or a presence helper) sets `data-exiting` to run
 *    the exit animation before removal. The keyframe end frames equal the
 *    Tamagui `exitStyle` definitions; the parity suite checks both.
 *
 * Animation timing is a fixed CSS approximation — Tamagui's runtime timing
 * comes from its animation driver (`animation` prop) and is out of scope for
 * the static parity contract.
 */

export const ENTER_PRESET_CLASSES = {
  fadeIn: 'animate-spore-enter-fade-in opacity-[1]',
  fadeInDown: 'animate-spore-enter-fade-in-down opacity-[1]',
} as const

export const EXIT_PRESET_CLASSES = {
  fadeOut: 'data-exiting:animate-spore-exit-fade-out opacity-[1]',
  fadeOutUp: 'data-exiting:animate-spore-exit-fade-out-up opacity-[1]',
  fadeOutDown: 'data-exiting:animate-spore-exit-fade-out-down opacity-[1]',
} as const

export const ENTER_EXIT_PRESET_CLASSES = {
  fadeInDownOutUp: `${ENTER_PRESET_CLASSES.fadeInDown} ${EXIT_PRESET_CLASSES.fadeOutUp}`,
  fadeInDownOutDown: `${ENTER_PRESET_CLASSES.fadeInDown} ${EXIT_PRESET_CLASSES.fadeOutDown}`,
  fadeInOut: `${ENTER_PRESET_CLASSES.fadeIn} ${EXIT_PRESET_CLASSES.fadeOut}`,
} as const

export type AnimateEnterPreset = keyof typeof ENTER_PRESET_CLASSES
export type AnimateExitPreset = keyof typeof EXIT_PRESET_CLASSES
export type AnimateEnterExitPreset = keyof typeof ENTER_EXIT_PRESET_CLASSES
