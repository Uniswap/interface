import React from 'react'
import { Text } from 'src/components/Text'

interface RelativeChangeProps {
  change?: number
}

export function RelativeChange({ change }: RelativeChangeProps) {
  const direction: 'up' | 'down' | undefined = change ? (change > 0 ? 'up' : 'down') : undefined
  return (
    <Text
      color={direction === 'up' ? 'green' : direction === 'down' ? 'red' : 'gray600'}
      variant="bodySm">
      {direction === 'up' ? '↑ ' : direction === 'down' ? '↓ ' : ''}
      {change ? `${change.toFixed(1)}%` : '-'}
    </Text>
  )
}
