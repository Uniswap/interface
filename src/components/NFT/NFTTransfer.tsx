import React from 'react'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { NFTAsset } from 'src/features/nfts/types'

export function NFTTransfer({ asset, nftSize }: { asset: NFTAsset.Asset; nftSize?: number }) {
  return (
    <Flex centered>
      <Box borderRadius="lg" height={nftSize} overflow="hidden" width={nftSize}>
        <NFTViewer squareGridView maxHeight={nftSize} uri={asset.image_url} />
      </Box>
      <Flex centered row gap="xs">
        <Box borderRadius="full" height={28} overflow="hidden" width={28}>
          <NFTViewer uri={asset.collection.image_url} />
        </Box>
        <Text variant="buttonLabelLarge">{asset.name}</Text>
      </Flex>
    </Flex>
  )
}
