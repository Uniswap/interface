import { Button, Text } from '@universe/mycelium'
import type { ReactNode } from 'react'

export function InfoRowActionButton({
  children,
  icon,
  onPress,
}: {
  children: ReactNode
  icon: JSX.Element
  onPress: () => void | Promise<void>
}): JSX.Element {
  return (
    <Button
      fill={false}
      emphasis="text-only"
      focusScaling="equal:smaller-button"
      gap="$spacing6"
      p={0}
      size="xxsmall"
      onPress={onPress}
    >
      <Text color="$neutral1" variant="body3">
        {children}
      </Text>
      {icon}
    </Button>
  )
}
