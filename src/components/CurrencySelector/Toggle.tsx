import React, { PropsWithChildren } from 'react'
import { Button } from 'src/components/buttons/Button'

interface ToggleProps {
  onToggle: () => void
  filled: boolean
}

export function Toggle({ children, filled, onToggle }: PropsWithChildren<ToggleProps>) {
  return (
    <Button variant="pill" onPress={onToggle} bg={filled ? 'blue' : 'gray100'} borderRadius="lg">
      {children}
    </Button>
  )
}
