/**
 * Type-level drop-in contract: every prop accepted by the Tamagui `Flex`
 * (`FlexProps = GetProps<typeof Flex>`) is either covered by
 * `FlexCompatProps` or listed in the explicit exclusion unions below.
 *
 * Compiled by `tsconfig.type-parity.json` (driven from `type-parity.test.ts`
 * — the config must load `ui/src/env.d.ts` so the real Tamagui config
 * augmentation types the media/group keys, and must NOT set preserveSymlinks,
 * which breaks styled() variant inference). A newly uncovered key fails the
 * build with the key names in the error message.
 */
import type { FlexProps } from 'ui/src/components/layout/Flex'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type { FlexCompatProps } from '../../../../mycelium/src/flex-compat/props'

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
 * ignores on web (dataSet → data-*, focusable → tabIndex, href/hrefAttrs →
 * tag="a", rotation/translateX/translateY/transformMatrix → transform props).
 */
type DeprecatedRNKey =
  | 'dataSet'
  | 'elevationAndroid'
  | 'focusable'
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
 * RN accessibility props) IS covered by FlexCompatProps; these remaining keys
 * are iOS/Android-only hints with no web rendering in Tamagui either.
 */
type NativeA11yKey = Exclude<
  Extract<keyof FlexProps, `accessibility${string}` | `onAccessibility${string}`>,
  keyof FlexCompatProps
>

/**
 * Raw enterStyle/exitStyle objects: arbitrary per-call-site enter/exit styles
 * would require runtime keyframe generation. The shared presets
 * (animateEnter / animateExit / animateEnterExit) are the supported Flex
 * animation surface — see exclusions.ts.
 */
type RawPresenceStyleKey = 'enterStyle' | 'exitStyle'

/**
 * Container-size group queries (`$group-<name>-<breakpoint>` and bare
 * `$group-<name>`): backed by CSS container queries + Tamagui containment,
 * which FlexCompat intentionally does not replicate (see exclusions.ts — the
 * compiler throws on them). The group STATE props ($group-hover,
 * $group-item-press, …) are fully covered.
 */
type GroupContainerQueryKey = Exclude<Extract<keyof FlexProps, `$group-${string}`>, keyof FlexCompatProps>

/** Native platform overrides beyond the ignored `$platform-native`/`-ios`/`-android` blocks. */
type PlatformNativeKey = Exclude<Extract<keyof FlexProps, `$platform-${string}`>, keyof FlexCompatProps>

export type ExcludedFlexPropKey =
  | ResponderSystemKey
  | DeprecatedRNKey
  | ExperimentalRNKey
  | NativeA11yKey
  | RawPresenceStyleKey
  | GroupContainerQueryKey
  | PlatformNativeKey

type UncoveredKeys = Exclude<keyof FlexProps, keyof FlexCompatProps | ExcludedFlexPropKey>

declare const uncoveredKeys: UncoveredKeys
/**
 * Fails listing the uncovered keys whenever coverage regresses (an uncovered
 * key makes `UncoveredKeys` non-never, and the assignment error names it).
 */
export const flexPropsFullyCovered: never = uncoveredKeys

// Sanity tripwires: if module resolution or the config augmentation breaks,
// FlexProps degrades and these fail before the coverage check can lie.
type RequiredFlexKey =
  | 'row'
  | 'fill'
  | 'inset'
  | 'animateEnter'
  | 'hoverStyle'
  | 'pressStyle'
  | '$sm'
  | '$short'
  | '$platform-web'
  | '$group-hover'
  | '$theme-dark'
  | 'onPress'
  | 'gap'
declare const requiredKeysPresent: RequiredFlexKey extends keyof FlexProps
  ? true
  : { missingFromFlexProps: Exclude<RequiredFlexKey, keyof FlexProps> }
export const flexPropsSanity: true = requiredKeysPresent

// Value-level spot checks: representative call-site prop fragments typed from
// FlexProps must remain assignable to the FlexCompatProps contract.
type AcceptsFragment<T extends Partial<FlexCompatProps>> = T
export type ValueLevelChecks = [
  AcceptsFragment<Pick<FlexProps, 'row' | 'fill' | 'centered' | 'flexDirection' | 'alignItems'>>,
  AcceptsFragment<Pick<FlexProps, 'position' | 'overflow' | 'display'>>,
  AcceptsFragment<Pick<FlexProps, 'animateEnter' | 'animateExit' | 'animateEnterExit'>>,
  AcceptsFragment<Pick<FlexProps, 'group' | 'testID' | 'children'>>,
]
