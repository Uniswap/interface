import React, { useMemo } from 'react'
import { TextButton } from 'src/components/buttons/TextButton'
import { AnimatedBox, Box } from 'src/components/layout'

type KeyProps = {
  action: string
  disabled?: (value: string) => boolean
  label: string
  hidden?: boolean
}

interface DecimalPadProps {
  hideDecimal?: boolean
  setValue: (newValue: string) => void
  value?: string
}

export function DecimalPad({ setValue, value = '', hideDecimal = false }: DecimalPadProps) {
  const keys: KeyProps[] = useMemo(() => {
    return [
      { label: '1', action: 'insert' },
      { label: '2', action: 'insert' },
      { label: '3', action: 'insert' },
      { label: '4', action: 'insert' },
      { label: '5', action: 'insert' },
      { label: '6', action: 'insert' },
      { label: '7', action: 'insert' },
      { label: '8', action: 'insert' },
      { label: '9', action: 'insert' },
      {
        label: '.',
        action: 'insert',
        disabled: (v: string) => v.includes('.'),
        hidden: hideDecimal,
      },
      { label: '0', action: 'insert' },
      { label: '←', action: 'deleteLast', disabled: (v: string) => v.length === 0 },
    ]
  }, [hideDecimal])
  return (
    <AnimatedBox flex={1} flexDirection="row" flexGrow={1} flexWrap="wrap">
      {keys.map((key, i) =>
        key.hidden ? (
          <Box key={i} height="25%" width="33%" />
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

function KeyButton({ action, disabled, label, setValue, value }: KeyButtonProps) {
  const isDisabled = disabled?.(value) ?? false
  return (
    <TextButton
      alignItems="center"
      disabled={isDisabled}
      height="25%"
      justifyContent="center"
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
