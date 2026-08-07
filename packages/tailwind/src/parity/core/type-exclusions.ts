/**
 * Shared React-Native / Tamagui key exclusions for the type-level drop-in
 * contracts (`<component>/type-parity.ts`). These are the native-only or
 * deprecated prop families with no web rendering effect in Tamagui either —
 * identical for every migrated component, so they live once here. The
 * component contracts add their own component-specific exclusion unions on
 * top (each documented in that component's parity exclusions ledger).
 */

/**
 * RN gesture-responder system: native-only negotiation callbacks with no DOM
 * equivalent (web pointer/touch/mouse handlers are covered instead).
 */
export type ResponderSystemKey =
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
export type DeprecatedRNKey =
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
export type ExperimentalRNKey =
  | 'experimental_backgroundImage'
  | 'experimental_backgroundPosition'
  | 'experimental_backgroundRepeat'
  | 'experimental_backgroundSize'

/**
 * Native-only accessibility long tail of a legacy prop surface `P`: the
 * web-effective surface (aria-*, role, the accessibilityLabel /
 * accessibilityRole mappings and the deprecated RN accessibility props) is
 * covered by the compat contract `C`; the remaining keys are iOS/Android-only
 * hints with no web rendering in Tamagui either.
 */
export type NativeA11yKey<P, C> = Exclude<
  Extract<keyof P, `accessibility${string}` | `onAccessibility${string}`>,
  keyof C
>

/**
 * Container-size group queries (`$group-<name>-<breakpoint>` and bare
 * `$group-<name>`): backed by CSS container queries + Tamagui containment,
 * which the compat layer intentionally does not replicate (the compiler
 * throws on them). The group STATE props ($group-hover, …) are covered.
 */
export type GroupContainerQueryKey<P, C> = Exclude<Extract<keyof P, `$group-${string}`>, keyof C>

/** Native platform overrides beyond the ignored `$platform-native`/`-ios`/`-android` blocks. */
export type PlatformNativeKey<P, C> = Exclude<Extract<keyof P, `$platform-${string}`>, keyof C>

/** Every shared exclusion family in one union, parameterized on legacy `P` and compat `C`. */
export type SharedExcludedKey<P, C> =
  | ResponderSystemKey
  | DeprecatedRNKey
  | ExperimentalRNKey
  | NativeA11yKey<P, C>
  | GroupContainerQueryKey<P, C>
  | PlatformNativeKey<P, C>
