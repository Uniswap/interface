import { ImpactFeedbackStyle } from 'expo-haptics'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { I18nManager, LayoutChangeEvent } from 'react-native'
import { Flex, Icons, Text, TouchableArea, useMedia } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'

export enum KeyAction {
  Insert = 'insert',
  Delete = 'delete',
}

export type KeyLabel = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | '0' | 'backspace'

type KeyProps = {
  action: KeyAction
  label: KeyLabel
  hidden?: boolean
}

interface DecimalPadProps {
  disabled?: boolean
  hideDecimal?: boolean
  disabledKeys?: Partial<Record<KeyLabel, boolean>>
  maxHeight: number | null
  onKeyPress?: (label: KeyLabel, action: KeyAction) => void
  onKeyLongPress?: (label: KeyLabel, action: KeyAction) => void
  onReady: () => void
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
          {row.map((key, keyIndex) =>
            key.hidden ? (
              <Flex key={keyIndex} alignItems="center" width="50%" />
            ) : (
              <KeyButton
                {...key}
                key={keyIndex}
                disabled={disabled || disabledKeys[key.label]}
                index={keyIndex}
                sizeMultiplier={sizeMultiplier}
                onLongPress={onKeyLongPress}
                onPress={onKeyPress}
              />
            )
          )}
        </Flex>
      ))}
    </Flex>
  )
})

type KeyButtonProps = KeyProps & {
  index: number
  disabled?: boolean
  sizeMultiplier: SizeMultiplier
  onPress?: (label: KeyLabel, action: KeyAction) => void
  onLongPress?: (label: KeyLabel, action: KeyAction) => void
}

const KeyButton = memo(function KeyButton({
  index,
  action,
  disabled,
  label,
  sizeMultiplier,
  onPress,
  onLongPress,
}: KeyButtonProps): JSX.Element {
  const media = useMedia()
  const { decimalSeparator } = useAppFiatCurrencyInfo()

  const handlePress = (): void => {
    if (disabled) {
      return
    }
    onPress?.(label, action)
  }

  const handleLongPress = (): void => {
    if (disabled) {
      return
    }
    onLongPress?.(label, action)
  }

  const color = disabled ? '$neutral3' : '$neutral1'

  // On smaller screens, we want a wider numpad display
  const keyWidth = useMemo(() => {
    if (media.short) {
      return index % 3 === 1 ? '60%' : '20%'
    } else {
      return index % 3 === 1 ? '50%' : '25%'
    }
  }, [index, media.short])

  return (
    <TouchableArea
      hapticFeedback
      ignoreDragEvents
      $short={{ py: 16 * sizeMultiplier.padding }}
      activeOpacity={1}
      alignItems="center"
      disabled={disabled}
      hapticStyle={ImpactFeedbackStyle.Light}
      px={16 * sizeMultiplier.padding}
      py={12 * sizeMultiplier.padding}
      scaleTo={1.2}
      testID={'decimal-pad-' + label}
      width={keyWidth}
      onLongPress={handleLongPress}
      onPress={handlePress}>
      {label === 'backspace' ? (
        I18nManager.isRTL ? (
          <Icons.RightArrow color={color} size={24 * sizeMultiplier.icon} />
        ) : (
          <Icons.LeftArrow color={color} size={24 * sizeMultiplier.icon} />
        )
      ) : (
        <Text
          color={color}
          style={{
            lineHeight: fonts.heading2.lineHeight * sizeMultiplier.lineHeight,
            fontSize: fonts.heading2.fontSize * sizeMultiplier.fontSize,
          }}
          textAlign="center">
          {
            label === '.' ? decimalSeparator : label
            /* respect phone settings to show decimal separator in the numpad,
             * but in the input we always have '.' as a decimal separator for now*/
          }
        </Text>
      )}
    </TouchableArea>
  )
})
