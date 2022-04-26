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
      bg={active ? 'gray200' : 'gray100'}
      borderColor={active ? 'gray400' : 'gray200'}
      height={32}
      justifyContent="flex-start"
      label={
        <Flex fill row alignItems="flex-start" gap="sm">
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
      }
      opacity={disabled ? 0.5 : 1}
    />
  )
}
