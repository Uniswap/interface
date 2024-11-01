import { Flex, ImpactFeedbackStyle, TouchableArea } from 'ui/src'
import noop from 'utilities/src/react/noop'
import { NftViewProps } from 'wallet/src/components/nfts/NftViewProps'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import { ESTIMATED_NFT_LIST_ITEM_SIZE, MAX_NFT_IMAGE_SIZE } from 'wallet/src/features/nfts/constants'

// WALL-4875 TODO try to combine web and mobile versions
export function NftView({ item, onPress, index }: NftViewProps): JSX.Element {
  return (
    <Flex>
      <TouchableArea
        hapticFeedback
        activeOpacity={1}
        hapticStyle={ImpactFeedbackStyle.Light}
        testID={`nfts-list-item-${index ?? 0}`}
        // Needed to fix long press issue with context menu on Android
        onLongPress={noop}
        onPress={onPress}
      >
        <Flex
          alignItems="center"
          aspectRatio={1}
          backgroundColor="$surface3"
          borderRadius="$rounded12"
          overflow="hidden"
          width="100%"
        >
          <NFTViewer
            autoplay
            svgRenderingDisabled
            imageDimensions={item.imageDimensions}
            limitGIFSize={ESTIMATED_NFT_LIST_ITEM_SIZE}
            maxHeight={MAX_NFT_IMAGE_SIZE}
            placeholderContent={item.name || item.collectionName}
            squareGridView={true}
            uri={item.imageUrl}
            thumbnailUrl={item.thumbnailUrl}
          />
        </Flex>
      </TouchableArea>
    </Flex>
  )
}
