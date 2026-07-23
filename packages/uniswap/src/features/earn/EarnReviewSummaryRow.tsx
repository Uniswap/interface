import type React from 'react'
import { Flex, Text } from 'ui/src'

export function EarnReviewSummaryRow({
  label,
  value,
}: {
  label: React.ReactNode
  value: React.ReactNode
}): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      {typeof label === 'string' ? (
        <Text variant="body3" color="$neutral2">
          {label}
        </Text>
      ) : (
        label
      )}
      {value}
    </Flex>
  )
}
