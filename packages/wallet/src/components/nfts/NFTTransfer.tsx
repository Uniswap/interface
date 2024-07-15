import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import { GQLNftAsset } from 'wallet/src/features/nfts/hooks'

export function NFTTransfer({
  asset,
  nftSize,
}: {
  asset: GQLNftAsset
  nftSize?: number
}): JSX.Element {
  return (
    <Flex centered gap="$spacing16">
      <Flex borderRadius="$rounded16" height={nftSize} overflow="hidden" width={nftSize}>
        <NFTViewer squareGridView maxHeight={nftSize} uri={asset?.image?.url} />
      </Flex>
      <Flex centered row gap="$spacing8">
        <Flex
          borderRadius="$roundedFull"
          height={iconSizes.icon28}
          overflow="hidden"
          width={iconSizes.icon28}>
          <NFTViewer uri={asset?.collection?.image?.url} />
        </Flex>
        <Text variant="buttonLabel1">{asset?.name}</Text>
      </Flex>
    </Flex>
  )
}
