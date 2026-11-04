/**
 * NATIVE legs of `ThemedIconCompat` / `ThemedSpinnerCompat`, transcribed from
 * `../button-compat/ButtonCompat.native.tsx`'s `ButtonIcon` / `ButtonSpinner`:
 * react-native-svg inherits nothing from a uniwind class, so the glyph and
 * the `CircleSpinner` icon take a CONCRETE color resolved from the SAME class string
 * the label renders (`useResolveClassNames`), and sizes are cloned as
 * numbers. Frame hover state arrives through the frame context.
 */
import { cloneElement, useEffect, type JSX } from 'react'
import { View, type ColorValue as RNColorValue } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useResolveClassNames } from 'uniwind'
import { buttonCompatNativeColorClassName, getContrastTextClass, NATIVE_ICON_SIZE_PX } from '../button-compat/compile'
import { CircleSpinner } from '../components/icons/CircleSpinner'
import { useButtonFrameContext } from './context'
import { getMaybeHexOrRgbColor } from './custom-color'
import type { ThemedIconCompatProps, ThemedSpinnerCompatProps } from './themed-icon-props'

export type { ThemedIconCompatProps, ThemedSpinnerCompatProps } from './themed-icon-props'

const SPINNER_DEGREES = 360
const SPINNER_DURATION_MS = 1000

interface ResolvedContentContext {
  colorClassName: string
  box: number
}

function useContentContext(props: ThemedSpinnerCompatProps, className?: string): ResolvedContentContext {
  const ctx = useButtonFrameContext()
  const customBackground =
    getMaybeHexOrRgbColor(props['custom-background-color']) ??
    (props['custom-background-color'] === undefined ? ctx.customBackgroundColor : undefined)
  const variant = props.variant ?? ctx.variant
  const emphasis = props.emphasis ?? ctx.emphasis
  const size = props.size ?? ctx.size
  const isDisabled = props.isDisabled ?? ctx.isDisabled
  const colorClassName = buttonCompatNativeColorClassName({
    variant,
    emphasis,
    size,
    isDisabled,
    customTextClass: customBackground ? getContrastTextClass(customBackground) : undefined,
    hovered: ctx.hovered ?? false,
    pressed: ctx.pressed ?? false,
    className,
  })
  // Legacy useIconSizes: 'icon' → $icon.16/16/20/24/24; 'button' → label line-height.
  const box =
    props.typeOfButton === 'icon'
      ? { xxsmall: 16, xsmall: 16, small: 20, medium: 24, large: 24 }[size]
      : NATIVE_ICON_SIZE_PX[size]
  return { colorClassName, box }
}

export function ThemedIconCompat(props: ThemedIconCompatProps): JSX.Element | null {
  const { colorClassName, box } = useContentContext(props, props.className)
  const color = useResolveClassNames(colorClassName).color as RNColorValue | undefined
  const { children } = props
  if (!children) {
    return null
  }
  const childProps = children.props as { color?: RNColorValue } | undefined
  return (
    <View
      style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}
      {...{ className: colorClassName }}
    >
      {cloneElement(children, { color: childProps?.color ?? color, width: box, height: box })}
    </View>
  )
}

export function ThemedSpinnerCompat(props: ThemedSpinnerCompatProps): JSX.Element {
  // `box` respects typeOfButton like the web leg: label line-height for
  // buttons (NATIVE_SPINNER_SIZE === NATIVE_ICON_SIZE_PX), $icon sizes for
  // icon buttons.
  const { colorClassName, box: size } = useContentContext(props)
  const stroke = useResolveClassNames(colorClassName).color as RNColorValue | undefined
  const rotation = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rotation.value}deg` }] }), [rotation])

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(SPINNER_DEGREES, {
        duration: SPINNER_DURATION_MS,
        // SpinningLoader.native's hand-written curve — deliberately not a Spore entry.
        easing: Easing.bezier(0.83, 0, 0.17, 1),
      }),
      -1,
    )
    return () => cancelAnimation(rotation)
  }, [rotation])

  return (
    <Animated.View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}
      testID="button-frame-compat-spinner"
      {...{ className: colorClassName }}
    >
      <CircleSpinner color={typeof stroke === 'string' ? stroke : undefined} size={size} />
    </Animated.View>
  )
}
