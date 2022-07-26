import React, { useMemo } from 'react'
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
}

export function DecimalPad({ setValue, value = '', hideDecimal = false }: DecimalPadProps) {
  const keys: KeyProps[] = useMemo(() => {
    return [
      { label: '1', action: 'insert', align: 'flex-start', paddingTop: 'sm' },
      { label: '2', action: 'insert', align: 'center', paddingTop: 'sm' },
      { label: '3', action: 'insert', align: 'flex-end', paddingTop: 'sm' },
      { label: '4', action: 'insert', align: 'flex-start' },
      { label: '5', action: 'insert', align: 'center' },
      { label: '6', action: 'insert', align: 'flex-end' },
      { label: '7', action: 'insert', align: 'flex-start' },
      { label: '8', action: 'insert', align: 'center' },
      { label: '9', action: 'insert', align: 'flex-end' },
      {
        label: '.',
        action: 'insert',
        disabled: (v: string) => v.includes('.'),
        hidden: hideDecimal,
        align: 'flex-start',
      },
      { label: '0', action: 'insert', align: 'center' },
      {
        label: '←',
        action: 'deleteLast',
        disabled: (v: string) => v.length === 0,
        align: 'flex-end',
      },
    ]
  }, [hideDecimal])
  return (
    <AnimatedBox flexDirection="row" flexWrap="wrap" px="md">
      {keys.map((key, i) =>
        key.hidden ? (
          <Box key={i} alignItems={key.align} height="25%" />
        ) : (
          <KeyButton {...key} key={i} setValue={setValue} value={value} />
        )
      )}
    </AnimatedBox>
  )
}

type KeyButtonProps = KeyProps & {
  setValue: (newValue: string) => void
  value: string
}

function KeyButton({
  action,
  disabled,
  label,
  setValue,
  value,
  align,
  paddingTop,
}: KeyButtonProps) {
  const isDisabled = disabled?.(value) ?? false
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
            setValue(value + label)
            break
          case 'deleteLast':
            setValue(value.slice(0, -1))
        }
      }}>
      {label}
    </TextButton>
  )
}
