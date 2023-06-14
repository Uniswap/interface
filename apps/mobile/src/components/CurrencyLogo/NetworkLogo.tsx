import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { Image, StyleSheet } from 'react-native'
import { style } from 'src/components/CurrencyLogo/styles'
import { Box } from 'src/components/layout/Box'
import { iconSizes } from 'ui/theme/iconSizes'
import { Theme } from 'ui/theme/restyle/theme'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'

type NetworkLogoProps = {
  chainId: ChainId
  size?: number
  shape?: 'circle' | 'square'
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export const SQUARE_BORDER_RADIUS = 6

export function TransactionSummaryNetworkLogo({
  chainId,
  size = iconSizes.icon20,
}: Pick<NetworkLogoProps, 'chainId' | 'size'>): JSX.Element {
  return (
    <Box borderColor="background0" style={styles.squareLogoOutline}>
      <NetworkLogo chainId={chainId} shape="square" size={size} />
    </Box>
  )
}

function _NetworkLogo({
  chainId,
  shape = 'circle',
  size = iconSizes.icon20,
}: NetworkLogoProps): JSX.Element | null {
  const { logo } = CHAIN_INFO[chainId]
  const borderRadius = shape === 'circle' ? size / 2 : SQUARE_BORDER_RADIUS
  return logo ? (
    <Box style={[{ borderRadius }, styles.iconWrapper]}>
      <Image source={logo} style={[style.image, { width: size, height: size }]} />
    </Box>
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
