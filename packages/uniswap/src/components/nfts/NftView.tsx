import { Flex, FlexProps, TouchableArea } from 'ui/src'
import { NFTViewer } from 'uniswap/src/components/nfts/images/NFTViewer'
import { ESTIMATED_NFT_LIST_ITEM_SIZE } from 'uniswap/src/features/nfts/constants'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { isAndroid, isWebPlatform } from 'utilities/src/platform'

export type NftViewProps = {
  item: NFTItem
  index?: number
  onPress: () => void
  walletAddresses: Address[]
  openContextMenu?: () => void
}

export function NftView({ item, onPress, index, openContextMenu }: NftViewProps): JSX.Element {
  const nftView = (
    <NFTViewer
      svgRenderingDisabled
      autoplay={!isWebPlatform}
      imageDimensions={item.imageDimensions}
      limitGIFSize={ESTIMATED_NFT_LIST_ITEM_SIZE}
      placeholderContent={item.name || item.collectionName}
      squareGridView={true}
      uri={item.imageUrl ?? ''}
      thumbnailUrl={item.thumbnailUrl ?? ''}
    />
  )

  const baseFlexProps: FlexProps = {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: '$surface3',
    borderRadius: '$rounded12',
    overflow: 'hidden',
    width: '100%',
    shadowColor: '$shadowColor',
    shadowRadius: '$spacing12',
    hoverStyle: { transform: 'scale(1.02)' },
  }

  if (isAndroid) {
    return (
      <Flex>
        <TouchableArea
          activeOpacity={1}
          testID={`nfts-list-item-${index ?? 0}`}
          // Needed to fix long press issue with context menu on Android
          onLongPress={openContextMenu}
          onPress={onPress}
        >
          <Flex {...baseFlexProps}>{nftView}</Flex>
        </TouchableArea>
      </Flex>
    )
  }

  return (
    <Flex {...baseFlexProps} cursor="pointer" onPress={onPress} onLongPress={openContextMenu}>
      {nftView}
    </Flex>
  )
}
