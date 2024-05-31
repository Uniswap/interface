import React from 'react'
import { Image, ImageResizeMode, StyleSheet } from 'react-native'
import { Flex, FlexProps, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ChainId } from 'uniswap/src/types/chains'
import { CHAIN_INFO } from 'wallet/src/constants/chains'

type NetworkLogoProps = FlexProps & {
  chainId: ChainId
  size?: number
  shape?: 'circle' | 'square'
}

export const SQUARE_BORDER_RADIUS = 6

export function TransactionSummaryNetworkLogo({
  chainId,
  size = iconSizes.icon20,
}: Pick<NetworkLogoProps, 'chainId' | 'size'>): JSX.Element {
  return (
    <Flex borderColor="$surface1" style={styles.squareLogoOutline}>
      <NetworkLogo chainId={chainId} shape="square" size={size} />
    </Flex>
  )
}

const RESIZE_MODE_CONTAIN: ImageResizeMode = 'contain'

function _NetworkLogo({
  chainId,
  shape,
  size = iconSizes.icon20,
}: NetworkLogoProps): JSX.Element | null {
  const { logo } = CHAIN_INFO[chainId]
  const colors = useSporeColors()
  const borderRadius = shape === 'circle' ? size / 2 : SQUARE_BORDER_RADIUS
  return logo ? (
    <Flex
      style={{ borderColor: colors.surface1.get(), borderRadius, ...styles.iconWrapper }}
      testID="network-logo">
      <Image resizeMode={RESIZE_MODE_CONTAIN} source={logo} style={{ width: size, height: size }} />
    </Flex>
  ) : null
}

export const NetworkLogo = React.memo(_NetworkLogo)

const styles = StyleSheet.create({
  iconWrapper: {
    overflow: 'hidden',
  },
  squareLogoOutline: {
    borderRadius: 7, // when inner icon borderRadius = 6 and size = 20
    borderWidth: 2,
  },
})
