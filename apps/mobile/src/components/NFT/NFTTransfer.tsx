import React from 'react'
import { Text } from 'src/components/Text'
import { GQLNftAsset } from 'src/features/nfts/hooks'
import { Flex } from 'ui/src'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'

export function NFTTransfer({
  asset,
  nftSize,
}: {
  asset: GQLNftAsset
  nftSize?: number
}): JSX.Element {
  return (
    <Flex centered>
      <Flex
        borderRadius="$rounded16"
        gap="$none"
        height={nftSize}
        overflow="hidden"
        width={nftSize}>
        <NFTViewer squareGridView maxHeight={nftSize} uri={asset?.image?.url} />
      </Flex>
      <Flex centered row gap="$spacing8">
        <Flex borderRadius="$roundedFull" gap="$none" height={28} overflow="hidden" width={28}>
          <NFTViewer uri={asset?.collection?.image?.url} />
        </Flex>
        <Text variant="buttonLabelLarge">{asset?.name}</Text>
      </Flex>
    </Flex>
  )
}
