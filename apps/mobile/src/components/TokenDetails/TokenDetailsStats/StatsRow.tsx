import React, { memo } from 'react'
import { Flex, Text } from 'ui/src'

export const StatsRow = memo(function StatsRowInner({
  label,
  children,
  statsIcon,
  labelAfter,
}: {
  label: string
  children: JSX.Element
  statsIcon: JSX.Element
  labelAfter?: JSX.Element
}): JSX.Element {
  return (
    <Flex row justifyContent="space-between" pl="$spacing2">
      <Flex row alignItems="center" flex={1} gap="$spacing8" justifyContent="flex-start">
        <Flex>{statsIcon}</Flex>
        <Flex row flex={1} alignItems="center" gap="$spacing4">
          <Text color="$neutral1" variant="body2">
            {label}
          </Text>
          {labelAfter}
        </Flex>
      </Flex>
      <Flex>{children}</Flex>
    </Flex>
  )
})
