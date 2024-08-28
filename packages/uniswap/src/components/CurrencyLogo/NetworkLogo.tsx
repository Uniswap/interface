import React from 'react'
import { Flex, FlexProps, Image } from 'ui/src'
import { ALL_NETWORKS_LOGO } from 'ui/src/assets'
import { iconSizes } from 'ui/src/theme'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { UniverseChainId } from 'uniswap/src/types/chains'

export const SQUIRCLE_BORDER_RADIUS_RATIO = 0.3

type NetworkLogoProps = FlexProps & {
  chainId: UniverseChainId | null // null signifies this is the AllNetworks logo
  size?: number
  shape?: 'circle' | 'square'
  borderWidth?: number
}

export function TransactionSummaryNetworkLogo({
  chainId,
  size = iconSizes.icon20,
}: Pick<NetworkLogoProps, 'chainId' | 'size'>): JSX.Element {
  return <NetworkLogo borderWidth={1.5} chainId={chainId} shape="square" size={size} />
}

function _NetworkLogo({
  chainId,
  shape,
  size = iconSizes.icon20,
  borderWidth = 0,
}: NetworkLogoProps): JSX.Element | null {
  const borderRadius = shape === 'circle' ? size / 2 : (size + 2 * borderWidth) * SQUIRCLE_BORDER_RADIUS_RATIO

  if (chainId === null) {
    return (
      <Flex
        borderColor="$surface1"
        borderRadius={borderRadius}
        borderWidth={borderWidth}
        overflow="hidden"
        testID="all-networks-logo"
      >
        <Image resizeMode="contain" source={ALL_NETWORKS_LOGO} style={{ width: size, height: size }} />
      </Flex>
    )
  }
  const logo = UNIVERSE_CHAIN_INFO[chainId].logo
  return logo ? (
    <Flex
      borderColor="$surface1"
      borderRadius={borderRadius}
      borderWidth={borderWidth}
      overflow="hidden"
      testID="network-logo"
    >
      <Image resizeMode="contain" source={logo} style={{ width: size, height: size }} />
    </Flex>
  ) : null
}

export const NetworkLogo = React.memo(_NetworkLogo)
