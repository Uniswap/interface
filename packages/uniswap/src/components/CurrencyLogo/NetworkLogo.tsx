import React from 'react'
import { Flex, FlexProps, Image, useSporeColors } from 'ui/src'
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
  borderRadius?: number
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
  size: sizeWithoutBorder = iconSizes.icon20,
  borderWidth = 0,
  borderRadius,
}: NetworkLogoProps): JSX.Element | null {
  const size = sizeWithoutBorder + 2 * borderWidth
  const shapeBorderRadius = shape === 'circle' ? size / 2 : size * SQUIRCLE_BORDER_RADIUS_RATIO
  const colors = useSporeColors()

  const imageStyle = {
    width: size,
    height: size,
    borderRadius: borderRadius ?? shapeBorderRadius,
    borderWidth,
    borderColor: colors.surface1.val,
  }

  if (chainId === null) {
    return (
      <Flex testID="all-networks-logo">
        <Image resizeMode="contain" source={ALL_NETWORKS_LOGO} style={imageStyle} />
      </Flex>
    )
  }

  const logo = UNIVERSE_CHAIN_INFO[chainId].logo
  const imageSize = size - borderWidth * 2 // this prevents the border from cutting off the logo

  return logo ? (
    <Flex testID="network-logo" overflow="hidden" style={imageStyle}>
      <Image resizeMode="contain" source={logo} width={imageSize} height={imageSize} />
    </Flex>
  ) : null
}

export const NetworkLogo = React.memo(_NetworkLogo)
