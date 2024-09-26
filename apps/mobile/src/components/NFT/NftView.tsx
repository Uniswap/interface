import ContextMenu from 'react-native-context-menu-view'
import { Flex, ImpactFeedbackStyle, TouchableArea } from 'ui/src'
import { borderRadii } from 'ui/src/theme'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import noop from 'utilities/src/react/noop'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import { ESTIMATED_NFT_LIST_ITEM_SIZE, MAX_NFT_IMAGE_SIZE } from 'wallet/src/features/nfts/constants'
import { NFTItem } from 'wallet/src/features/nfts/types'
import { useNFTContextMenu } from 'wallet/src/features/nfts/useNftContextMenu'

export function NftView({
  owner,
  item,
  onPress,
  index,
}: {
  owner: Address
  item: NFTItem
  index?: number
  onPress: () => void
}): JSX.Element {
  const { menuActions, onContextMenuPress } = useNFTContextMenu({
    contractAddress: item.contractAddress,
    tokenId: item.tokenId,
    owner,
    isSpam: item.isSpam,
    showNotification: true,
    chainId: fromGraphQLChain(item.chain) ?? undefined,
  })

  return (
    <Flex fill justifyContent="flex-start" m="$spacing4">
      <ContextMenu
        actions={menuActions}
        disabled={menuActions.length === 0}
        style={{ borderRadius: borderRadii.rounded16 }}
        onPress={onContextMenuPress}
      >
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
              showSvgPreview
              contractAddress={item.contractAddress}
              imageDimensions={item.imageDimensions}
              limitGIFSize={ESTIMATED_NFT_LIST_ITEM_SIZE}
              maxHeight={MAX_NFT_IMAGE_SIZE}
              placeholderContent={item.name || item.collectionName}
              squareGridView={true}
              tokenId={item.tokenId}
              uri={item.imageUrl}
            />
          </Flex>
        </TouchableArea>
      </ContextMenu>
    </Flex>
  )
}
