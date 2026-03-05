/**
 * Web implementation - provides easing functions compatible with CSS transitions.
 *
 * On web, these functions are primarily used for configuration rather than
 * actual animation calculations. The easing values are converted to CSS
 * timing functions or simply ignored when used with no-op animation builders.
 */

export type EasingFn = (t: number) => number

// Simple easing implementations for completeness
const linear: EasingFn = (t) => t
const ease: EasingFn = (t) => t * t * (3 - 2 * t) // smoothstep
const quad: EasingFn = (t) => t * t
const cubic: EasingFn = (t) => t * t * t

export const Easing = {
  ease,
  linear,
  quad,
  cubic,
  sin: (t: number): number => 1 - Math.cos((t * Math.PI) / 2),
  circle: (t: number): number => 1 - Math.sqrt(1 - t * t),
  exp: (t: number): number => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  poly:
    (n: number): EasingFn =>
    (t) =>
      Math.pow(t, n),
  back:
    (s = 1.70158): EasingFn =>
    (t) =>
      t * t * ((s + 1) * t - s),
  bounce: (t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t
    }
    if (t < 2 / 2.75) {
      const t2 = t - 1.5 / 2.75
      return 7.5625 * t2 * t2 + 0.75
    }
    if (t < 2.5 / 2.75) {
      const t2 = t - 2.25 / 2.75
      return 7.5625 * t2 * t2 + 0.9375
    }
    const t2 = t - 2.625 / 2.75
    return 7.5625 * t2 * t2 + 0.984375
  },
  elastic: (bounciness = 1): EasingFn => {
    const p = bounciness * Math.PI
    return (t) => 1 - Math.pow(Math.cos((t * Math.PI) / 2), 3) * Math.cos(t * p)
  },
  // eslint-disable-next-line max-params -- matches react-native-reanimated API
  bezier: (x1: number, y1: number, x2: number, y2: number): EasingFn => {
    // Simple cubic bezier approximation
    return (t) => {
      const cx = 3 * x1
      const bx = 3 * (x2 - x1) - cx
      const ax = 1 - cx - bx
      return ((ax * t + bx) * t + cx) * t * (((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t + 3 * y1) + y1 * t
    }
  },
  in: (easing: EasingFn): EasingFn => easing,
  out:
    (easing: EasingFn): EasingFn =>
    (t) =>
      1 - easing(1 - t),
  inOut:
    (easing: EasingFn): EasingFn =>
    (t) =>
      t < 0.5 ? easing(t * 2) / 2 : 1 - easing((1 - t) * 2) / 2,
}
