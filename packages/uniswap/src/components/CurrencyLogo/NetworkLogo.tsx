import React from 'react'
import { Flex, FlexProps, Image, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { UniverseChainId } from 'uniswap/src/types/chains'

type NetworkLogoProps = FlexProps & {
  chainId: UniverseChainId
  size?: number
  shape?: 'circle' | 'square'
}

export const SQUARE_BORDER_RADIUS = 6

export function TransactionSummaryNetworkLogo({
  chainId,
  size = iconSizes.icon20,
}: Pick<NetworkLogoProps, 'chainId' | 'size'>): JSX.Element {
  return (
    <Flex
      borderColor="$surface1"
      borderRadius={7} // when inner icon borderRadius = 6 and size = 20
      borderWidth={2}
    >
      <NetworkLogo chainId={chainId} shape="square" size={size} />
    </Flex>
  )
}

function _NetworkLogo({ chainId, shape, size = iconSizes.icon20 }: NetworkLogoProps): JSX.Element | null {
  const logo = UNIVERSE_CHAIN_INFO[chainId].logo
  const colors = useSporeColors()
  const borderRadius = shape === 'circle' ? size / 2 : SQUARE_BORDER_RADIUS
  return logo ? (
    <Flex style={{ borderColor: colors.surface1.get(), borderRadius, overflow: 'hidden' }} testID="network-logo">
      <Image resizeMode="contain" source={logo} style={{ width: size, height: size }} />
    </Flex>
  ) : null
}

export const NetworkLogo = React.memo(_NetworkLogo)
