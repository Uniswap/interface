import React from 'react'
import 'react-native-reanimated'
import { Flex, FlexProps, Text } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { CHAIN_INFO, ChainId } from 'wallet/src/constants/chains'

export type NetworkLogosProps = {
  chains: ChainId[]
  showFirstChainLabel?: boolean
  negativeGap?: boolean
  size?: number
} & FlexProps

export function NetworkLogos({
  negativeGap,
  chains,
  showFirstChainLabel,
  size = iconSizes.icon20,
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
          <Flex width={size} />
        </Flex>
      ) : (
        <Flex centered row gap={negativeGap ? -spacing.spacing8 : '$spacing4'}>
          {chains.map((chainId) => (
            <Flex
              backgroundColor="$surface2"
              borderRadius="$rounded8"
              p={negativeGap ? '$spacing2' : '$none'}>
              <NetworkLogo key={chainId} chainId={chainId} size={size} />
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  )
}
