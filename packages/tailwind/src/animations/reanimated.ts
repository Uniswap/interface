/**
 * Reanimated adapter for the Spore animation preset curves (INFRA-2967).
 *
 * Materializes the platform-agnostic curve data from `./curves` into real
 * `react-native-reanimated` configs/animations. Native-only: import via the
 * `@universe/tailwind/animations/reanimated` subpath from React Native code
 * (hand-written Reanimated call sites, the native mycelium compat layer) —
 * never from web bundles, which should import `@universe/tailwind/animations`
 * for the pure data instead.
 *
 * Exact-port contract: the config getters forward precisely the keys the legacy
 * Tamagui moti driver forwards for the same preset — declared keys verbatim,
 * no defaults filled in, `delay` applied via `withDelay` outside the config —
 * so a converted call site animates byte-identically to its legacy
 * `animation="<name>"` counterpart. `withSporeCurve` is the exception: it adds
 * `reduceMotion: ReduceMotion.System` so the OS setting jumps to the target.
 */
import type {
  AnimationCallback,
  EasingFunction,
  EasingFunctionFactory,
  EntryExitAnimationFunction,
  WithSpringConfig,
  WithTimingConfig,
} from 'react-native-reanimated'
import { Easing, ReduceMotion, withDelay, withSpring, withTiming } from 'react-native-reanimated'
import type {
  SporeAnimationCurve,
  SporeAnimationCurveName,
  SporeEasing,
  SporeSpringCurve,
  SporeSpringCurveName,
  SporeTimingCurve,
  SporeTimingCurveName,
} from './curves'
import { SPORE_ANIMATION_CURVES } from './curves'

// Widened view of the curve map: the literal entry types (which ./curves needs
// to derive the timing/spring name subsets) omit the optional fields their
// members don't declare, so name-generic access goes through the interfaces.
const CURVES: Record<SporeAnimationCurveName, SporeAnimationCurve> = SPORE_ANIMATION_CURVES

type ReanimatedEasing = EasingFunction | EasingFunctionFactory

/**
 * Resolves a declarative {@link SporeEasing} to the Reanimated easing the
 * legacy driver config constructed (`Easing.inOut(Easing.quad)` /
 * `Easing.bezier(...)`).
 */
export function getSporeEasing(easing: SporeEasing): ReanimatedEasing {
  'worklet'
  switch (easing.fn) {
    case 'inOutQuad':
      return Easing.inOut(Easing.quad)
    case 'bezier':
      return Easing.bezier(easing.x1, easing.y1, easing.x2, easing.y2)
    default: {
      // Defect guard: SporeEasing is a closed union; a new member must be
      // materialized here explicitly.
      const unreachable: never = easing
      throw new Error(`unknown Spore easing: ${JSON.stringify(unreachable)}`)
    }
  }
}

function timingConfigFromCurve(curve: SporeTimingCurve): WithTimingConfig {
  'worklet'
  const config: WithTimingConfig = { duration: curve.duration }
  if (curve.easing !== undefined) {
    config.easing = getSporeEasing(curve.easing)
  }
  return config
}

function springConfigFromCurve(curve: SporeSpringCurve): WithSpringConfig {
  'worklet'
  const config: { damping: number; stiffness?: number; mass?: number; duration?: number } = {
    damping: curve.damping,
  }
  if (curve.stiffness !== undefined) {
    config.stiffness = curve.stiffness
  }
  if (curve.mass !== undefined) {
    config.mass = curve.mass
  }
  if (curve.duration !== undefined) {
    config.duration = curve.duration
  }
  // SAFETY: WithSpringConfig's physical/duration halves are declared mutually
  // exclusive, but the 200msDelayed* family deliberately forwards
  // { damping, duration } — the exact key set the legacy moti driver forwards
  // to withSpring for those presets (Reanimated resolves it on its
  // duration-based path). See SporeSpringCurve in ./curves.
  return config as WithSpringConfig
}

/**
 * `withTiming` config for a duration-based Spore curve, exactly as the legacy
 * driver forwarded it (easing only when the preset declares one; `delay` is
 * NOT part of the config — see {@link getSporeCurveDelayMs}).
 */
export function getSporeTimingConfig(name: SporeTimingCurveName): WithTimingConfig {
  'worklet'
  return timingConfigFromCurve(SPORE_ANIMATION_CURVES[name])
}

/**
 * `withSpring` config for a physics-based Spore curve, exactly as the legacy
 * driver forwarded it (declared keys only, no defaults filled in; `delay` is
 * NOT part of the config — see {@link getSporeCurveDelayMs}).
 */
export function getSporeSpringConfig(name: SporeSpringCurveName): WithSpringConfig {
  'worklet'
  return springConfigFromCurve(SPORE_ANIMATION_CURVES[name])
}

/**
 * The preset's start delay in milliseconds, or `undefined` when it has none.
 * Apply it by wrapping the animation in `withDelay` (what
 * {@link withSporeCurve} does), mirroring the legacy driver.
 */
export function getSporeCurveDelayMs(name: SporeAnimationCurveName): number | undefined {
  'worklet'
  return CURVES[name].delay
}

/**
 * Drop-in animation builder for a Spore preset: returns the
 * `withTiming`/`withSpring` (plus `withDelay` when the preset declares one)
 * animation a legacy `animation="<name>"` site produces, targeting `toValue`.
 *
 * Usage from hand-written Reanimated code:
 * `offset.value = withSporeCurve('quick', 1)`.
 *
 * `callback` MUST carry a `'worklet'` directive: it runs on the UI runtime
 * when the animation settles, and Reanimated's babel plugin does not
 * auto-workletize arguments of user-land helpers like this one (only direct
 * arguments of its own APIs). A plain JS callback hard-crashes iOS Fabric
 * ("Tried to synchronously call a non-worklet function on the UI thread") —
 * found on device during INFRA-3344 QA.
 *
 * `reduceMotion: ReduceMotion.System` is the one key added on top of the legacy
 * config, so an OS "reduce motion" setting snaps to `toValue` instead of
 * playing the curve. The config getters stay key-for-key with the legacy driver.
 */
// oxlint-disable-next-line max-params -- mirrors the (toValue, config, callback) shape of withTiming/withSpring
export function withSporeCurve(name: SporeAnimationCurveName, toValue: number, callback?: AnimationCallback): number {
  'worklet'
  const curve = CURVES[name]
  const config = curve.type === 'timing' ? timingConfigFromCurve(curve) : springConfigFromCurve(curve)
  config.reduceMotion = ReduceMotion.System
  const animation =
    curve.type === 'timing' ? withTiming(toValue, config, callback) : withSpring(toValue, config, callback)
  return curve.delay === undefined ? animation : withDelay(curve.delay, animation)
}

/**
 * `entering` animation for the legacy Tamagui 'quick' mount-in fade
 * (enterStyle opacity 0 -> rest), for call sites that fade in on mount.
 */
export const fadeInQuick: EntryExitAnimationFunction = () => {
  'worklet'
  return {
    initialValues: { opacity: 0 },
    animations: { opacity: withSporeCurve('quick', 1) },
  }
}
