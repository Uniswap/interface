import React from 'react'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { Box, Flex } from 'src/components/layout'

interface PinInputProps {
  length: number
  setValue: (newPin: string) => void
  value: string
}

export default function PinInput({ length, setValue, value }: PinInputProps) {
  return (
    <Flex flex={1} justifyContent="space-between">
      <Flex centered flex={1}>
        <Flex row gap="lg">
          {[...Array(length)].map((_, i) => (
            <Box
              key={i}
              bg={i < value.length ? 'deprecated_textColor' : 'none'}
              borderColor="deprecated_gray600"
              borderRadius="full"
              borderWidth={1}
              height={15}
              width={15}
            />
          ))}
        </Flex>
      </Flex>
      <DecimalPad setValue={setValue} value={value} />
    </Flex>
  )
}
