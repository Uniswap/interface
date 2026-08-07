/**
 * Type-level drop-in contract: every prop accepted by the Tamagui `View`
 * (`ViewProps`, re-exported by `ui/src`) is either covered by
 * `ViewCompatProps` or listed in the explicit exclusion unions below.
 *
 * Compiled by `tsconfig.type-parity.view.json` (driven from
 * `type-parity.test.ts` — the config must load `ui/src/env.d.ts` so the real
 * Tamagui config augmentation types the media/group keys). A newly uncovered
 * key fails the build with the key names in the error message.
 */
import type { ViewProps } from 'ui/src'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type { ViewCompatProps } from '../../../../mycelium/src/view-compat/props'

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
 * RN accessibility props) IS covered by ViewCompatProps; these remaining keys
 * are iOS/Android-only hints with no web rendering in Tamagui either.
 */
type NativeA11yKey = Exclude<
  Extract<keyof ViewProps, `accessibility${string}` | `onAccessibility${string}`>,
  keyof ViewCompatProps
>

/**
 * Raw enterStyle/exitStyle objects: arbitrary per-call-site enter/exit styles
 * would require runtime keyframe generation. The plain Tamagui View has no
 * preset variant surface; the shared presets are proven by the Flex binding —
 * see exclusions.ts.
 */
type RawPresenceStyleKey = 'enterStyle' | 'exitStyle'

/**
 * Container-size group queries (`$group-<name>-<breakpoint>` and bare
 * `$group-<name>`): backed by CSS container queries + Tamagui containment,
 * which the compat intentionally does not replicate (the compiler throws on
 * them). The group STATE props ($group-hover, $group-item-press, …) are fully
 * covered.
 */
type GroupContainerQueryKey = Exclude<Extract<keyof ViewProps, `$group-${string}`>, keyof ViewCompatProps>

/** Native platform overrides beyond the ignored `$platform-native`/`-ios`/`-android` blocks. */
type PlatformNativeKey = Exclude<Extract<keyof ViewProps, `$platform-${string}`>, keyof ViewCompatProps>

export type ExcludedViewPropKey =
  | ResponderSystemKey
  | DeprecatedRNKey
  | ExperimentalRNKey
  | NativeA11yKey
  | RawPresenceStyleKey
  | GroupContainerQueryKey
  | PlatformNativeKey

type UncoveredKeys = Exclude<keyof ViewProps, keyof ViewCompatProps | ExcludedViewPropKey>

declare const uncoveredKeys: UncoveredKeys
/**
 * Fails listing the uncovered keys whenever coverage regresses (an uncovered
 * key makes `UncoveredKeys` non-never, and the assignment error names it).
 */
export const viewPropsFullyCovered: never = uncoveredKeys

// Sanity tripwires: if module resolution or the config augmentation breaks,
// ViewProps degrades and these fail before the coverage check can lie.
type RequiredViewKey =
  | 'flexDirection'
  | 'alignItems'
  | 'justifyContent'
  | 'display'
  | 'position'
  | 'gap'
  | 'hoverStyle'
  | 'pressStyle'
  | '$sm'
  | '$short'
  | '$platform-web'
  | '$group-hover'
  | '$theme-dark'
  | 'onPress'
declare const requiredKeysPresent: RequiredViewKey extends keyof ViewProps
  ? true
  : { missingFromViewProps: Exclude<RequiredViewKey, keyof ViewProps> }
export const viewPropsSanity: true = requiredKeysPresent

// Value-level spot checks: representative call-site prop fragments typed from
// ViewProps must remain assignable to the ViewCompatProps contract.
type AcceptsFragment<T extends Partial<ViewCompatProps>> = T
export type ValueLevelChecks = [
  // `gap` is deliberately not value-level checked, matching the Flex contract:
  // Tamagui types it as GetThemeValueForKey<'gap'> (incl. CSS-wide keywords);
  // the compat contract is narrower and throws on unmappable values.
  AcceptsFragment<Pick<ViewProps, 'flexDirection' | 'alignItems' | 'justifyContent' | 'flexWrap'>>,
  AcceptsFragment<Pick<ViewProps, 'position' | 'overflow' | 'display'>>,
  AcceptsFragment<Pick<ViewProps, 'group' | 'testID' | 'children' | 'disabled'>>,
]
