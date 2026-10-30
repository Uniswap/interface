import { withSporeCurve } from '@universe/tailwind/animations/reanimated'
/*
 * React Native leg of ButtonCompat (INFRA-3230).
 *
 * THREE-FILE SPLIT, matching mycelium's other platform-split primitives (and
 * required by `dangerfile.ts` `checkSplitFiles()`): `./ButtonCompat.tsx` is a
 * throwing base stub, `./ButtonCompat.web.tsx` is the real web implementation,
 * and this file is the native leg. `apps/web/vite.config.mts` has no `.native.*`
 * entry in `resolve.extensions`, so web can never resolve this file; Metro
 * prefers `.native.tsx`. Exports are identical across all three legs and pinned
 * by `platform-legs.test.tsx` (values) and `export-type-parity.test.ts` (types).
 *
 * The class surface comes from `./compile` (pure, shared with the web leg and
 * the native parity harness in `packages/tailwind/src/parity/button`). What
 * differs here is everything uniwind or RN cannot express as a class:
 *
 * HOVER IS REACT STATE, NOT `hover:`. uniwind 1.7.0's CSS processor recognizes
 * only `:active`, `:focus`, `:disabled`, `:dir()`, themes and `data-*`
 * (bundler/css-processor/processor.ts) — a class matching none of those never
 * lands in the class map, and the resolver's lookup miss is a bare `continue`
 * (core/native/store.ts), so `hover:`, `group-hover:` and `focus-visible:` are
 * dropped in SILENCE. Per the shipped `../segmented-control-compat` pattern,
 * hover is `onHoverIn`/`onHoverOut` → `useState`, passed to the class selector.
 *
 * NO FOCUS RING, AND DELIBERATELY NOT REWRITTEN TO `focus:`. `focusScaling` is
 * accepted and emits nothing. Rewriting to `focus:` would be actively harmful:
 * uniwind recognizes `:focus`, so `focus:outline-solid` would set `outlineStyle`
 * while the `focus-visible:outline-*` color class still dropped — uniwind then
 * injects `#000000` for `outlineColor` (the INFRA-2966 black-border defect class).
 *
 * PRESS is `withSporeCurve('fast', …)` — the same spring legacy native animates
 * with, so the curve library (INFRA-2967) is legacy-faithful. This is the
 * component's OWN hardcoded press feedback, not a driver for the caller's
 * `animation` prop: `animation`/`animateOnly`/`animateEnter`/`animateExit`/
 * `animateEnterExit` are accepted for call-site parity and never read here,
 * so passing a different `animation` value does not change the press curve.
 * Ruling and recipe for a caller that needs its OWN animation to survive on
 * native: the `animation-prop` native section of
 * `.claude/skills/tamagui-conversion/references/manual-lane.md`.
 *
 * COLOR STATE travels on `ButtonContext`, extended here with `hovered` and
 * `pressed` — replacing legacy's `group: 'item'` + `$group-item-hover` read-back.
 */
import { cloneElement, createContext, forwardRef, useCallback, useContext, useEffect, useState, type JSX } from 'react'
import { I18nManager, Platform, Text, View, type ColorValue } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Path, Svg } from 'react-native-svg'
import { useResolveClassNames } from 'uniwind'
import { getMaybeHexOrRgbColor } from '../button-frame-compat/custom-color'
import { useLayoutAnimationOnLoadingChange } from '../button-frame-compat/layout-animation'
import {
  droppedLinkFormPropNames,
  nativeWarningProps,
  warnDroppedNativeShadowColorToken,
  warnUnsupportedNativeProps,
} from '../compat/native-diagnostics'
import { compatLayoutNativeStyle } from '../compat/native-style'
import type { ColorValue as CompatColorValue } from '../compat/props'
import { shadowColorExpressionOrUndefined, unwrapVariableForNativeStyle } from '../compat/tokens'
import {
  buttonCompatNativeColorClassName,
  buttonCompatNativeFrameClassName,
  buttonCompatNativeTextClassName,
  getContrastTextClass,
  isButtonDisabled,
  NATIVE_ICON_SIZE_PX,
  NATIVE_SPINNER_SIZE,
  SPINNER_GLYPH,
  type ButtonContentClassProps,
  type ButtonIconPosition,
} from './compile'
import { hasButtonCompatDimensions } from './dimensions'
import { buttonCompatNativeDimensions, buttonCompatNativeDroppedDimensionNames } from './native-dimensions'
import type { ButtonCompatProps, ButtonTextProps } from './native-props'
import { PRESS_SCALE } from './press-scale'
import { buttonTextDroppedStyleNames } from './text-props'

// The public type + helper surface mirrors the web leg exactly.
export { getContrastTextClass } from './compile'
export type { ButtonEmphasis, ButtonFocusScaling, ButtonIconPosition, ButtonSize, ButtonVariant } from './compile'
// Named so a consumer can type a standalone shared handler outside JSX.
export type { ButtonPressHandler, NativeButtonPressEvent, WebButtonPressEvent } from './press-handler'

/** SpinningLoader.native's full turn. */
const SPINNER_DEGREES = 360
const SPINNER_DURATION_MS = 1000

/**
 * `buttonFont.family` resolved for native (packages/ui/src/theme/fonts.ts:
 * `baselMedium` = `fontFamily.sansSerif.medium`). iOS refers to the embedded
 * family name, Android to the file name — the same split
 * `../segmented-control-compat/SegmentedControl.native.tsx` already ships.
 * `--sbtn-font-button` (./button-compat.css) is imported by neither
 * apps/mobile/src/global.css nor @universe/mycelium/fonts, so native needs this.
 */
const FONT_FAMILY_BUTTON = Platform.select({ android: 'Basel-Grotesk-Medium', default: 'Basel Grotesk' })

/** buttonFont weight: fonts.ts MEDIUM_WEIGHT (the web leg's `font-medium`). */
const FONT_WEIGHT_BUTTON = '500'

/** CustomButtonText maxFontSizeMultiplier. */
const MAX_FONT_SIZE_MULTIPLIER = 1.2

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Public prop surface: ./native-props (max-lines extraction); re-exported for leg parity (export-type-parity.test.ts).
export type { ButtonCompatProps, ButtonTextProps } from './native-props'

/** What the label/icon/spinner read off the parent Button, plus live interaction state. */
interface ButtonContextValue extends ButtonContentClassProps {
  hovered: boolean
  pressed: boolean
}

const ButtonContext = createContext<ButtonContextValue>({
  variant: 'default',
  emphasis: 'primary',
  size: 'medium',
  isDisabled: false,
  hovered: false,
  pressed: false,
})

/* ------------------------------ sub-components ------------------------------ */

/** Equivalent of legacy Button.Text (CustomButtonText): themed from the parent Button (surface notes: ./native-props). */
function ButtonText({
  className,
  lineHeightDisabled = false,
  style,
  children,
  ...styled
}: ButtonTextProps): JSX.Element {
  const ctx = useContext(ButtonContext)
  warnUnsupportedNativeProps('ButtonCompat.Text', buttonTextDroppedStyleNames(styled))
  const cell = { ...ctx, variant: styled.variant ?? ctx.variant, lineHeightDisabled, className }
  return (
    <Text
      className={buttonCompatNativeTextClassName(cell)}
      maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
      numberOfLines={1}
      style={[{ fontFamily: FONT_FAMILY_BUTTON, fontWeight: FONT_WEIGHT_BUTTON }, style]}
    >
      {children}
    </Text>
  )
}

/**
 * THE ONE COLOUR MECHANISM FOR EVERY NON-TEXT CHILD (review round 1).
 *
 * Web themes icon and spinner via CSS `color` inheritance into `<svg>`
 * (`currentColor`), which has no native equivalent: react-native-svg inherits
 * nothing from a uniwind class and a resolved `{ color }` on a `View` is
 * ignored — hence the unthemed icon and the invisible spinner. Both need a
 * CONCRETE value passed explicitly.
 *
 * It comes from the SAME class string the label renders, through uniwind's own
 * `useResolveClassNames` — the public hook over `UniwindStore.getStyles`, the
 * exact function the Metro-transformed `className` path calls for the label. So
 * a child's colour cannot drift from the label, in any state.
 *
 * Not `useSporeColors`: keyed by Spore TOKEN, so bridging to a CLASS needs a
 * hand-written map — a second source of truth, with no entry for the
 * `getContrastTextClass` classes. Measured in the native parity suite.
 */
function useContentColor(colorClassName: string): ColorValue | undefined {
  return useResolveClassNames(colorClassName).color
}

export interface ButtonIconProps {
  children?: JSX.Element
  className?: string
}

/**
 * Equivalent of legacy Button.Icon (ThemedIcon), which clones the glyph with
 * `{ color: children.props?.color ?? color, width, height }`. All three are
 * needed: web themes the glyph by CSS `color` inheritance (see
 * `useContentColor`) and sizes it with `[&_svg]:size-*`; native has neither.
 *
 * The colour class MUST include the caller's `className` — web lets a caller
 * class win the merge and the cascade carries it into the glyph, so the bare
 * ctx makes `<ButtonCompat.Icon className="text-critical">` work on web and do
 * nothing here. Size is cloned unconditionally (a wrapper box never resizes a
 * child carrying its own size; every `createIcon` glyph defaults to `$icon.8`).
 */
function ButtonIcon({ children, className }: ButtonIconProps): JSX.Element | null {
  const ctx = useContext(ButtonContext)
  const colorClassName = buttonCompatNativeColorClassName({ ...ctx, className })
  const color = useContentColor(colorClassName)
  if (!children) {
    return null
  }
  const box = NATIVE_ICON_SIZE_PX[ctx.size]
  const childProps = children.props as { color?: ColorValue } | undefined
  return (
    <View
      className={colorClassName}
      style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}
    >
      {cloneElement(children, { color: childProps?.color ?? color, width: box, height: box })}
    </View>
  )
}

/**
 * Mirrors `ui/src/loading/SpinningLoader.native.tsx`: a shared rotation driven
 * by `withRepeat(withTiming(360, …))` on a hand-written `Easing.bezier(0.83, 0,
 * 0.17, 1)` — a curve NOT in the Spore library (no 0.83 entry in
 * @universe/tailwind/animations/curves.ts), so hand-writing it is both required
 * and exactly what the legacy native leg does.
 *
 * The WRAPPER rotates and carries pinned width/height: per SpinningLoader's own
 * comment the circle spinner floors float sizes, and every NATIVE_SPINNER_SIZE
 * is a float (14.95 / 17.25 / 21.85). The CHILD is the glyph — a `View` carrying only
 * text-colour classes paints nothing, so the wrapper is never self-closing, and
 * the stroke takes a concrete `useContentColor` value rather than web's
 * `currentColor`. Both are pinned in the native parity suite.
 */
function ButtonSpinner(): JSX.Element {
  const ctx = useContext(ButtonContext)
  const size = NATIVE_SPINNER_SIZE[ctx.size]
  const colorClassName = buttonCompatNativeColorClassName(ctx)
  const stroke = useContentColor(colorClassName)
  const rotation = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rotation.value}deg` }] }), [rotation])

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(SPINNER_DEGREES, {
        duration: SPINNER_DURATION_MS,
        easing: Easing.bezier(0.83, 0, 0.17, 1),
      }),
      -1,
    )
    return () => cancelAnimation(rotation)
  }, [rotation])

  return (
    <Animated.View
      className={colorClassName}
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}
      testID="button-compat-spinner"
    >
      <Svg fill="none" height={size} viewBox={SPINNER_GLYPH.viewBox} width={size}>
        <Path
          d={SPINNER_GLYPH.trackPath}
          opacity={SPINNER_GLYPH.trackOpacity}
          stroke={stroke}
          strokeLinecap="round"
          strokeWidth={SPINNER_GLYPH.strokeWidth}
        />
        <Path d={SPINNER_GLYPH.arcPath} stroke={stroke} strokeLinecap="round" strokeWidth={SPINNER_GLYPH.strokeWidth} />
      </Svg>
    </Animated.View>
  )
}

/* ---------------------------------- Button ---------------------------------- */

/**
 * Legacy `getIconPosition` swaps on `I18nManager.isRTL` and the frame variant
 * then maps the result to `flexDirection: row | row-reverse`. RN's own layout
 * ALSO flips `row`/`row-reverse` under RTL, so the two swaps cancel: the icon
 * ends up on the same physical side in both directions. That is legacy's
 * behavior (measured — see the RTL case in the native parity suite), and
 * reproducing the emitted `flexDirection` is what keeps the compat visually
 * identical to it, so the swap is kept rather than "fixed".
 */
function resolveIconPosition(iconPosition: ButtonIconPosition): ButtonIconPosition {
  if (!I18nManager.isRTL) {
    return iconPosition
  }
  return iconPosition === 'before' ? 'after' : 'before'
}

/**
 * The native lane's shadow-color policy (INFRA-3750): resolve through the
 * same map the web leg's `shadowColorExpression` throws on, but DROP the
 * `box-shadow` declaration (one-time dev warning) for a `$` token outside it
 * instead of crashing — the button renders always-mounted chrome, where a
 * missing shadow beats a startup error. Mirrors FlexCompat.native's own
 * `nativeShadowColorExpression`.
 */
function nativeShadowColorExpression(value: CompatColorValue): string | undefined {
  const resolved = shadowColorExpressionOrUndefined(value)
  if (resolved === undefined) {
    warnDroppedNativeShadowColorToken(String(unwrapVariableForNativeStyle(value)))
  }
  return resolved
}

const ButtonComponent = forwardRef<View, ButtonCompatProps>(function ButtonCompat(props, ref): JSX.Element {
  const {
    children,
    icon,
    fill = true,
    shouldAnimateBetweenLoadingStates = true,
    variant = 'default',
    emphasis = 'primary',
    size = 'medium',
    lineHeightDisabled = false,
    loading,
    iconPosition = 'before',
    disabled = false,
    onDisabledPress,
    onPress,
    backgroundColor,
    tag,
    href,
    target,
    rel,
    // Wired directly onto the Pressable (INFRA-3750, the mobile
    // LandingScreen.tsx create-account CTA): unlike the dimension slice below,
    // hitSlop compiles to no class on either leg, so it rides its own
    // destructure rather than the picked dimension props.
    hitSlop,
    'dd-action-name': ddActionName,
    // Inert with NO dev-warning — legacy parity, not a drop (the rationale lives on
    // ButtonCompatPlatformWebStyleProps in ./dimensions). Destructured so the ledger
    // never mis-reports it; pinned by platform-legs.test.tsx.
    '$platform-web': _platformWeb,
    testID,
    className,
    style,
    // Unhandled props (media pools + inert-parity props + the dimension slice, picked off props below) → dead-prop ledger.
    ...unhandled
  } = props
  useLayoutAnimationOnLoadingChange(loading, shouldAnimateBetweenLoadingStates)

  const isDisabled = isButtonDisabled({ disabled, loading })
  const interactiveWhileDisabled = isDisabled && Boolean(onDisabledPress)
  const pressHandler = isDisabled ? onDisabledPress : onPress

  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }), [scale])

  // Clear EVERY press/hover artifact when the button becomes non-interactive.
  // A disabled Pressable stops dispatching, so neither onHoverOut nor
  // onPressOut arrives: surviving hover paints the next enabled render
  // pre-hovered, and a surviving `scale` sticks the frame at PRESS_SCALE.
  useEffect(() => {
    if (isDisabled) {
      setHovered(false)
      setPressed(false)
      scale.value = withSporeCurve('fast', 1)
    }
  }, [isDisabled, scale])

  const handlePressIn = useCallback(() => {
    setPressed(true)
    scale.value = withSporeCurve('fast', PRESS_SCALE)
  }, [scale])

  const handlePressOut = useCallback(() => {
    setPressed(false)
    scale.value = withSporeCurve('fast', 1)
  }, [scale])

  const handleHoverIn = useCallback(() => {
    if (isDisabled && !interactiveWhileDisabled) {
      return
    }
    setHovered(true)
  }, [isDisabled, interactiveWhileDisabled])

  const handleHoverOut = useCallback(() => setHovered(false), [])

  // Auto-contrast only against a colour that actually paints (hex/rgb); a theme
  // token keeps the variant label colour. Token background resolution on this
  // leg is the open INFRA-3230 escalation.
  const customBackgroundColor = getMaybeHexOrRgbColor(backgroundColor)
  const customTextClass = customBackgroundColor ? getContrastTextClass(customBackgroundColor) : undefined

  const ctx: ButtonContextValue = {
    variant,
    emphasis,
    size,
    isDisabled,
    customTextClass,
    hovered,
    pressed,
  }

  const isTextChild = typeof children === 'string' || typeof children === 'number'

  // The wired dimension slice (min/max, gap/padding, the INFRA-3661 margins) is a DERIVED pick —
  // `DIMENSION_PROP_KEYS` minus the web-only exclusions, pinned in dimensions.test.ts — so a future
  // lane prop can never be silently hand-omitted here. Its classes ride the className (token px
  // values are in the generated NATIVE safelist), but uniwind's scanner is static, so the RESOLVED
  // values are also declared through `style` (the FlexCompat.native doctrine) — an out-of-safelist
  // value would otherwise drop in SILENCE (the INFRA-3272 defect class). Must be
  // compatLayoutNativeStyle: only the layout entry point runs the flexbox family that handles
  // `gap` — the universal one silently ignores it.
  const dimensionProps = buttonCompatNativeDimensions(props)
  const dimensions = hasButtonCompatDimensions(dimensionProps) ? compatLayoutNativeStyle(dimensionProps) : undefined
  // One dev-warn ledger for everything this leg drops — the style lane's own drops, the excluded
  // web-only dimension props (height/justifyContent/flexBasis, off the SAME exclusion
  // set the pick applies), the link form when requested (`tag="a"`), and the media pools via
  // `nativeWarningProps`, whose fixed dead-key set leaves the inert-parity rest un-warned.
  warnUnsupportedNativeProps('ButtonCompat', [
    ...(dimensions?.dropped ?? []),
    ...buttonCompatNativeDroppedDimensionNames(props),
    ...droppedLinkFormPropNames({ tag, href, target, rel }),
    ...nativeWarningProps(unhandled),
  ])

  const frameClassName = buttonCompatNativeFrameClassName(
    {
      size,
      iconPosition: resolveIconPosition(iconPosition),
      fill,
      variant,
      emphasis,
      disabled,
      loading,
      onDisabledPress,
      backgroundColor,
      ...dimensionProps,
      className,
      hovered,
      pressed,
    },
    { shadowColorExpression: nativeShadowColorExpression },
  )
  // RNGH's Pressable isn't uniwind-wrapped (only `react-native` imports are), so a
  // className on it is silently dropped — resolve it here and paint through style.
  // The className stays on the element for the parity suite's readbacks.
  const frameStyle = useResolveClassNames(frameClassName)

  return (
    <ButtonContext.Provider value={ctx}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled || undefined }}
        className={frameClassName}
        dd-action-name={ddActionName ?? (typeof children === 'string' ? children : undefined)}
        disabled={isDisabled && !interactiveWhileDisabled}
        hitSlop={hitSlop}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPress={pressHandler}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        ref={ref}
        style={[
          frameStyle,
          dimensions?.style,
          // The custom-bg brightness filter has no RN equivalent, so the color
          // is painted directly. Legacy native derives the border from it too —
          // skipped when an explicit borderColor owns the border (it paints
          // through the class/style lanes, which this later entry would beat).
          backgroundColor && !isDisabled
            ? { backgroundColor, ...(dimensionProps.borderColor === undefined && { borderColor: backgroundColor }) }
            : undefined,
          animatedStyle,
          style,
        ]}
        testID={testID}
      >
        {!loading && icon ? <ButtonIcon>{icon}</ButtonIcon> : null}
        {loading ? <ButtonSpinner /> : null}
        {isTextChild ? <ButtonText lineHeightDisabled={lineHeightDisabled}>{children}</ButtonText> : children}
      </AnimatedPressable>
    </ButtonContext.Provider>
  )
})

/** Drop-in Tailwind twin of the legacy `ui/src` Button, incl. Button.Text / Button.Icon. */
export const ButtonCompat = Object.assign(ButtonComponent, {
  Text: ButtonText,
  Icon: ButtonIcon,
})
