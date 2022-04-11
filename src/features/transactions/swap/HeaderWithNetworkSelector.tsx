import React from 'react'
import { BackX } from 'src/components/buttons/BackX'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'

interface HeaderWithNetworkSelectorProps {
  label: string
  chainId?: ChainId
  onPressBack: () => void
  onPressNetwork: () => void
}

export function HeaderWithNetworkSelector({ label, onPressBack }: HeaderWithNetworkSelectorProps) {
  return (
    <Box alignItems="center" flexDirection="row" justifyContent="space-between" px="lg">
      <Text color="textColor" variant="bodyBold">
        {label}
      </Text>
      {/* TODO: add network selector */}
      <Flex alignContent="center" alignItems="center" flexDirection="row" justifyContent="flex-end">
        <BackX size={16} onPressBack={onPressBack} />
      </Flex>
    </Box>
  )
}
