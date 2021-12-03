import React, { ComponentProps } from 'react'
import { Image } from 'react-native'
import { ETHEREUM_LOGO } from 'src/assets'
import { style } from 'src/components/CurrencyLogo/styles'
import { Box } from 'src/components/layout/Box'
import { ChainId, ChainIdTo } from 'src/constants/chains'

const LOGO_METADATA_BY_CHAIN: Partial<
  ChainIdTo<{
    logoSource: ComponentProps<typeof Image>['source'] | undefined
    // only used in testnets to help distinguish networks with same logo
    color: ComponentProps<typeof Box>['borderColor']
  }>
> = {
  [ChainId.MAINNET]: { logoSource: undefined, color: 'none' },
  [ChainId.RINKEBY]: {
    logoSource: ETHEREUM_LOGO,
    color: 'pink',
  },
  [ChainId.GOERLI]: {
    logoSource: ETHEREUM_LOGO,
    color: 'yellow',
  },
}

interface NetworkLogoProps {
  chainId: ChainId
  size?: number
}

export function NetworkLogo({ chainId, size = 10 }: NetworkLogoProps) {
  const { logoSource, color } = LOGO_METADATA_BY_CHAIN[chainId] || {}

  if (!logoSource) return null

  return (
    <Box borderWidth={2} borderColor={color} borderRadius="full">
      <Image
        style={[
          style.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        source={logoSource}
      />
    </Box>
  )
}
