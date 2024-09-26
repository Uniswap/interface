import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { I18nManager, LayoutChangeEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated'
import { Flex, Text, useHapticFeedback } from 'ui/src'
import { LeftArrow, RightArrow } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { DecimalPadProps, KeyAction, KeyLabel } from 'uniswap/src/features/transactions/DecimalPadInput/types'

const KEY_PRESS_ANIMATION_DURATION_MS = 150

type KeyProps = {
  action: KeyAction
  label: KeyLabel
  hidden?: boolean
}

type SizeMultiplier = {
  fontSize: number
  icon: number
  lineHeight: number
  padding: number
}

export const DecimalPad = memo(function DecimalPad({
  disabled = false,
  hideDecimal = false,
  disabledKeys = {},
  maxHeight,
  onKeyPress,
  onKeyLongPress,
  onReady,
  onTriggerInputShakeAnimation,
}: DecimalPadProps): JSX.Element {
  const currentHeightRef = useRef<number | null>(null)
  const maxHeightRef = useRef<number | null>(maxHeight)
  const [currentHeight, setCurrentHeight] = useState<number | null>(null)
  const [sizeMultiplier, setSizeMultiplier] = useState<SizeMultiplier>({
    fontSize: 1,
    icon: 1,
    lineHeight: 1,
    padding: 1,
  })

  const keys: KeyProps[][] = useMemo(() => {
    return [
      [
        {
          label: '1',
          action: KeyAction.Insert,
        },
        {
          label: '2',
          action: KeyAction.Insert,
        },
        {
          label: '3',
          action: KeyAction.Insert,
        },
      ],
      [
        { label: '4', action: KeyAction.Insert },
        { label: '5', action: KeyAction.Insert },
        { label: '6', action: KeyAction.Insert },
      ],
      [
        { label: '7', action: KeyAction.Insert },
        { label: '8', action: KeyAction.Insert },
        { label: '9', action: KeyAction.Insert },
      ],
      [
        {
          label: '.',
          action: KeyAction.Insert,
          hidden: hideDecimal,
        },
        { label: '0', action: KeyAction.Insert, align: 'center' },
        {
          label: 'backspace',
          action: KeyAction.Delete,
        },
      ],
    ]
  }, [hideDecimal])

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setCurrentHeight(event.nativeEvent.layout.height)
  }, [])

  useEffect(() => {
    currentHeightRef.current = currentHeight
    maxHeightRef.current = maxHeight

    if (currentHeight === null || maxHeight === null) {
      return
    }

    if (currentHeight < maxHeight) {
      // We call `onReady` on the next tick in case the layout is still changing and `maxHeight` is now different.
      setTimeout(() => {
        if (
          currentHeightRef.current !== null &&
          maxHeightRef.current !== null &&
          currentHeightRef.current < maxHeightRef.current
        ) {
          onReady()
        }
      }, 0)
      return
    }

    setSizeMultiplier({
      fontSize: sizeMultiplier.fontSize * 0.95,
      icon: sizeMultiplier.icon * 0.97,
      lineHeight: sizeMultiplier.lineHeight * 0.95,
      padding: sizeMultiplier.padding * 0.8,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHeight, maxHeight])

  if (maxHeight === null) {
    return <></>
  }

  return (
    <Flex onLayout={onLayout}>
      {keys.map((row, rowIndex) => (
        <Flex key={rowIndex} row alignItems="center">
          {row.map((key, keyIndex) => {
            const isNumberKey =
              key.label.charCodeAt(0) >= '0'.charCodeAt(0) && key.label.charCodeAt(0) <= '9'.charCodeAt(0)

            const isKeyDisabled = disabled || disabledKeys[key.label]
            const shouldTriggerShake = isKeyDisabled && isNumberKey

            return key.hidden ? (
              <Flex key={keyIndex} alignItems="center" width="50%" />
            ) : (
              <KeyButton
                {...key}
                key={keyIndex}
                // Unless the entire `DecimalPad` is disabled, we only truly disable and gray out the decimal separator and backspace keys.
                // We never gray out the number keys. Instead we trigger a shake animation if the user presses them when they're "disabled".
                // Because of this, we don't set the `disabled` prop on the number keys so we can trigger the `onPress` event.
                disabled={disabled || (isKeyDisabled && !shouldTriggerShake)}
                sizeMultiplier={sizeMultiplier}
                onLongPress={shouldTriggerShake ? onTriggerInputShakeAnimation : onKeyLongPress}
                onPress={shouldTriggerShake ? onTriggerInputShakeAnimation : onKeyPress}
              />
            )
          })}
        </Flex>
      ))}
    </Flex>
  )
})

type KeyButtonProps = KeyProps & {
  disabled?: boolean
  sizeMultiplier: SizeMultiplier
  onPress?: (label: KeyLabel, action: KeyAction) => void
  onLongPress?: (label: KeyLabel, action: KeyAction) => void
}

const animationOptions = { duration: KEY_PRESS_ANIMATION_DURATION_MS }

const KeyButton = memo(function KeyButton({
  action,
  disabled,
  label,
  sizeMultiplier,
  onPress,
  onLongPress,
}: KeyButtonProps): JSX.Element {
  const { decimalSeparator } = useAppFiatCurrencyInfo()
  const { hapticFeedback } = useHapticFeedback()

  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  const handlePress = useCallback(async (): Promise<void> => {
    if (disabled) {
      return
    }
    onPress?.(label, action)
    scale.value = withSequence(withTiming(1.3, animationOptions), withTiming(1, animationOptions))
    opacity.value = withSequence(withTiming(0.75, animationOptions), withTiming(1, animationOptions))
    await hapticFeedback.impact()
  }, [action, disabled, hapticFeedback, label, onPress, opacity, scale])

  const handleLongPress = useCallback((): void => {
    if (disabled) {
      return
    }
    onLongPress?.(label, action)
  }, [action, disabled, label, onLongPress])

  const tap = Gesture.Tap().onBegin(handlePress)
  const longPress = Gesture.LongPress().onStart(handleLongPress)
  const composedGesture = Gesture.Simultaneous(tap, longPress)

  const color = disabled ? '$neutral3' : '$neutral1'

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    // We use `GestureDetector` instead of `TouchableArea` because `TouchableArea` is not able to detect 2 fingers at the same time (only one of the events will trigger).
    // For a custom keyboard, we want to be able to detect each finger as a separate tap even when they are pressed at the same (or almost the same) time.
    <GestureDetector gesture={composedGesture}>
      <Flex
        row
        $short={{ py: spacing.spacing16 * sizeMultiplier.padding }}
        alignItems="center"
        flex={1}
        height="100%"
        px={spacing.spacing16 * sizeMultiplier.padding}
        py={spacing.spacing12 * sizeMultiplier.padding}
      >
        <AnimatedFlex grow alignItems="center" style={animatedStyle}>
          {label === 'backspace' ? (
            I18nManager.isRTL ? (
              <RightArrow color={color} size={iconSizes.icon24 * sizeMultiplier.icon} />
            ) : (
              <LeftArrow color={color} size={iconSizes.icon24 * sizeMultiplier.icon} />
            )
          ) : (
            <Text
              color={color}
              style={{
                lineHeight: fonts.heading2.lineHeight * sizeMultiplier.lineHeight,
                fontSize: fonts.heading2.fontSize * sizeMultiplier.fontSize,
              }}
              textAlign="center"
            >
              {
                label === '.' ? decimalSeparator : label
                /* respect phone settings to show decimal separator in the numpad,
                 * but in the input we always have '.' as a decimal separator for now*/
              }
            </Text>
          )}
        </AnimatedFlex>
      </Flex>
    </GestureDetector>
  )
})
