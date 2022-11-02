import React, { useMemo } from 'react'
import { TextInputProps } from 'react-native'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedBox, Box } from 'src/components/layout'
import { Text } from 'src/components/Text'

enum KeyAction {
  Insert = 'insert',
  Delete = 'delete',
}

type KeyProps = {
  action: KeyAction
  disabled?: (value: string) => boolean
  label: string
  hidden?: boolean
  paddingTop?: 'sm'
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

export function DecimalPad({
  setValue,
  value = '',
  hideDecimal = false,
  disabled = false,
  selection,
  resetSelection,
  hasCurrencyPrefix,
}: DecimalPadProps) {
  const cursorAtStart = hasCurrencyPrefix
    ? selection?.start === 1 && selection?.end === 1
    : selection?.start === 0 && selection?.end === 0
  const keys: KeyProps[] = useMemo(() => {
    return [
      {
        label: '1',
        action: KeyAction.Insert,
        align: 'flex-start',
        paddingTop: 'sm',
        disabled: () => disabled,
      },
      {
        label: '2',
        action: KeyAction.Insert,
        align: 'center',
        paddingTop: 'sm',
        disabled: () => disabled,
      },
      {
        label: '3',
        action: KeyAction.Insert,
        align: 'flex-end',
        paddingTop: 'sm',
        disabled: () => disabled,
      },
      { label: '4', action: KeyAction.Insert, align: 'flex-start', disabled: () => disabled },
      { label: '5', action: KeyAction.Insert, align: 'center', disabled: () => disabled },
      { label: '6', action: KeyAction.Insert, align: 'flex-end', disabled: () => disabled },
      { label: '7', action: KeyAction.Insert, align: 'flex-start', disabled: () => disabled },
      { label: '8', action: KeyAction.Insert, align: 'center', disabled: () => disabled },
      { label: '9', action: KeyAction.Insert, align: 'flex-end', disabled: () => disabled },
      {
        label: '.',
        action: KeyAction.Insert,
        disabled: (v: string) => v.includes('.') || disabled,
        hidden: hideDecimal,
        align: 'flex-start',
      },
      { label: '0', action: KeyAction.Insert, align: 'center', disabled: () => disabled },
      {
        label: '←',
        action: KeyAction.Delete,
        disabled: (v: string) => cursorAtStart || v.length === 0 || disabled,
        align: 'flex-end',
      },
    ]
  }, [disabled, hideDecimal, cursorAtStart])
  return (
    <AnimatedBox flexDirection="row" flexWrap="wrap" px="md">
      {keys.map((key, i) =>
        key.hidden ? (
          <Box key={i} alignItems={key.align} height="25%" width="33%" />
        ) : (
          <KeyButton
            {...key}
            key={i}
            hasCurrencyPrefix={hasCurrencyPrefix}
            resetSelection={resetSelection}
            selection={selection}
            setValue={setValue}
            value={value}
          />
        )
      )}
    </AnimatedBox>
  )
}

type KeyButtonProps = KeyProps & {
  setValue: (newValue: string) => void
  value: string
  selection?: TextInputProps['selection']
  resetSelection?: (start: number, end?: number) => void
  hasCurrencyPrefix?: boolean
}

function KeyButton({
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
}: KeyButtonProps) {
  const isDisabled = disabled?.(value) ?? false
  // when input is in terms of USD, there is an extra "$" in the TextInput value, but not in props.value
  // so account for the extra prefix in `selection`
  // i.e. when cursor is in: "$5.|13", selection will give start === 3, end === 3, but we
  // should only be deleting/inserting at position 2 of "5.13"
  const prefixLength = hasCurrencyPrefix ? 1 : 0
  const start = selection && hasCurrencyPrefix ? selection.start - 1 : selection?.start
  const end = selection?.end && hasCurrencyPrefix ? selection.end - 1 : selection?.end

  const handleInsert = () => {
    if (start === undefined || end === undefined) {
      // has no text selection, cursor is at the end of the text input
      setValue(value + label)
    } else {
      setValue(value.slice(0, start) + label + value.slice(end))
      resetSelection?.(start + 1 + prefixLength, start + 1 + prefixLength)
    }
  }

  const handleDelete = () => {
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

  const onPress = () => {
    if (isDisabled) return

    if (action === KeyAction.Insert) {
      handleInsert()
    } else {
      handleDelete()
    }
  }

  const onLongPress = () => {
    if (action !== KeyAction.Delete) return

    setValue('')
  }

  return (
    <TouchableArea
      alignItems={align}
      disabled={isDisabled}
      justifyContent="center"
      padding="md"
      paddingTop={paddingTop}
      testID={'decimal-pad-' + label}
      width="33%"
      onLongPress={onLongPress}
      onPress={onPress}>
      <Text
        color={isDisabled ? 'textSecondary' : 'textPrimary'}
        textAlign="center"
        variant="headlineMedium">
        {label}
      </Text>
    </TouchableArea>
  )
}
