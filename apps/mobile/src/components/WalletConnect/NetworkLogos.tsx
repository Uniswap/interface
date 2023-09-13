import React from 'react'
import 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { Text } from 'src/components/Text'
import { Flex, StackProps } from 'ui/src'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'

export type NetworkLogosProps = { chains: ChainId[]; showFirstChainLabel?: boolean } & StackProps

export function NetworkLogos({
  chains,
  showFirstChainLabel,
  ...rest
}: NetworkLogosProps): JSX.Element {
  const theme = useAppTheme()
  const firstChain = chains[0]

  return (
    <Flex alignItems="center" flexDirection="row" gap="$none" justifyContent="center" {...rest}>
      {chains.length === 1 && firstChain && showFirstChainLabel ? (
        <Flex fill row justifyContent="space-between">
          <NetworkLogo chainId={firstChain} />
          <Text color="neutral2" numberOfLines={1} variant="buttonLabelSmall">
            {CHAIN_INFO[firstChain].label}
          </Text>
          <Flex gap="$none" width={theme.iconSizes.icon20} />
        </Flex>
      ) : (
        <Flex centered flexDirection="row" gap="$spacing4">
          {chains.map((chainId) => (
            <NetworkLogo key={chainId} chainId={chainId} size={theme.iconSizes.icon20} />
          ))}
        </Flex>
      )}
    </Flex>
  )
}
