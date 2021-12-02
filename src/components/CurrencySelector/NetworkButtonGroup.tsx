import React from 'react'
import { ScrollView } from 'react-native'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { useActiveChainIds } from 'src/features/chains/hooks'
import { getNetworkColors } from 'src/utils/colors'

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
          const info = CHAIN_INFO[chainId]
          const colors = getNetworkColors(chainId)
          return (
            <Button
              mx="xs"
              py="sm"
              px="md"
              backgroundColor="gray200"
              borderRadius="full"
              borderWidth={1}
              key={chainId}
              onPress={() => onPress(chainId)}
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                backgroundColor: colors?.background,
                borderColor: selected === chainId ? colors?.foreground : 'transparent',
              }}>
              <Text style={{ color: colors?.foreground ?? 'black' }}>{info.label}</Text>
            </Button>
          )
        })}
      </ScrollView>
    </Box>
  )
}
