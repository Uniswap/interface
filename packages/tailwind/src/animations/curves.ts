/**
 * Spore animation preset curves — the shared curve library (INFRA-2967).
 *
 * The timing/spring numbers are ported byte-exact from the legacy Tamagui
 * animation driver config (native, plus its generated `delay200ms` family),
 * and the CSS strings from its web driver. This module is pure data — platform-agnostic and
 * safe to import from web bundles. Native consumers materialize the curves
 * into Reanimated configs via `./reanimated` (subpath
 * `@universe/tailwind/animations/reanimated`); the mycelium compat props
 * reference the curve names for their `animation` prop surface.
 */

/**
 * Declarative easing for a timing curve.
 *
 * - `inOutQuad` → Reanimated `Easing.inOut(Easing.quad)` (also Reanimated's
 *   own `withTiming` default, kept explicit where the legacy config declared
 *   it).
 * - `bezier` → Reanimated `Easing.bezier(x1, y1, x2, y2)` / CSS
 *   `cubic-bezier(x1, y1, x2, y2)`.
 */
export type SporeEasing =
  | { readonly fn: 'inOutQuad' }
  | { readonly fn: 'bezier'; readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number }

/**
 * A duration-based curve. `easing` is omitted where the legacy config omitted
 * it — Reanimated's `withTiming` then applies its own default
 * (`Easing.inOut(Easing.quad)`); forwarding no easing keeps that contract
 * byte-identical. `delay` is applied by wrapping in `withDelay`, never inside
 * the timing config (mirrors the moti driver).
 */
export interface SporeTimingCurve {
  readonly type: 'timing'
  readonly duration: number
  readonly easing?: SporeEasing
  readonly delay?: number
}

/**
 * A physics-based curve. Only the keys the legacy config declared are
 * present — consumers must forward declared keys verbatim and never fill
 * defaults (Reanimated 4 defaults differ from 2/3, e.g. `mass` now defaults
 * to 4; the legacy sites inherit the new defaults, so the port must too).
 *
 * The `200msDelayed*` family carries `duration` (no `stiffness`): the legacy
 * source declares `{ stiff: 150, damping: 30, duration: 200 }` and the moti
 * driver forwards only real `withSpring` keys, so `stiff` never reaches
 * Reanimated while `duration` does — which switches Reanimated ≥3.6 onto its
 * duration-based spring path (`dampingRatio` defaulting to 1, stiffness
 * recomputed to match the duration; the forwarded `damping` is physics-inert
 * there). This library forwards exactly the same keys, so the resolved
 * behavior is identical by construction.
 */
export interface SporeSpringCurve {
  readonly type: 'spring'
  readonly damping: number
  readonly stiffness?: number
  readonly mass?: number
  readonly duration?: number
  readonly delay?: number
}

/** A Spore animation preset curve: duration-based or physics-based. */
export type SporeAnimationCurve = SporeTimingCurve | SporeSpringCurve

const IN_OUT_QUAD: SporeEasing = { fn: 'inOutQuad' }

/**
 * The Spore animation preset curves, keyed by the legacy Tamagui `animation`
 * prop names. Values mirror the legacy native driver config field-for-field
 * (see `SporeSpringCurve` for the one documented exception in
 * the `200msDelayed*` family).
 */
export const SPORE_ANIMATION_CURVES = {
  '100ms': { type: 'timing', duration: 100 },
  '125ms': { type: 'timing', duration: 125, easing: IN_OUT_QUAD },
  '125msDelayed': { type: 'timing', duration: 125, easing: IN_OUT_QUAD, delay: 250 },
  '125msDelayedLong': { type: 'timing', duration: 125, easing: IN_OUT_QUAD, delay: 2000 },
  '200ms': { type: 'timing', duration: 200 },
  '200msDelayed1ms': { type: 'spring', damping: 30, duration: 200, delay: 1 },
  '200msDelayed40ms': { type: 'spring', damping: 30, duration: 200, delay: 40 },
  '200msDelayed80ms': { type: 'spring', damping: 30, duration: 200, delay: 80 },
  '200msDelayed120ms': { type: 'spring', damping: 30, duration: 200, delay: 120 },
  '200msDelayed160ms': { type: 'spring', damping: 30, duration: 200, delay: 160 },
  '200msDelayed200ms': { type: 'spring', damping: 30, duration: 200, delay: 200 },
  '200msDelayed240ms': { type: 'spring', damping: 30, duration: 200, delay: 240 },
  '300ms': { type: 'timing', duration: 300 },
  '300msDelayed': { type: 'timing', duration: 300, easing: IN_OUT_QUAD, delay: 150 },
  '80ms-ease-in-out': { type: 'timing', duration: 80, easing: IN_OUT_QUAD },
  stiff: { type: 'spring', mass: 1, damping: 200, stiffness: 400 },
  bouncy: { type: 'spring', damping: 10, mass: 0.9, stiffness: 100 },
  semiBouncy: { type: 'spring', damping: 12, mass: 0.7, stiffness: 100 },
  lazy: { type: 'spring', damping: 20, stiffness: 60 },
  quick: { type: 'spring', damping: 20, mass: 1.2, stiffness: 250 },
  quickLong: { type: 'timing', duration: 300, easing: { fn: 'bezier', x1: 0.25, y1: 0.46, x2: 0.45, y2: 0.94 } },
  quicker: { type: 'spring', damping: 18, mass: 0.9, stiffness: 390 },
  quickishDelayed: { type: 'spring', damping: 18, mass: 0.9, stiffness: 200, delay: 70 },
  fast: { type: 'spring', damping: 75, stiffness: 1000, mass: 1 },
  fastHeavy: { type: 'spring', damping: 75, stiffness: 1000, mass: 1.4 },
  fastExit: { type: 'spring', damping: 200, stiffness: 1250, mass: 1 },
  fastExitHeavy: { type: 'spring', damping: 200, stiffness: 1250, mass: 1.4 },
  simple: { type: 'timing', duration: 80 },
} as const satisfies Record<string, SporeAnimationCurve>

/** Every Spore animation curve name (the legacy `animation` prop vocabulary). */
export type SporeAnimationCurveName = keyof typeof SPORE_ANIMATION_CURVES

/** The duration-based subset of {@link SporeAnimationCurveName}. */
export type SporeTimingCurveName = {
  [K in SporeAnimationCurveName]: (typeof SPORE_ANIMATION_CURVES)[K] extends { readonly type: 'timing' } ? K : never
}[SporeAnimationCurveName]

/** The physics-based subset of {@link SporeAnimationCurveName}. */
export type SporeSpringCurveName = {
  [K in SporeAnimationCurveName]: (typeof SPORE_ANIMATION_CURVES)[K] extends { readonly type: 'spring' } ? K : never
}[SporeAnimationCurveName]

/**
 * CSS shorthand equivalents (`<duration> <timing-function> [<delay>]`), ported
 * byte-exact from the legacy web driver (`index.web.ts`). Springs are the
 * legacy driver's fixed cubic-bezier approximations — web has no spring
 * runtime; these are what Tamagui web sites render today.
 */
export const SPORE_ANIMATION_CURVE_CSS: Record<SporeAnimationCurveName, string> = {
  '100ms': '100ms ease-in-out',
  '125ms': '125ms ease-in-out',
  '125msDelayed': '125ms ease-in-out 250ms',
  '125msDelayedLong': '125ms ease-in-out 2000ms',
  '200ms': '200ms ease-in-out',
  '200msDelayed1ms': '200ms ease-out 1ms',
  '200msDelayed40ms': '200ms ease-out 40ms',
  '200msDelayed80ms': '200ms ease-out 80ms',
  '200msDelayed120ms': '200ms ease-out 120ms',
  '200msDelayed160ms': '200ms ease-out 160ms',
  '200msDelayed200ms': '200ms ease-out 200ms',
  '200msDelayed240ms': '200ms ease-out 240ms',
  '300ms': '300ms ease-in-out',
  '300msDelayed': '300ms ease-in-out 150ms',
  '80ms-ease-in-out': '80ms ease-in-out',
  stiff: '150ms cubic-bezier(0.17, 0.67, 0.45, 1)',
  bouncy: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  semiBouncy: '350ms cubic-bezier(0.25, 1.25, 0.5, 1)',
  lazy: '500ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  quick: '200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  quickLong: '300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  quicker: '180ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  quickishDelayed: '200ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 70ms',
  fast: '100ms cubic-bezier(0.17, 0.67, 0.45, 1)',
  fastHeavy: '120ms cubic-bezier(0.17, 0.67, 0.45, 1)',
  fastExit: '80ms cubic-bezier(0.17, 0.67, 0.45, 1)',
  fastExitHeavy: '100ms cubic-bezier(0.17, 0.67, 0.45, 1)',
  simple: '80ms ease-in-out',
}

/**
 * All curve names in the legacy config's declaration order — for iteration
 * (demos, docs) without `Object.keys` casts at every call site.
 */
// SAFETY: SPORE_ANIMATION_CURVES is a closed const literal, so its runtime keys
// are exactly the SporeAnimationCurveName union.
export const SPORE_ANIMATION_CURVE_NAMES = Object.keys(SPORE_ANIMATION_CURVES) as readonly SporeAnimationCurveName[]
