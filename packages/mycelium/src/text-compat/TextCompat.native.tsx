import * as React from 'react'
import {
  type LayoutChangeEvent,
  type StyleProp,
  Text,
  type TextLayoutEventData,
  type TextStyle,
  useWindowDimensions,
} from 'react-native'
import { warnUnsupportedNativeProps } from '../compat/native-diagnostics'
import { droppedNonNativeDisplayProps } from '../compat/native-display'
import { nativeCompatProps, nativeTextPressProps } from '../compat/native-props'
import { markMyceliumPrimitive } from '../compat/primitive-marker'
// Explicit .native import: a web-first resolver (the mycelium vitest config)
// would swap in the web chrome around a real RN Text otherwise.
import { TextLoaderWrapper } from '../text-loader-wrapper/TextLoaderWrapper.native'
import { textCompatClassName } from './compile'
import { resolveTextCompatDefaults } from './defaults'
import { nativeVariantMaxFontSizeMultiplier } from './native-font'
import { stripNonNativeDisplayClasses, textNativeStyle } from './native-style'
import type { TextCompatProps } from './props'

// The legacy ui Text's font-scaling rule, transcribed
// rather than imported (mycelium must never depend on `packages/ui`). Without
// this, RN's own default (`allowFontScaling: true`, uncapped) tracks the
// device's Dynamic Type / Larger Text setting in BOTH directions — including
// downward, when a user has turned text size below the OS default — so a
// converted Text with no explicit `allowFontScaling` prop shrinks below the
// legacy size on exactly those devices (INFRA-3783). Legacy instead disables
// scaling unless the device is scaled ABOVE default, so it never shrinks.
const DEFAULT_FONT_SCALE = 1

export { resolveTextCompatDefaults }

/**
 * React Native rendering of TextCompat (INFRA-3229): a real RN `Text`, never a
 * DOM host. The web leg derives an `h1`/`h2`/`h3`/`span` tag from the variant
 * and renders it through `compat/dom.tsx`; RN has no tags, so the variant→tag
 * table and the `tag` prop are both ignored here.
 *
 * Truncation is the other inversion. On web `numberOfLines` compiles to
 * `-webkit-line-clamp` / `text-ellipsis` classes; natively RN's own
 * `numberOfLines` + `ellipsizeMode` are the mechanism, so the leg forwards them
 * — together with the rest of `TextCompatExtraProps`, every member of which is
 * inert on web precisely because it is a real RN `Text` prop.
 *
 * `loading` delegates the placeholder chrome to the canonical
 * `TextLoaderWrapper`, whose native leg is the legacy contract: the transparent
 * Text hidden from screen readers under the rounded `surface2` bar, wrapped in
 * the reanimated `Shimmer` sweep (the legacy `Shine`, `testID="shimmer"`)
 * unless `loading="no-shimmer"`. While loading, the bar overlays the Text as a
 * SIBLING, so a press over it never reaches the Text's responder — the same
 * wrapper structure (and therefore the same inertness) as the legacy
 * `TextPlaceholder`, kept on purpose.
 */

export const TextCompat = React.forwardRef<Text, TextCompatProps>(function TextCompat(props, ref) {
  const { loading = false, loadingPlaceholderText = '000.00', ...rest } = props
  const styleProps = resolveTextCompatDefaults({ loading, props: rest })
  const { style: nativeStyle, dropped } = textNativeStyle(styleProps)
  const { fontScale } = useWindowDimensions()
  const enableFontScaling = styleProps.allowFontScaling ?? fontScale > DEFAULT_FONT_SCALE
  const maxFontSizeMultiplier =
    styleProps.maxFontSizeMultiplier ??
    (styleProps.variant === undefined ? undefined : nativeVariantMaxFontSizeMultiplier(styleProps.variant))
  // Non-RN display values are stripped from the attached className below
  // (direct prop and pool-scoped alike); keep the loss visible.
  dropped.push(...droppedNonNativeDisplayProps(styleProps as Readonly<Record<string, unknown>>))
  warnUnsupportedNativeProps('TextCompat', dropped)

  const element = (
    <Text
      ref={ref}
      {...nativeCompatProps(styleProps)}
      // RN Text has built-in pressability, so the behavioral press props
      // forward straight to it (INFRA-3536) — legacy Tamagui Text dispatches
      // them natively too. `disabled` detaches the surface like the web leg;
      // the Text variant of the helper also forces the responder on for a
      // pressIn/pressOut-only call site (see nativeTextPressProps).
      {...nativeTextPressProps(styleProps)}
      // RN's truncation contract replaces the -webkit-line-clamp classes.
      numberOfLines={
        styleProps.ellipse === true || styleProps.ellipsis === true ? 1 : (styleProps.numberOfLines ?? undefined)
      }
      ellipsizeMode={styleProps.ellipsizeMode}
      selectable={styleProps.selectable}
      allowFontScaling={enableFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      adjustsFontSizeToFit={styleProps.adjustsFontSizeToFit}
      minimumFontScale={styleProps.minimumFontScale}
      suppressHighlighting={styleProps.suppressHighlighting}
      onTextLayout={styleProps.onTextLayout as ((event: { nativeEvent: TextLayoutEventData }) => void) | undefined}
      onLayout={styleProps.onLayout as ((event: LayoutChangeEvent) => void) | undefined}
      style={[nativeStyle, styleProps.style as StyleProp<TextStyle>]}
      // uniwind resolves the compiled className on Metro; the non-RN `display`
      // tokens are stripped (see ./native-style).
      {...{ className: stripNonNativeDisplayClasses(textCompatClassName(styleProps)) }}
    >
      {loading ? loadingPlaceholderText : rest.children}
    </Text>
  )

  if (!loading) {
    return element
  }
  return <TextLoaderWrapper loadingShimmer={loading !== 'no-shimmer'}>{element}</TextLoaderWrapper>
})

// Matches what `createCompatComponent` sets on the web leg (compat/dom.tsx).
TextCompat.displayName = 'TextCompat'
markMyceliumPrimitive(TextCompat)
