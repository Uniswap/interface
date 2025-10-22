import { BlurView, type BlurViewProps } from 'expo-blur'
import { Children, cloneElement, forwardRef, isValidElement, memo, type ReactNode, useMemo } from 'react'
import { type GestureResponderEvent, StyleSheet } from 'react-native'
import type { ColorTokens } from 'tamagui'
import { type TamaguiElement, withStaticProperties, type YStackProps } from 'tamagui'
import { ThemedIcon } from 'ui/src/components/buttons/Button/components/ThemedIcon'
import { withAnimated } from 'ui/src/components/factories/animated'
import { Text, type TextProps } from 'ui/src/components/text'
import { TouchableAreaFrame } from 'ui/src/components/touchable/TouchableArea/TouchableAreaFrame'
import type { TouchableAreaProps } from 'ui/src/components/touchable/TouchableArea/types'
import { useAutoDimensions } from 'ui/src/components/touchable/TouchableArea/useAutoDimensions'
import { useAutoHitSlop } from 'ui/src/components/touchable/TouchableArea/useAutoHitSlop'
import { getMaybeHoverColor, zIndexes } from 'ui/src/theme'
import { isTestEnv } from 'utilities/src/environment/env'
import { isIOS, isMobileApp, isWebPlatform } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

export type TouchableAreaEvent = GestureResponderEvent

// TODO(MOB-2826): tests are picking up weird animationStyle on snapshots...
const DEFAULT_ANIMATION_PROPS: Partial<YStackProps> = isTestEnv()
  ? {}
  : {
      animation: 'simple',
      animateOnly: ['transform', 'opacity'],
    }
const blurViewStyle: BlurViewProps['style'] = { ...StyleSheet.absoluteFillObject, zIndex: zIndexes.negative }

const WithInjectedColors = memo(function WithInjectedColors({
  children,
  disabled,
  variant,
  enabled,
}: {
  children: ReactNode
  disabled?: boolean
  variant?: TouchableAreaProps['variant']
  enabled?: boolean
}): ReactNode[] | ReactNode {
  if (!enabled) {
    // Early return if we don't need to inject colors
    // This is a performance optimization to avoid unnecessary cloning and mapping
    return children
  }

  return Children.toArray(children).map((child) => {
    if (!isValidElement(child)) {
      return child
    }

    // We don't want to override this if it's already set
    let groupHover: TextProps['$group-hover'] = child.props['$group-hover']

    // decide which color properties to use
    const maybeColor: string | ColorTokens = child.props.color ?? '$accent3'
    const maybeBackgroundColor: string | ColorTokens = child.props.backgroundColor

    // if we don't have a group hover, and we have a color or background color, we can get a hover color
    if (!groupHover && [maybeColor, maybeBackgroundColor].some((val) => typeof val === 'string')) {
      const maybeColorHover = getMaybeHoverColor(maybeColor)
      const maybeBackgroundColorHover = getMaybeHoverColor(maybeBackgroundColor)

      groupHover = {
        color: disabled ? undefined : maybeColorHover,
        backgroundColor: disabled ? undefined : maybeBackgroundColorHover,
      }
    }

    // `disabled` overrides `maybeBackgroundColor` if it's already set
    const backgroundColorConsideringDisabled: string | ColorTokens =
      disabled && (variant === 'filled' || maybeBackgroundColor) ? '$surface2' : maybeBackgroundColor

    // `disabled` overrides `maybeColor` if it's already set
    const colorConsideringDisabled: string | ColorTokens = disabled ? '$neutral2' : maybeColor

    return cloneElement(child, {
      // @ts-expect-error '$group-item-hover' is a tamagui type, not a React Native type
      color: colorConsideringDisabled,
      backgroundColor: backgroundColorConsideringDisabled,
      '$group-hover': groupHover,
    })
  })
})

const TouchableAreaComponentWithoutMemo = forwardRef<TamaguiElement, TouchableAreaProps>(function TouchableArea(
  {
    children,
    hoverable = true,
    onLayout: onLayoutProp,
    shouldConsiderMinimumDimensions = false,
    width: widthProp,
    height: heightProp,
    scaleTo,
    pressStyle: pressStyleProp,
    activeOpacity = 0.75,
    animation: animationProp,
    animateOnly: animateOnlyProp,
    variant = 'unstyled',
    shouldStopPropagation = true,
    onPress,
    onPressIn,
    onPressOut,
    shouldAutomaticallyInjectColors = isWebPlatform,
    ...restProps
  },
  ref,
): JSX.Element {
  const [hitSlop, onLayoutWithHitSlop] = useAutoHitSlop(onLayoutProp)

  const { onLayout, width, height } = useAutoDimensions({
    onLayout: onLayoutWithHitSlop,
    shouldConsiderMinimumDimensions,
    width: widthProp,
    height: heightProp,
  })

  const pressStyle: YStackProps['pressStyle'] = useMemo(() => {
    const maybeScaleStyle = scaleTo ? { scale: scaleTo } : {}
    const maybeActiveOpacityStyle = activeOpacity ? { opacity: activeOpacity } : {}

    const finalStyle = StyleSheet.flatten([maybeScaleStyle, maybeActiveOpacityStyle, pressStyleProp])

    return finalStyle
  }, [scaleTo, activeOpacity, pressStyleProp])

  const animation = isTestEnv() ? undefined : (animationProp ?? DEFAULT_ANIMATION_PROPS.animation)
  const animateOnly = isTestEnv() ? undefined : (animateOnlyProp ?? DEFAULT_ANIMATION_PROPS.animateOnly)

  // Wrap onPress to stop propagation if needed
  const handlePress = useEvent((event: TouchableAreaEvent): void => {
    if (!shouldStopPropagation) {
      onPress?.(event)
      return
    }

    if (typeof event.stopPropagation === 'function') {
      event.stopPropagation()
    }

    onPress?.(event)
  })

  // Wrap onPress to stop propagation if needed
  const handlePressIn = useEvent((event: TouchableAreaEvent): void => {
    if (!shouldStopPropagation) {
      onPressIn?.(event)
      return
    }

    if (typeof event.stopPropagation === 'function') {
      event.stopPropagation()
    }

    onPressIn?.(event)
  })

  const handlePressOut = useEvent((event: TouchableAreaEvent): void => {
    if (!shouldStopPropagation) {
      onPressOut?.(event)
      return
    }

    if (typeof event.stopPropagation === 'function') {
      event.stopPropagation()
    }

    onPressOut?.(event)
  })

  if (variant === 'floating' && isMobileApp) {
    return (
      <TouchableAreaFrame
        ref={ref}
        hoverable={hoverable}
        hitSlop={hitSlop}
        animation={animation}
        animateOnly={animateOnly}
        variant={variant}
        pressStyle={pressStyle}
        onLayout={onLayout}
        onPress={onPress ? handlePress : undefined}
        onPressIn={onPressIn ? handlePressIn : undefined}
        onPressOut={onPressOut ? handlePressOut : undefined}
        {...restProps}
        width={width}
        height={height}
      >
        <WithInjectedColors enabled={shouldAutomaticallyInjectColors} variant={variant} disabled={restProps.disabled}>
          {children}
        </WithInjectedColors>
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          style={blurViewStyle}
          intensity={30}
          tint={isIOS ? 'light' : 'default'}
        />
      </TouchableAreaFrame>
    )
  }

  // Web uses CSS for blur, so we don't need to use `expo-blur`'s `BlurView` for the `floating` variant
  return (
    <TouchableAreaFrame
      ref={ref}
      hoverable={hoverable}
      animation={animation}
      animateOnly={animateOnly}
      variant={variant}
      hitSlop={hitSlop}
      pressStyle={pressStyle}
      onLayout={onLayout}
      onPress={onPress ? handlePress : undefined}
      onPressIn={onPressIn ? handlePressIn : undefined}
      onPressOut={onPressOut ? handlePressOut : undefined}
      {...restProps}
      width={width}
      height={height}
    >
      <WithInjectedColors enabled={shouldAutomaticallyInjectColors} variant={variant} disabled={restProps.disabled}>
        {children}
      </WithInjectedColors>
    </TouchableAreaFrame>
  )
})

const TouchableAreaComponent = memo(TouchableAreaComponentWithoutMemo)

/**
 * `TouchableArea` is an interactive element in the UI that performs an action when clicked, tapped, pressed, or long pressed.
 * If you are trying to implement a standard button DO NOT USE this component. Use the Button component instead with the desired `variant`, `emphasis`, and `size`.
 * If you are trying to implement a clickable/tappable text, use `TouchableTextLink` instead.
 * It wraps its children within a styled `TouchableAreaFrame`, providing hover effects,
 * press state handling, and automatic dimension adjustments for minimum touch targets.
 * It also automatically calculates appropriate hitSlop for better touch accuracy on smaller elements.
 *
 * This component is the core building block for interactive elements and can be customized
 * via props passed down to `TouchableAreaFrame`.
 * @link [Notion Design Spec](https://www.notion.so/uniswaplabs/Touchable-Area-WIP-1a5c52b2548b80339885d819792cc085?pvs=4)
 * @param {React.ReactNode} children - The content to be rendered inside the touchable area.
 * @param {boolean} [hoverable=true] - Determines if hover styles should be applied. Defaults to true.
 * @param {function} onLayoutProp - Optional layout callback, invoked after the component measures its layout.
 * @param {string} backgroundColor - On Android, with `variant={'raised'}`, this must be explicitly set for the shadow to properly render.
 * This is wrapped by `useAutoHitSlop` and `useAutoDimensions`.
 * @param {boolean} [shouldConsiderMinimumDimensions=false] - If true, ensures the component meets minimum touch target dimensions. Defaults to false.
 * @param {DimensionValue | undefined} widthProp - Explicit width for the component. If not provided, dimensions might be inferred or auto-adjusted.
 * @param {DimensionValue | undefined} heightProp - Explicit height for the component. If not provided, dimensions might be inferred or auto-adjusted.
 * @param {number | undefined} scaleTo - If provided, the component will scale to the given value when pressed.
 * @param {number | undefined} activeOpacity - If provided, the component will have the given opacity when pressed. Defaults to 0.75.
 * @param {TouchableAreaProps} restProps - Additional props passed down to the underlying `TouchableAreaFrame`.
 * @param {boolean} [shouldStopPropagation=true] - If true (default), calls event.stopPropagation() on press events to prevent bubbling to parent touchables.
 * @param {boolean} [shouldAutomaticallyInjectColors] - If true, automatically injects colors into the children based on the Spore Design System guidelines. Defaults to true on web, false on native.
 * @param {React.Ref<TamaguiElement>} ref - Forwarded ref to the underlying `TouchableAreaFrame` element.
 * @returns {JSX.Element} The rendered TouchableArea component.
 * @see TouchableAreaFrame for styling and variant options.
 * @see useAutoHitSlop for automatic hitSlop calculation.
 * @see useAutoDimensions for minimum dimension handling.
 */

export const TouchableArea = withStaticProperties(TouchableAreaComponent, {
  Text,
  Icon: ThemedIcon,
})

export const AnimatedTouchableArea = withAnimated(TouchableArea)
