import { isWebPlatform } from '@universe/environment'
import type { EntryExitAnimationFunction } from 'react-native-reanimated'
import type { SporeAnimationCurveName } from './curves'
import { withSporeCurve } from './reanimated'

type SlideAxis = 'translateX' | 'translateY'

// Worklet itself: called from inside the entering/exiting worklets below, which run on the UI
// thread and can only call other worklets, not plain JS functions.
function transformFor(axis: SlideAxis, value: number): [{ translateX: number }] | [{ translateY: number }] {
  'worklet'
  return axis === 'translateX' ? [{ translateX: value }] : [{ translateY: value }]
}

// All-optional (rather than a union with `{}`) so spreading it into the merged return type below
// type-checks as a plain intersection instead of TS distributing over a union member-by-member.
type WebAnimationProps = Partial<{
  animation: SporeAnimationCurveName
  animateOnly: string[]
  enterStyle: object
  exitStyle: object
}>

/**
 * A symmetric opacity + single-axis translate enter/exit pair, the shape behind several ported
 * Tamagui `enterStyle`/`exitStyle` presence sites that only ever varied by curve/axis/offset.
 * Returns one prop bag - spread directly onto an `AnimatedFlex` - bundling the native
 * `entering`/`exiting` worklets with their web CSS-transition leg (AnimatedFlex ignores
 * entering/exiting on web, so the latter is what actually animates there; empty on native so
 * mycelium's compat layer doesn't dev-warn about the unsupported `animation` prop). A single
 * merged return makes the two legs structurally impossible to drift apart, unlike two exports a
 * caller has to keep in sync by hand.
 *
 * The web `exitStyle` only gets a frame to animate if the caller keeps the node mounted through
 * unmount, e.g. by wrapping the conditional render in mycelium's `Presence`. Without that,
 * the enter leg still works but the exit leg is inert on web (native's `exiting` fires regardless).
 */
export function createSlideFadePresence(
  curve: SporeAnimationCurveName,
  config: { axis: SlideAxis; offset: number },
): { entering: EntryExitAnimationFunction; exiting: EntryExitAnimationFunction } & WebAnimationProps {
  const { axis, offset } = config
  const entering: EntryExitAnimationFunction = () => {
    'worklet'
    return {
      initialValues: { opacity: 0, transform: transformFor(axis, offset) },
      animations: { opacity: withSporeCurve(curve, 1), transform: transformFor(axis, withSporeCurve(curve, 0)) },
    }
  }
  const exiting: EntryExitAnimationFunction = () => {
    'worklet'
    return {
      initialValues: { opacity: 1, transform: transformFor(axis, 0) },
      animations: {
        opacity: withSporeCurve(curve, 0),
        transform: transformFor(axis, withSporeCurve(curve, offset)),
      },
    }
  }
  return { entering, exiting, ...createSlideFadeWebAnimation(curve, config) }
}

function createSlideFadeWebAnimation(
  curve: SporeAnimationCurveName,
  config: { axis: SlideAxis; offset: number },
): WebAnimationProps {
  if (!isWebPlatform) {
    return {}
  }
  const offsetProp = config.axis === 'translateX' ? { x: config.offset } : { y: config.offset }
  const style = { opacity: 0, ...offsetProp }
  // No color props in this shape, but scope explicitly anyway (the repo's animateOnly convention).
  return { animation: curve, animateOnly: ['opacity', 'transform'], enterStyle: style, exitStyle: style }
}
