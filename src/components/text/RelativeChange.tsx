import React from 'react'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

interface RelativeChangeProps {
  change?: number
  variant?: keyof Theme['textVariants']
}

export function RelativeChange({ change, variant = 'caption' }: RelativeChangeProps) {
  const direction: 'up' | 'down' | undefined = change ? (change > 0 ? 'up' : 'down') : undefined
  return (
    <Text
      color={
        direction === 'up'
          ? 'deprecated_green'
          : direction === 'down'
          ? 'deprecated_red'
          : 'deprecated_gray600'
      }
      variant={variant}>
      {direction === 'up' ? '↑ ' : direction === 'down' ? '↓ ' : ''}
      {change ? `${change.toFixed(1)}%` : '-'}
    </Text>
  )
}
