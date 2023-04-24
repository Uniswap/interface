import React from 'react'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { GQLNftAsset } from 'src/features/nfts/hooks'

export function NFTTransfer({
  asset,
  nftSize,
}: {
  asset: GQLNftAsset
  nftSize?: number
}): JSX.Element {
  return (
    <Flex centered>
      <Box borderRadius="rounded16" height={nftSize} overflow="hidden" width={nftSize}>
        <NFTViewer squareGridView maxHeight={nftSize} uri={asset?.image?.url} />
      </Box>
      <Flex centered row gap="spacing8">
        <Box borderRadius="roundedFull" height={28} overflow="hidden" width={28}>
          <NFTViewer uri={asset?.collection?.image?.url} />
        </Box>
        <Text variant="buttonLabelLarge">{asset?.name}</Text>
      </Flex>
    </Flex>
  )
}
