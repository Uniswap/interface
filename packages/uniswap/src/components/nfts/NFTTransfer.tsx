import { Flex, Text } from 'ui/src'
import { NFTViewer } from 'uniswap/src/components/nfts/NFTViewer'
import { type NFTItem } from 'uniswap/src/features/nfts/types'

export function NFTTransfer({ asset, nftSize }: { asset: NFTItem; nftSize?: number }): JSX.Element {
  return (
    <Flex centered gap="$spacing16">
      <Flex borderRadius="$rounded16" height={nftSize} overflow="hidden" width={nftSize}>
        <NFTViewer maxHeight={nftSize} uri={asset.imageUrl} />
      </Flex>
      <Flex centered row gap="$spacing8">
        <Text variant="buttonLabel1">{asset.name}</Text>
      </Flex>
    </Flex>
  )
}
