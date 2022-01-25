import { selectionAsync } from 'expo-haptics'
import React, { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { NetworkBox } from 'src/components/Network/NetworkBox'
import { NetworkPill } from 'src/components/Network/NetworkPill'
import { ChainId } from 'src/constants/chains'
import { useActiveChainIds } from 'src/features/chains/utils'
import { ElementName } from 'src/features/telemetry/constants'

export enum NetworkButtonType {
  PILL,
  BOX,
}

export type NetworkLabelProps = {
  chainId: ChainId
  showBorder?: boolean
}

interface NetworkButtonGroupProps {
  onPress: (chainId: ChainId) => void
  selected: ChainId | null
  type: NetworkButtonType
  // optional custom button to be renderer before the network buttons
  customButton?: ReactNode
}

export function NetworkButtonGroup({
  customButton,
  type,
  onPress,
  selected,
}: NetworkButtonGroupProps) {
  const activeChains = useActiveChainIds()

  return (
    <Box flexDirection="row" mt="md">
      <ScrollView
        horizontal
        contentInset={{ top: 0, left: 20, bottom: 0, right: 20 }}
        contentOffset={{ x: -20, y: 0 }}
        directionalLockEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}>
        {customButton}
        {activeChains.map((chainId) => {
          return (
            <Button
              key={chainId}
              mr="sm"
              name={`${ElementName.NetworkButtonGroupPrefix}-${chainId}`}
              onPress={() => {
                selectionAsync()
                onPress(chainId)
              }}>
              {type === NetworkButtonType.PILL ? (
                <NetworkPill chainId={chainId} showBorder={selected === chainId} />
              ) : (
                <NetworkBox chainId={chainId} showBorder={selected === chainId} />
              )}
            </Button>
          )
        })}
      </ScrollView>
    </Box>
  )
}
