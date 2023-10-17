import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo, useMemo } from 'react'
import { getNumberFormatSettings } from 'react-native-localize'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'

// if this setting is changed in phone settings the app would be restarted
const { decimalSeparator } = getNumberFormatSettings()

export enum KeyAction {
  Insert = 'insert',
  Delete = 'delete',
}

export type KeyLabel = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | '0' | 'backspace'

type KeyProps = {
  action: KeyAction
  label: KeyLabel
  align: 'flex-start' | 'center' | 'flex-end'
  hidden?: boolean
  paddingTop?: '$spacing12'
}

interface DecimalPadProps {
  disabled?: boolean
  hideDecimal?: boolean
  disabledKeys?: Partial<Record<KeyLabel, boolean>>
  onKeyPress?: (label: KeyLabel, action: KeyAction) => void
  onKeyLongPress?: (label: KeyLabel, action: KeyAction) => void
}

export const DecimalPad = memo(function DecimalPad({
  disabled = false,
  hideDecimal = false,
  disabledKeys = {},
  onKeyPress,
  onKeyLongPress,
}: DecimalPadProps): JSX.Element {
  const keys: KeyProps[] = useMemo(() => {
    return [
      {
        label: '1',
        action: KeyAction.Insert,
        align: 'center',
        paddingTop: '$spacing12',
      },
      {
        label: '2',
        action: KeyAction.Insert,
        align: 'center',
        paddingTop: '$spacing12',
      },
      {
        label: '3',
        action: KeyAction.Insert,
        align: 'center',
        paddingTop: '$spacing12',
      },
      { label: '4', action: KeyAction.Insert, align: 'center' },
      { label: '5', action: KeyAction.Insert, align: 'center' },
      { label: '6', action: KeyAction.Insert, align: 'center' },
      { label: '7', action: KeyAction.Insert, align: 'center' },
      { label: '8', action: KeyAction.Insert, align: 'center' },
      { label: '9', action: KeyAction.Insert, align: 'center' },
      {
        label: '.',
        action: KeyAction.Insert,
        hidden: hideDecimal,
        align: 'center',
      },
      { label: '0', action: KeyAction.Insert, align: 'center' },
      {
        label: 'backspace',
        action: KeyAction.Delete,
        align: 'center',
      },
    ]
  }, [hideDecimal])

  return (
    <Flex row flexWrap="wrap">
      {keys.map((key, i) =>
        key.hidden ? (
          <Flex key={i} alignItems={key.align} height="25%" width={i % 3 === 1 ? '50%' : '25%'} />
        ) : (
          <KeyButton
            {...key}
            key={i}
            disabled={disabled || disabledKeys[key.label]}
            index={i}
            onLongPress={onKeyLongPress}
            onPress={onKeyPress}
          />
        )
      )}
    </Flex>
  )
})

type KeyButtonProps = KeyProps & {
  index: number
  disabled?: boolean
  onPress?: (label: KeyLabel, action: KeyAction) => void
  onLongPress?: (label: KeyLabel, action: KeyAction) => void
}

const KeyButton = memo(function KeyButton({
  index,
  action,
  disabled,
  label,
  align,
  paddingTop,
  onPress,
  onLongPress,
}: KeyButtonProps): JSX.Element {
  const handlePress = (): void => {
    if (disabled) return
    onPress?.(label, action)
  }

  const handleLongPress = (): void => {
    if (disabled) return
    onLongPress?.(label, action)
  }

  return (
    <TouchableArea
      hapticFeedback
      ignoreDragEvents
      activeOpacity={1}
      alignItems={align}
      disabled={disabled}
      hapticStyle={ImpactFeedbackStyle.Light}
      justifyContent="center"
      p="$spacing16"
      pt={paddingTop}
      scaleTo={1.125}
      testID={'decimal-pad-' + label}
      width={index % 3 === 1 ? '50%' : '25%'}
      onLongPress={handleLongPress}
      onPress={handlePress}>
      {label === 'backspace' ? (
        <Icons.BackArrow color={disabled ? '$neutral3' : '$neutral1'} size={32} />
      ) : (
        <Text color={disabled ? '$neutral3' : '$neutral1'} textAlign="center" variant="heading2">
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
