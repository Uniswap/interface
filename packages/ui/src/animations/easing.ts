/**
 * Platform-agnostic Easing exports.
 *
 * - Native: Re-exports from react-native-reanimated (easing.native.ts)
 * - Web: Exports no-op functions (easing.web.ts)
 */

export type EasingFn = (t: number) => number

export const Easing = {
  ease: ((t: number) => t) as EasingFn,
  linear: ((t: number) => t) as EasingFn,
  quad: ((t: number) => t * t) as EasingFn,
  cubic: ((t: number) => t * t * t) as EasingFn,
  exp: ((t: number) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1)))) as EasingFn,
  in: (easing: EasingFn): EasingFn => easing,
  out: (easing: EasingFn): EasingFn => easing,
  inOut: (easing: EasingFn): EasingFn => easing,
  elastic:
    (_bounciness?: number): EasingFn =>
    (t: number) =>
      t,
  bounce: ((t: number) => t) as EasingFn,
  // eslint-disable-next-line max-params -- matches react-native-reanimated API
  bezier:
    (_x1: number, _y1: number, _x2: number, _y2: number): EasingFn =>
    (t: number) =>
      t,
}
