import { SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { Button } from 'src/components/buttons/Button'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { NFTAsset } from 'src/features/nfts/types'
import { ElementName } from 'src/features/telemetry/constants'
import { theme, Theme } from 'src/styles/theme'

type Props = {
  nft?: NFTAsset.Asset
  size: number
  onPress?: (nft: NFTAsset.Asset) => void
} & SpacingShorthandProps<Theme>

export function NFTAssetItem({ nft, size, onPress, ...rest }: Props) {
  if (!nft) return null

  const { name, image_url: imageUrl } = nft

  return (
    <Button name={ElementName.NFTAssetItem} onPress={() => onPress?.(nft)}>
      <Flex flexDirection="column" gap="md" justifyContent="space-between" width={size} {...rest}>
        <RemoteImage
          borderRadius={theme.borderRadii.md}
          height={size}
          imageUrl={imageUrl}
          width={size}
        />
        <Text color="gray600" fontWeight="500" numberOfLines={1} variant="bodySm">
          {name}
        </Text>
      </Flex>
    </Button>
  )
}
