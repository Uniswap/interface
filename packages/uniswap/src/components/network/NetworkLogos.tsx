import 'react-native-reanimated'
import { Flex, FlexProps, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NetworksInSeries } from 'uniswap/src/components/network/NetworkFilter'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { UniverseChainId } from 'uniswap/src/types/chains'

export type NetworkLogosProps = {
  chains: UniverseChainId[]
  showFirstChainLabel?: boolean
  negativeGap?: boolean
  size?: number
} & FlexProps

export function NetworkLogos({
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
          <NetworkLogo chainId={firstChain} size={size} />
          <Text color="$neutral2" numberOfLines={1} variant="buttonLabel3">
            {UNIVERSE_CHAIN_INFO[firstChain].label}
          </Text>
          <Flex width={size} />
        </Flex>
      ) : (
        <NetworksInSeries networkIconSize={size} networks={chains} />
      )}
    </Flex>
  )
}
