import { Flex } from 'ui/src'
import { NftViewProps } from 'wallet/src/components/nfts/NftViewProps'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import { ESTIMATED_NFT_LIST_ITEM_SIZE } from 'wallet/src/features/nfts/constants'

// WALL-4875 TODO try to combine web and mobile versions
export function NftView({ item, onPress }: NftViewProps): JSX.Element {
  return (
    <Flex
      alignItems="center"
      aspectRatio={1}
      backgroundColor="$surface3"
      borderRadius="$rounded12"
      overflow="hidden"
      width="100%"
      onPress={onPress}
    >
      <NFTViewer
        svgRenderingDisabled
        imageDimensions={item.imageDimensions}
        limitGIFSize={ESTIMATED_NFT_LIST_ITEM_SIZE}
        placeholderContent={item.name || item.collectionName}
        squareGridView={true}
        uri={item.imageUrl ?? ''}
        thumbnailUrl={item.thumbnailUrl ?? ''}
      />
    </Flex>
  )
}
