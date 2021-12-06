import React from 'react'
import { Image } from 'react-native'
import { style } from 'src/components/CurrencyLogo/styles'
import { Box } from 'src/components/layout/Box'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { getNetworkColors } from 'src/utils/colors'

interface NetworkLogoProps {
  chainId: ChainId
  size?: number
}

export function NetworkLogo({ chainId, size = 10 }: NetworkLogoProps) {
  const { logoUrl } = CHAIN_INFO[chainId]
  const { foreground } = getNetworkColors(chainId)

  return (
    <Box borderWidth={2} style={{ borderColor: foreground }} borderRadius="full">
      <Image
        style={[
          style.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        source={{ uri: logoUrl }}
      />
    </Box>
  )
}
