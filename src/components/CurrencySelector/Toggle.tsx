import React, { PropsWithChildren } from 'react'
import { Button } from 'src/components/buttons/Button'
import { ElementName } from 'src/features/telemetry/constants'

interface ToggleProps {
  onToggle: () => void
  filled: boolean
}

export function Toggle({ children, filled, onToggle }: PropsWithChildren<ToggleProps>) {
  return (
    <Button
      bg={filled ? 'primary1' : 'tokenSelector'}
      borderRadius="full"
      name={ElementName.CurrencySelectorToggle}
      onPress={onToggle}>
      {children}
    </Button>
  )
}
