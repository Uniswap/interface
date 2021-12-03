import React from 'react'
import { ScrollView } from 'react-native'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { NetworkLabel } from 'src/components/Network/NetworkLabel'
import { ChainId } from 'src/constants/chains'
import { useActiveChainIds } from 'src/features/chains/hooks'

interface NetworkButtonGroupProps {
  selected: ChainId | null
  onPress: (chainId: ChainId) => void
}

export function NetworkButtonGroup({ onPress, selected }: NetworkButtonGroupProps) {
  const activeChains = useActiveChainIds()

  return (
    <Box flexDirection="row">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {activeChains.map((chainId) => {
          return (
            <Button mx="xs" key={chainId} onPress={() => onPress(chainId)}>
              <NetworkLabel chainId={chainId} showBorder={selected === chainId} />
            </Button>
          )
        })}
      </ScrollView>
    </Box>
  )
}
