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
      bg={active ? 'deprecated_gray200' : 'none'}
      borderColor={active ? 'deprecated_gray400' : 'deprecated_gray200'}
      justifyContent="flex-start"
      opacity={disabled ? 0.5 : 1}
      px="sm">
      <Flex row gap="sm">
        {position ? (
          <Text color="deprecated_gray600" variant="body1">
            {position}
          </Text>
        ) : null}
        {label ? (
          <Text color="deprecated_textColor" variant="body1">
            {label}
          </Text>
        ) : null}
      </Flex>
    </Pill>
  )
}
