import { ImpactFeedbackStyle } from 'expo-haptics'
import ContextMenu from 'react-native-context-menu-view'
import { useNFTMenu } from 'src/features/nfts/hooks'
import { Flex, TouchableArea } from 'ui/src'
import { borderRadii } from 'ui/src/theme'
import noop from 'utilities/src/react/noop'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import {
  ESTIMATED_NFT_LIST_ITEM_SIZE,
  MAX_NFT_IMAGE_SIZE,
} from 'wallet/src/features/nfts/constants'
import { NFTItem } from 'wallet/src/features/nfts/types'

export function NftView({
  owner,
  item,
  onPress,
}: {
  owner: Address
  item: NFTItem
  onPress: () => void
}): JSX.Element {
  const { menuActions, onContextMenuPress } = useNFTMenu({
    contractAddress: item.contractAddress,
    tokenId: item.tokenId,
    owner,
    isSpam: item.isSpam,
  })

  return (
    <Flex fill justifyContent="flex-start" m="$spacing4">
      <ContextMenu
        actions={menuActions}
        disabled={menuActions.length === 0}
        style={{ borderRadius: borderRadii.rounded16 }}
        onPress={onContextMenuPress}>
        <TouchableArea
          hapticFeedback
          activeOpacity={1}
          hapticStyle={ImpactFeedbackStyle.Light}
          // Needed to fix long press issue with context menu on Android
          onLongPress={noop}
          onPress={onPress}>
          <Flex
            alignItems="center"
            aspectRatio={1}
            backgroundColor="$surface3"
            borderRadius="$rounded12"
            overflow="hidden"
            width="100%">
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
