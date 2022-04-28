import React from 'react'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Pill } from 'src/components/text/Pill'

interface WordPillProps {
  label?: string
  position?: number
  disabled?: boolean
  active?: boolean
}

export function WordPill({ label, position, active, disabled }: WordPillProps) {
  return (
    <Pill
      bg={active ? 'gray200' : 'none'}
      borderColor={active ? 'gray400' : 'gray200'}
      justifyContent="flex-start"
      opacity={disabled ? 0.5 : 1}
      px="sm">
      <Flex row gap="sm">
        {position ? (
          <Text color="gray600" variant="body">
            {position}
          </Text>
        ) : null}
        {label ? (
          <Text color="textColor" variant="body">
            {label}
          </Text>
        ) : null}
      </Flex>
    </Pill>
  )
}
