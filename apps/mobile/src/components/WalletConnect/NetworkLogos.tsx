import React from 'react'
import 'react-native-reanimated'
import { Flex, FlexProps, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'

export type NetworkLogosProps = { chains: ChainId[]; showFirstChainLabel?: boolean } & FlexProps

export function NetworkLogos({
  chains,
  showFirstChainLabel,
  ...rest
}: NetworkLogosProps): JSX.Element {
  const firstChain = chains[0]

  return (
    <Flex centered row {...rest}>
      {chains.length === 1 && firstChain && showFirstChainLabel ? (
        <Flex fill row justifyContent="space-between">
          <NetworkLogo chainId={firstChain} />
          <Text color="$neutral2" numberOfLines={1} variant="buttonLabel3">
            {CHAIN_INFO[firstChain].label}
          </Text>
          <Flex width={iconSizes.icon20} />
        </Flex>
      ) : (
        <Flex centered row gap="$spacing4">
          {chains.map((chainId) => (
            <NetworkLogo key={chainId} chainId={chainId} size={iconSizes.icon20} />
          ))}
        </Flex>
      )}
    </Flex>
  )
}
