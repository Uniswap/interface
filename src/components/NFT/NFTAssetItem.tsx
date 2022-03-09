import React from 'react'
import { Button } from 'src/components/buttons/Button'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { OpenseaNFTAsset } from 'src/features/nfts/types'
import { ElementName } from 'src/features/telemetry/constants'
import { borderRadii, dimensions } from 'src/styles/sizing'

interface Props {
  nft: OpenseaNFTAsset
  onPress: (nft: OpenseaNFTAsset) => void
}

const ITEM_WIDTH = dimensions.fullWidth / 4

export function NFTAssetItem({ nft, onPress }: Props) {
  const { name, image_url: imageUrl } = nft

  return (
    <Button name={ElementName.NFTAssetItem} onPress={() => onPress(nft)}>
      <Box
        alignItems="center"
        flexDirection="column"
        justifyContent="space-between"
        mx="sm"
        width={ITEM_WIDTH}>
        <RemoteImage
          borderRadius={borderRadii.md}
          height={ITEM_WIDTH}
          imageUrl={imageUrl}
          width={ITEM_WIDTH}
        />
        <Text fontWeight="500" mt="sm" numberOfLines={1} textAlign="center" variant="bodySm">
          {name}
        </Text>
      </Box>
    </Button>
  )
}
