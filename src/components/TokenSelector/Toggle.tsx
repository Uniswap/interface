import React, { PropsWithChildren } from 'react'
import { Button } from 'src/components/buttons/Button'
import { ElementName } from 'src/features/telemetry/constants'
import { Theme } from 'src/styles/theme'

interface ToggleProps {
  filled: boolean
  onToggle: () => void
  testID: string
  backgroundColor?: keyof Theme['colors']
  borderRadius?: keyof Theme['borderRadii']
}

export function Toggle({
  children,
  filled,
  onToggle,
  testID,
  backgroundColor,
  borderRadius,
}: PropsWithChildren<ToggleProps>) {
  return (
    <Button
      bg={backgroundColor ?? (filled ? 'accentActive' : 'backgroundAction')}
      borderRadius={borderRadius || 'lg'}
      name={ElementName.CurrencySelectorToggle}
      testID={testID}
      onPress={onToggle}>
      {children}
    </Button>
  )
}
