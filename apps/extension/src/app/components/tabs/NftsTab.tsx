import { SharedEventName } from '@uniswap/analytics-events'
import { memo, useCallback } from 'react'
import { Flex } from 'ui/src'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { NftViewWithContextMenu } from 'wallet/src/components/nfts/NftViewWithContextMenu'
import { NftsList } from 'wallet/src/components/nfts/NftsList'
import { NFTItem } from 'wallet/src/features/nfts/types'

export const NftsTab = memo(function _NftsTab({ owner }: { owner: Address }): JSX.Element {
  const renderNFTItem = useCallback(
    (item: NFTItem) => {
      const onPress = (): void => {
        sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
          element: ElementName.NftItem,
          section: SectionName.HomeNFTsTab,
        })
      }

      return (
        <Flex fill m="$spacing4">
          <NftViewWithContextMenu item={item} owner={owner} onPress={onPress} />
        </Flex>
      )
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

const defaultEmptyStyle = {
  minHeight: 100,
  paddingVertical: '$spacing12',
  width: '100%',
}
