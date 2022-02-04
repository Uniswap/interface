import React, { PropsWithChildren } from 'react'
import { Button } from 'src/components/buttons/Button'
import { ElementName } from 'src/features/telemetry/constants'

interface ToggleProps {
  filled: boolean
  onToggle: () => void
  testID: string
}

export function Toggle({ children, filled, onToggle, testID }: PropsWithChildren<ToggleProps>) {
  return (
    <Button
      bg={filled ? 'primary1' : 'tokenSelector'}
      borderRadius="full"
      name={ElementName.CurrencySelectorToggle}
      testID={testID}
      onPress={onToggle}>
      {children}
    </Button>
  )
}
