import React, { PropsWithChildren } from 'react'
import { Button } from 'src/components/buttons/Button'

interface ToggleProps {
  onToggle: () => void
  filled: boolean
}

export function Toggle({ children, filled, onToggle }: PropsWithChildren<ToggleProps>) {
  return (
    <Button
      bg={filled ? 'primary1' : 'tokenSelector'}
      borderRadius="full"
      p="sm"
      onPress={onToggle}>
      {children}
    </Button>
  )
}
