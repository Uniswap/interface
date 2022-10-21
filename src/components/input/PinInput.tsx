import React from 'react'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { Box, Flex } from 'src/components/layout'

interface PinInputProps {
  length: number
  setValue: (newPin: string) => void
  value: string
  disabled?: boolean
}

export default function PinInput({ length, setValue, value, disabled }: PinInputProps) {
  return (
    <Flex flex={1} justifyContent="space-between">
      <Flex centered flex={1}>
        <Flex row gap="lg">
          {[...Array(length)].map((_, i) => (
            <Box
              key={i}
              bg={i < value.length ? 'textPrimary' : 'background3'}
              borderColor="backgroundOutline"
              borderRadius="full"
              borderWidth={1}
              height={15}
              width={15}
            />
          ))}
        </Flex>
      </Flex>
      <DecimalPad hideDecimal disabled={disabled} setValue={setValue} value={value} />
    </Flex>
  )
}
