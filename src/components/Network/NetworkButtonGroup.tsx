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
    <Box flexDirection="row" mt="md">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        directionalLockEnabled={true}
        contentInset={{ top: 0, left: 20, bottom: 0, right: 20 }}
        contentOffset={{ x: -20, y: 0 }}>
        {activeChains.map((chainId) => {
          return (
            <Button mr="sm" key={chainId} onPress={() => onPress(chainId)}>
              <NetworkLabel chainId={chainId} showBorder={selected === chainId} />
            </Button>
          )
        })}
      </ScrollView>
    </Box>
  )
}
