import { ImpactFeedbackStyle } from 'expo-haptics'
import { memo, useMemo } from 'react'
import { I18nManager, TextInputProps } from 'react-native'
import { AnimatedFlex, Flex, Icons, Text, TouchableArea } from 'ui/src'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'

enum KeyAction {
  Insert = 'insert',
  Delete = 'delete',
}

export type KeyLabel =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '.'
  | ','
  | '0'
  | 'backspace'

type KeyProps = {
  action: KeyAction
  disabled?: (value: string) => boolean
  label: KeyLabel
  hidden?: boolean
  paddingTop?: '$spacing12'
  align: 'flex-start' | 'center' | 'flex-end'
}

interface DecimalPadProps {
  hideDecimal?: boolean
  setValue: (newValue: string) => void
  value?: string
  disabled?: boolean
  selection?: TextInputProps['selection']
  resetSelection?: (start: number, end?: number) => void
  hasCurrencyPrefix?: boolean
}

/**
 * TODO:
 * This component is depracted and should be replaced with DecimalPadInput, which is being used
 * int he new swap components.
 */
export function _DecimalPad({
  setValue,
  value = '',
  hideDecimal = false,
  disabled = false,
  selection,
  resetSelection,
  hasCurrencyPrefix,
}: DecimalPadProps): JSX.Element {
  const cursorAtStart = hasCurrencyPrefix
    ? selection?.start === 1 && selection?.end === 1
    : selection?.start === 0 && selection?.end === 0
  const keys: KeyProps[] = useMemo(() => {
    return [
      {
        label: '1',
        action: KeyAction.Insert,
        align: 'center',
        paddingTop: '$spacing12',
        disabled: () => disabled,
      },
      {
        label: '2',
        action: KeyAction.Insert,
        align: 'center',
        paddingTop: '$spacing12',
        disabled: () => disabled,
      },
      {
        label: '3',
        action: KeyAction.Insert,
        align: 'center',
        paddingTop: '$spacing12',
        disabled: () => disabled,
      },
      { label: '4', action: KeyAction.Insert, align: 'center', disabled: () => disabled },
      { label: '5', action: KeyAction.Insert, align: 'center', disabled: () => disabled },
      { label: '6', action: KeyAction.Insert, align: 'center', disabled: () => disabled },
      { label: '7', action: KeyAction.Insert, align: 'center', disabled: () => disabled },
      { label: '8', action: KeyAction.Insert, align: 'center', disabled: () => disabled },
      { label: '9', action: KeyAction.Insert, align: 'center', disabled: () => disabled },
      {
        label: '.',
        action: KeyAction.Insert,
        disabled: (v: string) => v.includes('.') || disabled,
        hidden: hideDecimal,
        align: 'center',
      },
      { label: '0', action: KeyAction.Insert, align: 'center', disabled: () => disabled },
      {
        label: 'backspace',
        action: KeyAction.Delete,
        disabled: (v: string) => cursorAtStart || v.length === 0 || disabled,
        align: 'center',
      },
    ]
  }, [disabled, hideDecimal, cursorAtStart])
  return (
    <AnimatedFlex row flexWrap="wrap">
      {keys.map((key, i) =>
        key.hidden ? (
          <Flex key={i} alignItems={key.align} height="25%" width={i % 3 === 1 ? '50%' : '25%'} />
        ) : (
          <KeyButton
            {...key}
            key={i}
            hasCurrencyPrefix={hasCurrencyPrefix}
            index={i}
            resetSelection={resetSelection}
            selection={selection}
            setValue={setValue}
            value={value}
          />
        )
      )}
    </AnimatedFlex>
  )
}

type KeyButtonProps = KeyProps & {
  index: number
  setValue: (newValue: string) => void
  value: string
  selection?: TextInputProps['selection']
  resetSelection?: (start: number, end?: number) => void
  hasCurrencyPrefix?: boolean
}

function KeyButton({
  index,
  action,
  disabled,
  label,
  setValue,
  value,
  align,
  paddingTop,
  selection,
  resetSelection,
  hasCurrencyPrefix,
}: KeyButtonProps): JSX.Element {
  const { decimalSeparator } = useAppFiatCurrencyInfo()

  const isDisabled = disabled?.(value) ?? false
  // when input is in terms of fiat currency, there is an extra symbol (e.g. "$") in the TextInput value, but not in props.value
  // so account for the extra prefix in `selection`
  // i.e. when cursor is in: "$5.|13", selection will give start === 3, end === 3, but we
  // should only be deleting/inserting at position 2 of "5.13"
  // except in the case where start === 0 then also just treat it as start of the non-prefixed string (to avoid -1 index)
  const prefixLength = hasCurrencyPrefix ? 1 : 0
  const start =
    selection && selection.start > 0 && hasCurrencyPrefix ? selection.start - 1 : selection?.start
  const end = selection?.end && hasCurrencyPrefix ? selection.end - 1 : selection?.end

  // TODO(MOB-140): in USD mode, prevent user from typing in more than 2 decimals
  const handleInsert = (): void => {
    if (start === undefined || end === undefined) {
      // has no text selection, cursor is at the end of the text input
      setValue(value + label)
    } else {
      setValue(value.slice(0, start) + label + value.slice(end))
      resetSelection?.(start + 1 + prefixLength, start + 1 + prefixLength)
    }
  }

  const handleDelete = (): void => {
    if (start === undefined || end === undefined) {
      // has no text selection, cursor is at the end of the text input
      setValue(value.slice(0, -1))
    } else if (start < end) {
      // has text part selected
      setValue(value.slice(0, start) + value.slice(end))
      resetSelection?.(start + prefixLength, start + prefixLength)
    } else if (start > 0) {
      // part of the text is not selected, but cursor moved
      setValue(value.slice(0, start - 1) + value.slice(start))
      resetSelection?.(start - 1 + prefixLength, start - 1 + prefixLength)
    }
  }

  const onPress = (): void => {
    if (isDisabled) {
      return
    }

    if (action === KeyAction.Insert) {
      handleInsert()
    } else {
      handleDelete()
    }
  }

  const onLongPress = (): void => {
    if (action !== KeyAction.Delete) {
      return
    }

    setValue('')
    resetSelection?.(0, 0)
  }

  return (
    <TouchableArea
      hapticFeedback
      activeOpacity={1}
      alignItems={align}
      disabled={isDisabled}
      hapticStyle={ImpactFeedbackStyle.Light}
      justifyContent="center"
      p="$spacing16"
      pt={paddingTop}
      scaleTo={1.125}
      testID={'decimal-pad-' + label}
      width={index % 3 === 1 ? '50%' : '25%'}
      onLongPress={onLongPress}
      onPress={onPress}>
      {label === 'backspace' ? (
        I18nManager.isRTL ? (
          <Icons.RightArrow color={isDisabled ? '$neutral3' : '$neutral1'} size={32} />
        ) : (
          <Icons.LeftArrow color={isDisabled ? '$neutral3' : '$neutral1'} size={32} />
        )
      ) : (
        <Text color={isDisabled ? '$neutral3' : '$neutral1'} textAlign="center" variant="heading2">
          {
            label === '.' ? decimalSeparator : label
            /* respect phone settings to show decimal separator in the numpad,
             * but in the input we always have '.' as a decimal separator for now*/
          }
        </Text>
      )}
    </TouchableArea>
  )
}

/**
 * @deprecated Use DecimalPadInput instead.
 * Mostly similar but requires a few prop changes.
 */
export const DecimalPadLegacy = memo(_DecimalPad)
