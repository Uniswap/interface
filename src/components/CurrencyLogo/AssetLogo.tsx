import React from 'react'
import { Image, ImageStyle } from 'react-native'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'

const tokenLogoStyle: ImageStyle = { width: 35, height: 35, borderRadius: 35 / 2 }

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
      backgroundColor="backgroundContainer"
      borderRadius="full"
      height={tokenLogoStyle.height}
      width={tokenLogoStyle.width}>
      <Text color="textTertiary" variant="subHead2">
        {name[0]}
      </Text>
    </Flex>
  )
}
