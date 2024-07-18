import { SharedEventName } from '@uniswap/analytics-events'
import { memo, useCallback } from 'react'
import { ContextMenu, Flex } from 'ui/src'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { NftsList } from 'wallet/src/components/nfts/NftsList'
import { selectNftsVisibility } from 'wallet/src/features/favorites/selectors'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import { ESTIMATED_NFT_LIST_ITEM_SIZE } from 'wallet/src/features/nfts/constants'
import { NFTItem } from 'wallet/src/features/nfts/types'
import { useNFTContextMenu } from 'wallet/src/features/nfts/useNftContextMenu'
import { getIsNftHidden } from 'wallet/src/features/nfts/utils'
import { useAppSelector } from 'wallet/src/state'

export const NftsTab = memo(function _NftsTab({ owner }: { owner: Address }): JSX.Element {
  const renderNFTItem = useCallback(
    (item: NFTItem) => {
      const onPress = (): void => {
        sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
          element: ElementName.NftItem,
          section: SectionName.HomeNFTsTab,
        })
      }

      return <NftView item={item} owner={owner} onPress={onPress} />
    },
    [owner],
  )

  return (
    <NftsList
      emptyStateStyle={defaultEmptyStyle}
      errorStateStyle={defaultEmptyStyle}
      owner={owner}
      renderNFTItem={renderNFTItem}
    />
  )
})

function NftView({ owner, item, onPress }: { owner: Address; item: NFTItem; onPress: () => void }): JSX.Element {
  const { menuActions } = useNFTContextMenu({
    contractAddress: item.contractAddress,
    tokenId: item.tokenId,
    owner,
    isSpam: item.isSpam,
    chainId: fromGraphQLChain(item.chain) ?? UniverseChainId.Mainnet,
  })

  const menuOptions = menuActions.map((action) => ({
    label: action.title,
    onPress: action.onPress,
    Icon: action.Icon,
    destructive: action.destructive,
  }))

  const nftVisibility = useAppSelector(selectNftsVisibility)
  const hidden = getIsNftHidden({
    contractAddress: item.contractAddress,
    tokenId: item.tokenId,
    isSpam: item.isSpam,
    nftVisibility,
  })

  const itemId = `${item.chain}-${item.contractAddress}-${item.tokenId}-${hidden}`

  return (
    <Flex grow shrink p="$spacing4">
      <ContextMenu itemId={itemId} menuOptions={menuOptions}>
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
            showSvgPreview
            contractAddress={item.contractAddress}
            imageDimensions={item.imageDimensions}
            limitGIFSize={ESTIMATED_NFT_LIST_ITEM_SIZE}
            placeholderContent={item.name || item.collectionName}
            squareGridView={true}
            tokenId={item.tokenId}
            uri={item.imageUrl ?? ''}
          />
        </Flex>
      </ContextMenu>
    </Flex>
  )
}

const defaultEmptyStyle = {
  minHeight: 100,
  paddingVertical: '$spacing12',
  width: '100%',
}
