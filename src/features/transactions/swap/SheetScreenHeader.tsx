import React from 'react'
import { BackX } from 'src/components/buttons/BackX'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'

interface SheetScreenHeaderProps {
  label: string
  chainId?: ChainId
  onPressBack: () => void
}

export function SheetScreenHeader({ label, onPressBack }: SheetScreenHeaderProps) {
  return (
    <Box alignItems="center" flexDirection="row" justifyContent="space-between" px="lg">
      <Text color="deprecated_textColor" variant="body1">
        {label}
      </Text>
      <Flex alignContent="center" alignItems="center" flexDirection="row" justifyContent="flex-end">
        <BackX size={16} onPressBack={onPressBack} />
      </Flex>
    </Box>
  )
}
