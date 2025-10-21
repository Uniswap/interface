import { SharedEventName } from '@uniswap/analytics-events'
import { useAccount } from 'hooks/useAccount'
import { useCallback } from 'react'
import { Flex } from 'ui/src'
import { NftsList } from 'uniswap/src/components/nfts/NftsList'
import { NftViewWithContextMenu } from 'uniswap/src/components/nfts/NftViewWithContextMenu'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

export default function NftsTabShared({ owner, skip }: { owner: Address; skip?: boolean }): JSX.Element {
  const account = useAccount()

  const renderNFTItem = useCallback(
    (item: NFTItem) => {
      const onPress = (): void => {
        sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
          element: ElementName.MiniPortfolioNftItem,
          collection_name: item.collectionName,
          collection_address: item.contractAddress,
          token_id: item.tokenId,
        })
      }

      return (
        <Flex fill m="$spacing4">
          <NftViewWithContextMenu
            walletAddresses={account.address ? [account.address] : []}
            item={item}
            owner={owner}
            onPress={onPress}
          />
        </Flex>
      )
    },
    [account.address, owner],
  )

  return (
    <Flex mx="$spacing12">
      <NftsList
        emptyStateStyle={defaultEmptyStyle}
        errorStateStyle={defaultEmptyStyle}
        owner={owner}
        renderNFTItem={renderNFTItem}
        skip={skip}
      />
    </Flex>
  )
}

const defaultEmptyStyle = {
  minHeight: 100,
  paddingVertical: '$spacing12',
  width: '100%',
}
