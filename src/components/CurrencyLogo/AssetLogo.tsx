import React from 'react'
import { Image, ImageStyle } from 'react-native'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'

const tokenLogoStyle: ImageStyle = { width: 36, height: 36, borderRadius: 36 / 2 }

interface AssetLogoProps {
  url?: string
  // will fallback to name if no url
  name: string
}

export function AssetLogoWithFallback({ name, url }: AssetLogoProps) {
  return url ? (
    <Image source={{ uri: url }} style={tokenLogoStyle} />
  ) : (
    <Flex
      centered
      backgroundColor="background2"
      borderRadius="full"
      height={tokenLogoStyle.height}
      width={tokenLogoStyle.width}>
      <Text color="textTertiary" variant="subheadSmall">
        {name[0]}
      </Text>
    </Flex>
  )
}
