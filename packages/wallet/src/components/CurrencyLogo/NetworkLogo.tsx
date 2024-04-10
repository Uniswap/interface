import React from 'react'
import { Image, ImageResizeMode, StyleSheet } from 'react-native'
import { Flex, FlexProps } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CHAIN_INFO, ChainId } from 'wallet/src/constants/chains'

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

function _NetworkLogo({
  chainId,
  shape,
  size = iconSizes.icon20,
}: NetworkLogoProps): JSX.Element | null {
  const { logo } = CHAIN_INFO[chainId]
  const borderRadius = shape === 'circle' ? size / 2 : SQUARE_BORDER_RADIUS
  return logo ? (
    <Flex style={{ borderRadius, ...styles.iconWrapper }}>
      <Image source={logo} style={{ ...style.image, width: size, height: size }} />
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

const RESIZE_MODE_CONTAIN: ImageResizeMode = 'contain'

export const style = StyleSheet.create({
  image: {
    resizeMode: RESIZE_MODE_CONTAIN,
  },
})

export const SHADOW_OFFSET = { width: 0, height: 2 }

export const THIN_BORDER = 0.5
