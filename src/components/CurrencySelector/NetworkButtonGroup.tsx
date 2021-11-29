import React from 'react'
import { ScrollView } from 'react-native'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { ChainId } from 'src/constants/chains'

interface NetworkButtonGroupProps {
  selected: ChainId | null
  onPress: (chainId: ChainId) => void
}

// Ordered list of buttons
const CHAINS_TO_DISPLAY: [ChainId, string][] = [
  [ChainId.MAINNET, 'Ethereum'],
  [ChainId.RINKEBY, 'Rinkeby'],
  [ChainId.ARBITRUM_ONE, 'Arbitrum'],
  [ChainId.OPTIMISM, 'Optimism'],
]

export function NetworkButtonGroup({ onPress, selected }: NetworkButtonGroupProps) {
  return (
    <Box flexDirection="row">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {CHAINS_TO_DISPLAY.map(([chainId, label]) => (
          <Button
            variant="pill"
            bg={selected === chainId ? 'blue' : 'gray100'}
            label={label}
            onPress={() => onPress(chainId)}
          />
        ))}
      </ScrollView>
    </Box>
  )
}
