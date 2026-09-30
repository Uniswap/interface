import { Flex, type FlexProps } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { NFTViewer } from 'uniswap/src/components/nfts/NFTViewer'
import { NftViewLongPressArea } from 'uniswap/src/components/nfts/NftViewLongPressArea'
import { ESTIMATED_NFT_LIST_ITEM_SIZE } from 'uniswap/src/features/nfts/constants'
import { type NFTItem } from 'uniswap/src/features/nfts/types'

export type NftViewProps = {
  item: NFTItem
  index?: number
  onPress: () => void
  walletAddresses: Address[]
  openContextMenu?: () => void
  hoverAnimation?: boolean
}

export function NftView({ item, onPress, index, openContextMenu, hoverAnimation = true }: NftViewProps): JSX.Element {
  const nftView = (
    <NFTViewer
      svgRenderingDisabled
      // Disable autoplay in the grid — animated GIF/WebP NFTs hold per-cell frame
      // buffers and tank scroll perf on memory-constrained devices.
      autoplay={false}
      imageDimensions={item.imageDimensions}
      limitGIFSize={ESTIMATED_NFT_LIST_ITEM_SIZE}
      placeholderContent={item.name || item.collectionName}
      uri={item.imageUrl ?? ''}
      thumbnailUrl={item.thumbnailUrl ?? ''}
    />
  )

  const baseFlexProps: FlexProps = {
    alignItems: 'center',
    aspectRatio: 1,
    // Opaque fill so iOS can merge shadow paths
    // Visual tint still reads as a card; $surface3 is translucent rgba and triggers the warning.
    backgroundColor: '$surface3Solid',
    borderRadius: '$rounded12',
    overflow: 'hidden',
    width: '100%',
    shadowColor: '$shadowColor',
    shadowRadius: '$spacing12',
    transition: 'transform 100ms ease-in-out',
    hoverStyle: hoverAnimation ? { transform: 'scale(1.02)' } : undefined,
  }

  return (
    <NftViewLongPressArea
      testID={`${TestID.NftsListItemPrefix}${index ?? 0}`}
      onLongPress={openContextMenu}
      onPress={onPress}
    >
      <Flex {...baseFlexProps} cursor="pointer">
        {nftView}
      </Flex>
    </NftViewLongPressArea>
  )
}
