import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { Image } from 'react-native'
import { style } from 'src/components/CurrencyLogo/styles'
import { Box } from 'src/components/layout/Box'
import { iconSizes } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'
import { getNetworkColorKey } from 'src/utils/colors'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'

type NetworkLogoProps = {
  chainId: ChainId
  size?: number
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function TransactionSummaryNetworkLogo({
  chainId,
  size = iconSizes.icon20,
}: Pick<NetworkLogoProps, 'chainId' | 'size'>): JSX.Element {
  const { logo } = CHAIN_INFO[chainId]
  const backgroundColor = getNetworkColorKey(chainId)

  // We need to wrap the network logo because it's a circle, but we need a rectangle,
  // but we can use border and background color on the same view, as for some reason
  // background color is visible through the border on the outline
  // Similiar issue: https://stackoverflow.com/questions/43756623/react-native-border-radius-makes-outline
  return (
    <Box borderColor="background0" borderRadius="rounded8" borderWidth={2}>
      <Box backgroundColor={backgroundColor} borderColor="background0" style={style.innerWrapper}>
        {logo && (
          <Image
            source={logo}
            style={[
              style.image,
              {
                width: size,
                height: size,
              },
            ]}
          />
        )}
      </Box>
    </Box>
  )
}

export function NetworkLogo({
  chainId,
  size = iconSizes.icon20,
  ...rest
}: NetworkLogoProps): JSX.Element {
  const { logo } = CHAIN_INFO[chainId]

  return (
    <Box borderRadius="roundedFull" {...rest}>
      {logo && (
        <Image
          source={logo}
          style={[
            style.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      )}
    </Box>
  )
}
