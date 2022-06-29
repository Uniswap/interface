import { SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Flex } from 'src/components/layout'
import { NFTAsset } from 'src/features/nfts/types'
import { theme, Theme } from 'src/styles/theme'

type Props = {
  nft?: NFTAsset.Asset
  size: number
  onPress?: (nft: NFTAsset.Asset) => void
} & SpacingShorthandProps<Theme>

export function NFTAssetItem({ nft, size, ...rest }: Props) {
  if (!nft) return null

  const { image_url: imageUrl } = nft

  return (
    <Flex flexDirection="column" gap="md" justifyContent="space-between" width={size} {...rest}>
      <RemoteImage
        borderRadius={theme.borderRadii.md}
        height={size}
        imageUrl={imageUrl}
        width={size}
      />
    </Flex>
  )
}
