import type { SporeAnimationCurveName } from '@universe/tailwind/animations'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { Children, type CSSProperties, type JSX } from 'react'
import { Presence, type PresenceExitProps } from '../presence'
import type { AnimatedPagerProps, AnimateTransitionProps, AnimationType, TransitionItemProps } from './types'
import { DEFAULT_PAGER_CURVE, DEFAULT_PAGER_DISTANCE, getAnimationOffsets } from './types'
import { usePagerDirection } from './usePagerDirection'

/**
 * Pager enter/exit lane: one keyframe pair
 * (`@universe/tailwind/css/compat.css`) parameterized by the CSS custom
 * properties below, so one class covers every direction × distance without a
 * keyframe per combination. The exit class is `[data-exiting]`-gated and in
 * the `spore-exit-` family, which is what lets the `Presence` primitive hold
 * the outgoing page until the animation ends. The frame is a flex column like
 * the legacy Flex wrapper: pages rely on it for `alignSelf` centering.
 */
const PAGER_ITEM_CLASSES = 'flex w-full grow flex-col animate-spore-enter-pager data-exiting:animate-spore-exit-pager'

interface PagerGoing {
  animationType: AnimationType
  distance: number
  disableFade: boolean
}

/**
 * Inline timing overriding the keyframe defaults, from the curve's CSS
 * shorthand (`'<duration> <timing-function>[ <delay>]'`, byte-exact legacy
 * web-driver values).
 */
/** True for a trailing `<number>ms` delay token (only the delayed Spore curves carry one). */
function isDelayToken(token: string): boolean {
  if (!token.endsWith('ms')) {
    return false
  }
  const value = token.slice(0, -2)
  return value !== '' && Number.isFinite(Number(value))
}

function pagerTimingStyle(curve: SporeAnimationCurveName): CSSProperties {
  const tokens = SPORE_ANIMATION_CURVE_CSS[curve].split(' ')
  const duration = tokens[0]
  if (duration === undefined || tokens.length < 2) {
    // Defect guard: every entry in SPORE_ANIMATION_CURVE_CSS follows the
    // shorthand shape; a new entry that doesn't must extend the parser.
    throw new Error(`unparseable Spore curve CSS shorthand: ${SPORE_ANIMATION_CURVE_CSS[curve]}`)
  }
  // Only the delayed curves carry a trailing `<delay>ms` token; the easing is
  // everything in between (cubic-bezier(...) contains spaces itself).
  const lastToken = tokens[tokens.length - 1] ?? ''
  const hasDelay = tokens.length > 2 && isDelayToken(lastToken)
  const easingTokens = hasDelay ? tokens.slice(1, -1) : tokens.slice(1)
  const timing: CSSProperties = {
    animationDuration: duration,
    animationTimingFunction: easingTokens.join(' '),
  }
  if (hasDelay) {
    timing.animationDelay = lastToken
  }
  return timing
}

/**
 * Exit presentation for the exiting page, re-resolved from the live `custom`
 * channel on every render — the contract that lets a direction change land on
 * a page that is already exiting (the legacy `custom={{ going }}` behavior).
 * The running exit animation reads the custom properties live, so updating
 * them mid-flight redirects the slide without restarting it.
 */
function getPagerExitProps(custom: PagerGoing | undefined): PresenceExitProps {
  if (custom === undefined) {
    return {}
  }
  const { exitOffset } = getAnimationOffsets(custom.animationType, custom.distance)
  return {
    style: {
      // Legacy exitStyle stacked the outgoing page under the incoming one.
      zIndex: 0,
      '--spore-pager-exit-x': `${exitOffset.x}px`,
      '--spore-pager-exit-y': `${exitOffset.y}px`,
      '--spore-pager-exit-opacity': custom.disableFade ? '1' : '0',
    } as CSSProperties,
  }
}

/**
 * Web `TransitionItem`: renders the current page inside `Presence`
 * (`exitBeforeEnter`, no first-render animation) and swaps pages when
 * `childKey` changes — the outgoing page slides/fades out along
 * `animationType`, then the incoming one slides/fades in. Mycelium rebuild of
 * the legacy `ui/src` AnimatePresencePager family (INFRA-3344); the legacy
 * preset prop named `animation` is now `curve`, same Spore vocabulary.
 */
export function TransitionItem({
  animationType = 'fade',
  childKey,
  curve = DEFAULT_PAGER_CURVE,
  distance = DEFAULT_PAGER_DISTANCE,
  disableFade = false,
  children,
}: TransitionItemProps): JSX.Element {
  const going: PagerGoing = { animationType, distance, disableFade }
  const { enterOffset, exitOffset } = getAnimationOffsets(animationType, distance)
  const itemStyle: CSSProperties = {
    '--spore-pager-enter-x': `${enterOffset.x}px`,
    '--spore-pager-enter-y': `${enterOffset.y}px`,
    '--spore-pager-enter-opacity': disableFade ? '1' : '0',
    // Baseline exit resolution for the no-direction-change case; while a page
    // is exiting, getPagerExitProps re-resolves these from the live `custom`.
    '--spore-pager-exit-x': `${exitOffset.x}px`,
    '--spore-pager-exit-y': `${exitOffset.y}px`,
    '--spore-pager-exit-opacity': disableFade ? '1' : '0',
    ...pagerTimingStyle(curve),
  } as CSSProperties
  return (
    <Presence<PagerGoing> exitBeforeEnter initial={false} custom={going} getExitProps={getPagerExitProps}>
      {children ? (
        // oxlint-disable-next-line react/forbid-elements -- the page frame IS the raw DOM boundary Presence holds a host ref on (no Tamagui Flex here)
        <div key={childKey ?? 'animated-item'} className={PAGER_ITEM_CLASSES} style={itemStyle}>
          {children}
        </div>
      ) : null}
    </Presence>
  )
}

/** Web `AnimateTransition`: `TransitionItem` keyed by `currentIndex`, rendering that child. */
export function AnimateTransition({
  currentIndex,
  animationType = 'fade',
  curve = DEFAULT_PAGER_CURVE,
  distance,
  disableFade,
  children,
}: AnimateTransitionProps): JSX.Element {
  const childrenArray = Children.toArray(children)
  return (
    <TransitionItem
      childKey={`slide-item-${currentIndex}`}
      animationType={animationType}
      curve={curve}
      distance={distance}
      disableFade={disableFade}
    >
      {childrenArray[currentIndex]}
    </TransitionItem>
  )
}

/** Web `AnimatedPager`: `AnimateTransition` sliding `forward`/`backward` as `currentIndex` moves. */
export function AnimatedPager({
  currentIndex,
  curve,
  distance,
  disableFade,
  children,
}: AnimatedPagerProps): JSX.Element {
  const direction = usePagerDirection(currentIndex)
  return (
    <AnimateTransition
      animationType={direction}
      currentIndex={currentIndex}
      curve={curve}
      distance={distance}
      disableFade={disableFade}
    >
      {children}
    </AnimateTransition>
  )
}
