// Mycelium - Uniswap's Tailwind Design System
// Main JS exports

export { UniversalList } from './components/UniversalList/UniversalList'
export { useRecyclingBooleanState } from './components/UniversalList/useRecyclingBooleanState/useRecyclingBooleanState'
export type { RecyclingBooleanState } from './components/UniversalList/useRecyclingBooleanState/useRecyclingBooleanState'
export { useIsRowViewable } from './components/UniversalList/useIsRowViewable/useIsRowViewable'
export type {
  UniversalListProps,
  UniversalListRef,
  UniversalListRenderItemInfo,
  UniversalListScrollEvent,
  UniversalListStyle,
  UniversalListStyleValue,
} from './components/UniversalList/types'
export { UniversalImage } from './universal-image/UniversalImage'
export { UniversalImageResizeMode } from './universal-image/types'
export type {
  UniversalImageProps,
  UniversalImageSize,
  UniversalImageStyle,
  UniversalImageStyleDimensionValue,
  UniversalImageStyleProps,
} from './universal-image/types'
export { fetchSVG, useSvgData, type SvgData } from './universal-image/utils'
export { cn } from './cn'
export { FlexCompat as Flex } from './flex-compat/FlexCompat'
export type {
  FlexCompatProps,
  FlexCompatProps as FlexProps,
  FlexCompatPseudoProps,
  FlexCompatStyleProps,
} from './flex-compat/props'
export { TextCompat as Text } from './text-compat/TextCompat'
export type {
  TextCompatProps,
  TextCompatProps as TextProps,
  TextCompatPseudoProps,
  TextCompatStyleProps,
} from './text-compat/props'
export { DynamicSizeTextCompat as DynamicSizeText } from './dynamic-size-text/DynamicSizeTextCompat'
export type { DynamicSizeTextFitOptions, DynamicSizeTextProps } from './dynamic-size-text/props'
export { ViewCompat as View } from './view-compat/ViewCompat'
export type { ViewCompatProps, ViewCompatPseudoProps, ViewCompatStyleProps } from './view-compat/props'
export { TouchableAreaCompat as TouchableArea } from './touchable-area/TouchableAreaCompat'
export type {
  TouchableAreaCompatProps,
  TouchableAreaCompatPseudoProps,
  TouchableAreaCompatStyleProps,
  TouchableAreaEvent,
} from './touchable-area/props'
export * from '@universe/tailwind/types'
export { Shimmer, type ShimmerProps } from './shimmer'
/**
 * @deprecated Migration scaffolding — legacy alias matching the Shine export
 * on the legacy ui package's root barrel, kept only so the INFRA-2957 codemod
 * converts legacy root-barrel Shine imports as a mechanical barrel swap. Use
 * {@link Shimmer}. Removal once conversion waves complete is tracked in
 * INFRA-3048.
 */
export { Shimmer as Shine } from './shimmer'
/**
 * @deprecated Migration scaffolding — legacy alias matching the Skeleton
 * export on the legacy ui package's root barrel (legacy Skeleton was already
 * an alias of Shine; its accepted-and-ignored `contrast` prop is not carried
 * over). Use {@link Shimmer}. Removal once conversion waves complete is
 * tracked in INFRA-3048.
 */
export { Shimmer as Skeleton } from './shimmer'
export { clickableStyle } from './styles/clickable'
export { TextLoaderWrapper } from './text-loader-wrapper'
export type { TextLoaderWrapperProps } from './text-loader-wrapper'
// Variant-token resolvers for raw (non-Text) nodes, matching the legacy
// theme barrel's export surface so converted call sites swap import paths only.
export { ALL_FONT_VARIANT_TOKENS, getFontStylesForVariant, getTextVariantKey } from './text-compat/font-variant'
export { getIsValidSporeColor } from './compat/color-validation'
export type { ResolvedFontStyle, TextVariantKey } from './text-compat/font-variant'
export { borderRadii, fonts, heights, iconSizes, imageSizes, spacing, zIndexes } from './tokens'
export { getTokenValue, type GetTokenValueGroup, type GetTokenValueToken } from './get-token-value'
export { COLOR_COUNT, UNICON_COLORS } from './unicon/colors'
export { hashString } from './unicon/hash'
export { Unicon } from './unicon/Unicon'
export type { UniconProps } from './unicon/types'

/**
 * Tamagui → Tailwind migration surface (INFRA-2955, FlexCompat precedent
 * #36905): the parity-verified Button compat as the canonical mycelium
 * Button, exported under the same names the legacy `ui/src` barrel uses
 * (Button, ButtonProps, ButtonEmphasis, ButtonVariant) so conversion is a
 * mechanical barrel swap of the import source. Net-new surface: the root
 * barrel previously exported no Button, and the cva Button on the
 * `@universe/mycelium/components` entry point stays exported there
 * (deprecated in place). The `./button-compat` subpath export remains.
 */
export { ButtonCompat as Button } from './button-compat'
export type {
  ButtonCompatProps as ButtonProps,
  ButtonEmphasis,
  ButtonFocusScaling,
  ButtonIconPosition,
  ButtonPressHandler,
  ButtonSize,
  ButtonVariant,
  NativeButtonPressEvent,
  WebButtonPressEvent,
} from './button-compat'

/**
 * Tamagui → Tailwind migration surface (INFRA-3282): the compat
 * `ModalCloseIcon` under the same name the legacy `ui/src` barrel uses
 * (`AdaptiveWebModal.tsx`'s adaptive-modal close affordance), so
 * `<ModalCloseIcon testId={…} role="none" onClose={…} />` call sites convert
 * as a mechanical barrel swap. Full legacy `CloseIconProps` surface; web and
 * native legs.
 */
export { ModalCloseIconCompat as ModalCloseIcon } from './modal-close-icon/ModalCloseIconCompat'
export type { ModalCloseIconProps } from './modal-close-icon/props'

/**
 * Tamagui → Tailwind migration surface (INFRA-3487): the compat
 * `TouchableTextLink` under the same names the legacy `ui/src` barrel uses
 * (`TouchableTextLink`, `TouchableTextLinkProps`), so
 * `<TouchableTextLink link={…}>…</TouchableTextLink>` call sites convert as a
 * mechanical barrel swap. Full legacy prop surface; web and native legs.
 */
export { TouchableTextLinkCompat as TouchableTextLink } from './touchable-text-link/TouchableTextLinkCompat'
export type { TouchableTextLinkProps } from './touchable-text-link/props'

/**
 * Tamagui → Tailwind migration surface (INFRA-3549): the compat `Anchor`
 * under the same names the legacy `ui/src` barrel uses (`Anchor`,
 * `AnchorProps`), so `<Anchor href={…} …>` call sites convert as a mechanical
 * barrel swap. The surface is the TextCompat surface (the legacy component is
 * a Text styled `tag: 'a'` plus `href`/`target`/`rel`); web and native legs —
 * native opens the href through `Linking.openURL` on press, like legacy.
 */
export { AnchorCompat as Anchor } from './anchor-compat/AnchorCompat'
export type { AnchorCompatProps as AnchorProps } from './anchor-compat/props'

/**
 * Root-only compat twin of the legacy `ui/src` `Accordion` (INFRA-3805) — see
 * `AccordionCompat.tsx` for the scope this does and does not cover.
 */
export { AccordionCompat as Accordion } from './accordion-compat/AccordionCompat'
export type { AccordionCompatProps as AccordionProps } from './accordion-compat/AccordionCompat'

/**
 * Tamagui → Tailwind migration surface (INFRA-3491): the compat
 * `LinearGradient` under the same names the legacy `ui/src` barrel uses
 * (`LinearGradient`, `LinearGradientProps`), so `<LinearGradient colors={…}
 * start={…} end={…} …>` call sites convert as a mechanical barrel swap. The
 * legacy component is a stack frame painting an expo-linear-gradient behind
 * its children; web and native legs — native renders the real
 * expo-linear-gradient with `$` tokens resolved through uniwind's variable
 * store.
 */
export { LinearGradientCompat as LinearGradient } from './linear-gradient-compat/LinearGradientCompat'
export type { LinearGradientCompatProps as LinearGradientProps } from './linear-gradient-compat/props'

/**
 * Tamagui → Tailwind migration surface (INFRA-3491): the compat `ScrollView`
 * under the same name the legacy `ui/src` barrel uses, so `<ScrollView
 * horizontal onScroll={…} …>` call sites convert as a mechanical barrel swap.
 * The legacy component is the React Native ScrollView carrying the Tamagui
 * stack style surface; web and native legs — native renders the real RN
 * ScrollView. `ScrollViewProps` is net-new surface (the legacy barrel exports
 * only the component).
 */
export { ScrollViewCompat as ScrollView } from './scroll-view-compat/ScrollViewCompat'
export type {
  ScrollViewCompatProps as ScrollViewProps,
  ScrollViewCompatRef,
  ScrollViewCompatScrollEvent,
} from './scroll-view-compat/props'

/**
 * Tamagui → Tailwind migration surface (INFRA-3600): the compat `Input` under
 * the same names the legacy `ui/src` barrel uses (`Input`, `InputProps`,
 * `InputStyleProps`, `inputStyles`), so `<Input value={…} onChangeText={…} />`
 * call sites convert as a mechanical barrel swap. The surface is the full
 * closed prop contract of the Tamagui-free ui/src Input rebuild (INFRA-3318),
 * type-parity-pinned in packages/tailwind/src/parity/input; web and native
 * legs. The `Input` name also carries the legacy instance-type alias, so
 * `useRef<Input>` consumers convert on the same swap.
 */
export { InputCompat as Input } from './input-compat/InputCompat'
export { inputStyles } from './input-compat/props'
export type { InputCompatProps as InputProps, InputCompatStyleProps as InputStyleProps } from './input-compat/props'

/**
 * Tamagui → Tailwind migration surface (INFRA-3228): the `ColorTokens` interop
 * type under the same name the legacy `ui/src` barrel uses, so a `ColorTokens`
 * annotation converts as a mechanical barrel swap. Distinct from `ColorToken`
 * (singular, kebab-case Tailwind utility suffixes) re-exported above from
 * `@universe/tailwind/types`. Annotation-only — see ./compat/color-tokens.
 */
export type { ColorTokens } from './compat/color-tokens'

/**
 * Tamagui → Tailwind migration surface (INFRA-3495 / INFRA-3505): `SpaceTokens`
 * and `IconSizeTokens` under the same names the legacy `ui/src` surfaces use,
 * so those annotations convert by swapping the import source.
 * `packages/tailwind/src/parity/space-icon-tokens` is the drift guard;
 * see ./compat/space-tokens for why `SpaceTokens` is only the `$`-token half.
 */
export type { IconSizeTokens } from './compat/icon-size-tokens'
export type { SpaceTokens } from './compat/space-tokens'

/**
 * Tamagui → Tailwind migration surface (INFRA-3557): interop types for the
 * `GetProps<typeof Sheet>` / `ComponentProps<typeof View>` prop lookups the
 * held modal conversions annotate with, so those annotations convert by
 * swapping the lookup for the named type. The size-valued View props mirror
 * the legacy surface minus its Tamagui/RN object internals — see
 * ./compat/view-props for the exact contract shape;
 * `packages/tailwind/src/parity/sheet-view-props` is the drift guard.
 * Annotation-only.
 */
export type { SheetSnapPointsMode } from './compat/sheet-props'
export type {
  ViewBorderRadiusProp,
  ViewFlexProp,
  ViewGapProp,
  ViewMaxHeightProp,
  ViewMaxWidthProp,
  ViewPositionProp,
} from './compat/view-props'

/**
 * Tamagui → Tailwind migration surface (INFRA-3456): the named web element
 * type the compat primitives forward through their refs, plus the assertion
 * util mirroring the legacy `assertWebElement` from `ui/src`, so ref-typed
 * consumers (`useState<TamaguiElement | null>` + `assertWebElement(el)`) can
 * drop their `ui/src` import. `MyceliumElement` is the web half of the legacy
 * `TamaguiElement` union — mycelium's web legs never forward a native `View`.
 */
export { assertWebElement } from './compat/web-element'
export type { CompatRefProp, MyceliumElement } from './compat/web-element'

/**
 * Tamagui → Tailwind migration surface (INFRA-3601): the compat
 * `ElementAfterText` under the same name the legacy `ui/src` barrel uses, so
 * `<ElementAfterText text={…} element={…} />` call sites convert as a
 * mechanical barrel swap. Full legacy prop surface (text, element,
 * wrapperProps, textProps); web and native legs — native keeps the legacy
 * layout-event positioning on iOS and the inline rendering on Android.
 */
export { ElementAfterTextCompat as ElementAfterText } from './element-after-text/ElementAfterTextCompat'
export type { ElementAfterTextProps } from './element-after-text/props'

/**
 * Tamagui → Tailwind migration surface (INFRA-3601): the modifier-press prop
 * shape under the same name the legacy `ui/src` barrel uses, so call sites
 * extending `ModifierPressProps` convert by swapping the import source. The
 * props themselves were already on `TouchableAreaCompatProps`; this names the
 * pair. Web-only behavior; the native leg accepts and ignores them, like
 * legacy.
 */
export type { ModifierPressProps } from './touchable-area/props'

/**
 * Tamagui → Tailwind migration surface (INFRA-3601): the legacy
 * `validColor` helper (`ui/src/theme/tokens.ts`, imported from the
 * `ui/src/theme` deep path — a hand-swap lane, not a codemod barrel rule).
 * Dev-guards runtime color strings before they reach compat color props.
 */
export { validColor } from './compat/color-validation'

/**
 * Tamagui → Tailwind migration surface (INFRA-3645): the compat `Progress`
 * under the same name the legacy `ui/src` barrel uses, with the
 * `Progress.Indicator` static intact, so `<Progress value={…}>` /
 * `<Progress.Indicator … />` call sites (`Table/columns/Allocation.tsx`)
 * convert as a mechanical barrel swap. The `animation` prop rides the shared
 * compat animation surface (accepted; timing is a driver concern). Renders on
 * the compat Flex, so it is cross-platform without its own leg split.
 */
export { ProgressCompat as Progress } from './progress-compat/ProgressCompat'
export type {
  ProgressCompatProps as ProgressProps,
  ProgressExtraProps,
  ProgressIndicatorCompatProps as ProgressIndicatorProps,
} from './progress-compat/props'

/**
 * Tamagui → Tailwind migration surface (INFRA-3329): the compat
 * `WebBottomSheet` and `useIsTouchDevice` under the same names the legacy
 * `ui/src` barrel uses, so consumers whose barrel statement pulls them next
 * to Flex/Text/TouchableArea (MobileHeaderActions-style) convert as a
 * mechanical barrel swap. The `./web-bottom-sheet-compat` and
 * `./theme-hooks-compat` subpath exports remain.
 */
export { useIsTouchDevice } from './theme-hooks-compat/useIsTouchDevice'
export { WebBottomSheet } from './web-bottom-sheet-compat/WebBottomSheet'
export type { WebBottomSheetProps } from './web-bottom-sheet-compat/props'

/**
 * Tamagui → Tailwind migration surface (INFRA-3653): the compat
 * `AnimatableCopyIcon` under the same names the legacy `ui/src` barrel uses
 * (`AnimatableCopyIcon`, `CopyIconProps` —
 * `ui/src/components/AnimatableCopyIcon/AnimatableCopyIcon.tsx`), so
 * `<AnimatableCopyIcon isCopied={copied} size={16} />` call sites convert as
 * a mechanical barrel swap. The `./animatable-copy-icon-compat` subpath
 * export remains.
 */
export { AnimatableCopyIconCompat as AnimatableCopyIcon } from './animatable-copy-icon-compat'
export type { CopyIconProps } from './animatable-copy-icon-compat'

/**
 * Tamagui → Tailwind migration surface (INFRA-3644): the compat `Separator`,
 * `Switch`, and `SpinningLoader` under the same names the legacy `ui/src`
 * barrel uses, so their call sites convert as a mechanical barrel swap. Each
 * is the full closed prop contract of its Tamagui-free ui/src rebuild
 * (INFRA-3318 Separator/Switch, INFRA-3286 SpinningLoader), parity-pinned in
 * packages/tailwind/src/parity/{separator,switch,spinning-loader}; web and
 * native legs. `SwitchProps` rides along under its legacy barrel name; the
 * other two prop types keep their compat names (the legacy barrel never
 * exported them). The `./separator-compat`, `./switch-compat`, and
 * `./spinning-loader-compat` subpath exports remain.
 */
export { SeparatorCompat as Separator } from './separator-compat/SeparatorCompat'
export type { SeparatorCompatProps, SeparatorCompatStyleProps } from './separator-compat/props'
export { SwitchCompat as Switch } from './switch-compat/SwitchCompat'
export type { SwitchCompatProps as SwitchProps, SwitchCompatVariant } from './switch-compat/props'
export { SpinningLoaderCompat as SpinningLoader } from './spinning-loader-compat/SpinningLoaderCompat'
export type { SpinningLoaderCompatProps } from './spinning-loader-compat/props'

/**
 * Tamagui → Tailwind migration surface: the compat `FlexLoader` under the
 * same names the legacy `ui/src` barrel uses (`FlexLoader`,
 * `FlexLoaderProps` — `ui/src/loading/FlexLoader.tsx`), so
 * `<FlexLoader borderRadius="$rounded12" height={24} width={100} />` call
 * sites convert as a mechanical barrel swap. The placeholder blocks only —
 * call sites keep wrapping in `Shimmer`/`Skeleton` for the sweep. The
 * `./flex-loader-compat` subpath export remains.
 */
export { FlexLoaderCompat as FlexLoader } from './flex-loader-compat'
export type { FlexLoaderProps } from './flex-loader-compat'

/**
 * Tamagui → Tailwind migration surface: the compat `IconButton` under the
 * same names the legacy `ui/src` barrel uses (`IconButton`,
 * `IconButtonProps`), so call sites convert as a mechanical barrel swap.
 * Full legacy prop surface, coverage-pinned against the live legacy type in
 * packages/tailwind/src/parity/icon-button. Root-barrel export only — no
 * subpath entry (the ProgressCompat precedent).
 */
export { IconButtonCompat as IconButton } from './icon-button-compat/IconButtonCompat'
export type { IconButtonCompatProps as IconButtonProps } from './icon-button-compat/props'

// Legacy-name Reanimated wrappers. Native animates; web accepts and ignores the Reanimated props, like legacy.
export { AnimatedFlexCompat as AnimatedFlex } from './animated-flex-compat/AnimatedFlexCompat'
export type { AnimatedFlexCompatProps as AnimatedFlexProps } from './animated-flex-compat/props'
export { AnimatedTouchableAreaCompat as AnimatedTouchableArea } from './touchable-area/AnimatedTouchableAreaCompat'
export type { AnimatedTouchableAreaCompatProps } from './touchable-area/animated-props'

export type { TouchableAreaCompatProps as TouchableAreaProps } from './touchable-area/props'

// Annotation-only interop types; parity/theme-name-keys guards drift against the Tamagui originals.
export type { ThemeKeys, ThemeName } from './compat/theme-name-keys'

// Legacy-name theme hooks. MobileDeviceHeight rides along as useIsShortMobileDevice's argument type.
// useExtractedTokenColor requires an ambient @tanstack/react-query QueryClientProvider (the
// extraction rides useQuery), like the legacy hook.
export { MobileDeviceHeight } from './theme-hooks-compat/device-height'
export { useExtractedTokenColor } from './theme-hooks-compat/useExtractedTokenColor'
export { useIsDarkMode } from './theme-hooks-compat/useIsDarkMode'
export { useIsShortMobileDevice } from './theme-hooks-compat/useIsShortMobileDevice'
export { useMedia } from './theme-hooks-compat/useMedia'
export { useSporeColors } from './theme-hooks-compat/useSporeColors'
export { useSporeColorsForTheme } from './theme-hooks-compat/useSporeColorsForTheme'

// Legacy Loader namespace, composed on compat primitives — cross-platform without its own leg split.
export { LoaderCompat as Loader } from './loader-compat/LoaderCompat'

// Render on compat primitives — cross-platform without their own leg split.
export { InsetCompat as Inset } from './inset-compat/InsetCompat'
export { InlineCardCompat as InlineCard } from './inline-card-compat/InlineCardCompat'

export { flexStyles } from './flex-compat/flex-styles'

// A centered box whose `size` sets width/height and their min/max twins.
// Composed over the compat `Flex`, so no platform-split leg of its own.
export { SquareCompat as Square } from './square-compat/SquareCompat'
export type { SquareCompatProps as SquareProps } from './square-compat/SquareCompat'

// A deliberate two-prop cut of the legacy surface: no direction, style props or children.
export { SpacerCompat as Spacer } from './spacer-compat/SpacerCompat'
export type { SpacerCompatProps as SpacerProps } from './spacer-compat/SpacerCompat'

// Hand-swap only: this compat doesn't inert its positioner, so an open tooltip
// swallows clicks beneath it (INFRA-3930).
export { TooltipCompat as Tooltip } from './tooltip-compat'
