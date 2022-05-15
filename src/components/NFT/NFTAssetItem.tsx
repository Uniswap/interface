import { SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { SharedElement } from 'react-navigation-shared-element'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { NFTAsset } from 'src/features/nfts/types'
import { theme, Theme } from 'src/styles/theme'

type Props = {
  nft?: NFTAsset.Asset
  size: number
  onPress?: (nft: NFTAsset.Asset) => void
  // TODO: remove name entirely?
  showName?: boolean
  id?: string
} & SpacingShorthandProps<Theme>

export function NFTAssetItem({ nft, size, showName, id, ...rest }: Props) {
  if (!nft) return null

  const { name, image_url: imageUrl } = nft

  return (
    <SharedElement id={id ?? ''}>
      <Flex flexDirection="column" gap="md" justifyContent="space-between" width={size} {...rest}>
        <RemoteImage
          borderRadius={theme.borderRadii.md}
          height={size}
          imageUrl={imageUrl}
          width={size}
        />
        {showName ? (
          <Text color="deprecated_gray600" fontWeight="500" numberOfLines={1} variant="caption">
            {name}
          </Text>
        ) : null}
      </Flex>
    </SharedElement>
  )
}
