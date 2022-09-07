import React, { useMemo } from 'react'
import { TextInputProps } from 'react-native'
import { TextButton } from 'src/components/buttons/TextButton'
import { AnimatedBox, Box } from 'src/components/layout'

type KeyProps = {
  action: string
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
}

export function DecimalPad({
  setValue,
  value = '',
  hideDecimal = false,
  disabled = false,
  selection,
  resetSelection,
}: DecimalPadProps) {
  const keys: KeyProps[] = useMemo(() => {
    return [
      {
        label: '1',
        action: 'insert',
        align: 'flex-start',
        paddingTop: 'sm',
        disabled: () => disabled,
      },
      { label: '2', action: 'insert', align: 'center', paddingTop: 'sm', disabled: () => disabled },
      {
        label: '3',
        action: 'insert',
        align: 'flex-end',
        paddingTop: 'sm',
        disabled: () => disabled,
      },
      { label: '4', action: 'insert', align: 'flex-start', disabled: () => disabled },
      { label: '5', action: 'insert', align: 'center', disabled: () => disabled },
      { label: '6', action: 'insert', align: 'flex-end', disabled: () => disabled },
      { label: '7', action: 'insert', align: 'flex-start', disabled: () => disabled },
      { label: '8', action: 'insert', align: 'center', disabled: () => disabled },
      { label: '9', action: 'insert', align: 'flex-end', disabled: () => disabled },
      {
        label: '.',
        action: 'insert',
        disabled: (v: string) => v.includes('.') || disabled,
        hidden: hideDecimal,
        align: 'flex-start',
      },
      { label: '0', action: 'insert', align: 'center', disabled: () => disabled },
      {
        label: '←',
        action: 'deleteLast',
        disabled: (v: string) => v.length === 0 || disabled,
        align: 'flex-end',
      },
    ]
  }, [disabled, hideDecimal])
  return (
    <AnimatedBox flexDirection="row" flexWrap="wrap" px="md">
      {keys.map((key, i) =>
        key.hidden ? (
          <Box key={i} alignItems={key.align} height="25%" width="33%" />
        ) : (
          <KeyButton
            {...key}
            key={i}
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
}: KeyButtonProps) {
  const isDisabled = disabled?.(value) ?? false
  const start = selection?.start
  const end = selection?.end

  const handleInsert = () => {
    if (start === undefined || end === undefined) {
      // has no text selection, cursor is at the end of the text input
      setValue(value + label)
    } else {
      setValue(value.slice(0, start) + label + value.slice(end))
      resetSelection && resetSelection(start + 1, start + 1)
    }
  }

  const handleDelete = () => {
    if (start === undefined || end === undefined) {
      // has no text selection, cursor is at the end of the text input
      setValue(value.slice(0, -1))
    } else if (start < end) {
      // has text part selected
      setValue(value.slice(0, start) + value.slice(end))
      resetSelection && resetSelection(start, start)
    } else if (start > 0) {
      // part of the text is not selected, but cursor moved
      setValue(value.slice(0, start - 1) + value.slice(start))
      resetSelection && resetSelection(start - 1, start - 1)
    }
  }

  return (
    <TextButton
      alignItems={align}
      disabled={isDisabled}
      justifyContent="center"
      padding="md"
      paddingTop={paddingTop}
      testID={'decimal-pad-' + label}
      textAlign="center"
      textColor={isDisabled ? 'textSecondary' : 'textPrimary'}
      textVariant="headlineMedium"
      width="33%"
      onPress={() => {
        switch (action) {
          case 'insert':
            handleInsert()
            break
          case 'deleteLast':
            handleDelete()
        }
      }}>
      {label}
    </TextButton>
  )
}
