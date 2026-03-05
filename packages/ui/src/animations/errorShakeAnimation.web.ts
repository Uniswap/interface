/**
 * Web implementation - no-op for error shake animation.
 *
 * On web, shake animations should be handled via CSS animations or
 * the component's own animation system rather than Reanimated.
 */

export interface SharedValue<T> {
  value: T
}

/**
 * No-op on web - returns 0 (no shake offset).
 * Web implementations should use CSS animations for shake effects.
 */
export function errorShakeAnimation(_input: SharedValue<number>): number {
  return 0
}
