/**
 * Type-level drop-in contract: every prop accepted by the Tamagui
 * `TouchableArea` (`ui/src/components/touchable/TouchableArea/types`) is
 * either covered by `TouchableAreaCompatProps` or listed in the explicit
 * exclusion unions below.
 *
 * Compiled by `tsconfig.type-parity.touchable-area.json` (driven from
 * `type-parity.test.ts` — the config must load `ui/src/env.d.ts` so the real
 * Tamagui config augmentation types the media/group keys). A newly uncovered
 * key fails the build with the key names in the error message.
 */
import type { TouchableAreaProps } from 'ui/src/components/touchable/TouchableArea/types'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type { TouchableAreaCompatProps } from '../../../../mycelium/src/touchable-area/props'

/**
 * RN gesture-responder system: native-only negotiation callbacks with no DOM
 * equivalent (web pointer/touch/mouse handlers are covered instead).
 */
type ResponderSystemKey =
  | 'onStartShouldSetResponder'
  | 'onStartShouldSetResponderCapture'
  | 'onMoveShouldSetResponder'
  | 'onMoveShouldSetResponderCapture'
  | 'onResponderEnd'
  | 'onResponderGrant'
  | 'onResponderMove'
  | 'onResponderReject'
  | 'onResponderRelease'
  | 'onResponderStart'
  | 'onResponderTerminate'
  | 'onResponderTerminationRequest'
  | 'onScrollShouldSetResponder'
  | 'onScrollShouldSetResponderCapture'
  | 'onSelectionChangeShouldSetResponder'
  | 'onSelectionChangeShouldSetResponderCapture'

/**
 * Deprecated / native-only RN props Tamagui itself marks deprecated or
 * ignores on web (dataSet → data-*, focusable is a REAL TouchableArea variant
 * and IS covered — not listed here).
 */
type DeprecatedRNKey =
  | 'dataSet'
  | 'elevationAndroid'
  | 'href'
  | 'hrefAttrs'
  | 'rotation'
  | 'screenReaderFocusable'
  | 'transformMatrix'
  | 'translateX'
  | 'translateY'

/** Experimental RN style surface (not shipped on web). */
type ExperimentalRNKey =
  | 'experimental_backgroundImage'
  | 'experimental_backgroundPosition'
  | 'experimental_backgroundRepeat'
  | 'experimental_backgroundSize'

/**
 * Native-only accessibility long tail. The web-effective surface (aria-*,
 * role, the accessibilityLabel/accessibilityRole mappings and the deprecated
 * RN accessibility props) IS covered by TouchableAreaCompatProps; these
 * remaining keys are iOS/Android-only hints with no web rendering in Tamagui.
 */
type NativeA11yKey = Exclude<
  Extract<keyof TouchableAreaProps, `accessibility${string}` | `onAccessibility${string}`>,
  keyof TouchableAreaCompatProps
>

/**
 * Raw enterStyle/exitStyle objects: arbitrary per-call-site enter/exit styles
 * would require runtime keyframe generation. The shared presets
 * (animateEnter / animateExit / animateEnterExit) are the supported surface —
 * see exclusions.ts.
 */
type RawPresenceStyleKey = 'enterStyle' | 'exitStyle'

/**
 * Container-size group queries: backed by CSS container queries + Tamagui
 * containment, which the compat intentionally does not replicate (the
 * compiler throws on them). The group STATE props ($group-hover,
 * $group-item-press, …) are fully covered.
 */
type GroupContainerQueryKey = Exclude<
  Extract<keyof TouchableAreaProps, `$group-${string}`>,
  keyof TouchableAreaCompatProps
>

/** Native platform overrides beyond the ignored `$platform-native`/`-ios`/`-android` blocks. */
type PlatformNativeKey = Exclude<
  Extract<keyof TouchableAreaProps, `$platform-${string}`>,
  keyof TouchableAreaCompatProps
>

export type ExcludedTouchableAreaPropKey =
  | ResponderSystemKey
  | DeprecatedRNKey
  | ExperimentalRNKey
  | NativeA11yKey
  | RawPresenceStyleKey
  | GroupContainerQueryKey
  | PlatformNativeKey

type UncoveredKeys = Exclude<keyof TouchableAreaProps, keyof TouchableAreaCompatProps | ExcludedTouchableAreaPropKey>

declare const uncoveredKeys: UncoveredKeys
/**
 * Fails listing the uncovered keys whenever coverage regresses (an uncovered
 * key makes `UncoveredKeys` non-never, and the assignment error names it).
 */
export const touchableAreaPropsFullyCovered: never = uncoveredKeys

// Sanity tripwires: if module resolution or the config augmentation breaks,
// TouchableAreaProps degrades and these fail before the coverage check can lie.
type RequiredTouchableAreaKey =
  | 'variant'
  | 'hoverable'
  | 'focusable'
  | 'scaleTo'
  | 'activeOpacity'
  | 'shouldStopPropagation'
  | 'shouldAutomaticallyInjectColors'
  | 'shouldConsiderMinimumDimensions'
  | 'modifierPressHref'
  | 'onModifierPress'
  | 'hitSlop'
  | 'row'
  | 'centered'
  | 'hoverStyle'
  | 'pressStyle'
  | 'focusVisibleStyle'
  | '$sm'
  | '$platform-web'
  | '$group-hover'
  | '$theme-dark'
  | 'onPress'
  | 'onLongPress'
  | 'disabled'
  | 'gap'
declare const requiredKeysPresent: RequiredTouchableAreaKey extends keyof TouchableAreaProps
  ? true
  : { missingFromTouchableAreaProps: Exclude<RequiredTouchableAreaKey, keyof TouchableAreaProps> }
export const touchableAreaPropsSanity: true = requiredKeysPresent

// Value-level spot checks: representative call-site prop fragments typed from
// TouchableAreaProps must remain assignable to the compat contract.
type AcceptsFragment<T extends Partial<TouchableAreaCompatProps>> = T
export type ValueLevelChecks = [
  AcceptsFragment<Pick<TouchableAreaProps, 'variant' | 'hoverable' | 'focusable' | 'row' | 'centered'>>,
  AcceptsFragment<Pick<TouchableAreaProps, 'scaleTo' | 'activeOpacity' | 'shouldStopPropagation' | 'hitSlop'>>,
  AcceptsFragment<Pick<TouchableAreaProps, 'modifierPressHref' | 'onModifierPress' | 'onPress' | 'onLongPress'>>,
  // The legacy TouchableArea has no animateEnter/animateExit preset surface
  // (those are Flex styled-variants); `animation` is the accepted-and-ignored
  // runtime driver prop.
  AcceptsFragment<Pick<TouchableAreaProps, 'animation' | 'animateOnly'>>,
  AcceptsFragment<Pick<TouchableAreaProps, 'group' | 'testID' | 'children' | 'disabled'>>,
]
