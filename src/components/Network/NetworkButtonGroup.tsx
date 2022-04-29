import { selectionAsync } from 'expo-haptics'
import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
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
  type?: NetworkButtonType
}

export function NetworkButtonGroup({
  type = NetworkButtonType.PILL,
  onPress,
  selected,
}: NetworkButtonGroupProps) {
  const activeChains = useActiveChainIds()

  return (
    <Flex row>
      <ScrollView
        horizontal
        directionalLockEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        {activeChains.map((chainId) => {
          return (
            <Button
              key={chainId}
              mr="sm"
              name={`${ElementName.NetworkButton}-${chainId}`}
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
    </Flex>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    overflow: 'visible',
  },
})
