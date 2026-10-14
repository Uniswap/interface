import { Flex, Loader, UniversalList } from '@universe/mycelium'
import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { activityItemsAreEqual, ON_END_REACHED_THRESHOLD } from 'uniswap/src/components/activity/activityListItems'
import { getActivityItemType } from 'uniswap/src/components/activity/utils'
import { DataApiOutageBanner } from 'uniswap/src/features/dataApi/outage/DataApiOutageBanner'
import { DataApiOutageModalContent } from 'uniswap/src/features/dataApi/outage/DataApiOutageModalContent'
import { useEvent } from 'utilities/src/react/hooks'
import { useActivityDataWallet } from 'wallet/src/features/activity/useActivityDataWallet'

export const ActivityTab = memo(function ActivityTabInner({
  address,
  skip,
  canShowOutageBanner = false,
}: {
  address: Address
  skip?: boolean
  canShowOutageBanner?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const [isOutageModalOpen, setIsOutageModalOpen] = useState(false)
  const {
    maybeEmptyComponent,
    renderActivityItem,
    sectionData,
    keyExtractor,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    error,
    dataUpdatedAt,
  } = useActivityDataWallet({
    evmOwner: address,
    skip,
  })

  const shouldShowOutageBanner = canShowOutageBanner && Boolean(error) && !isFetchNextPageError
  const handleOutageBannerPress = useEvent(() => setIsOutageModalOpen(true))
  const handleOutageModalClose = useEvent(() => setIsOutageModalOpen(false))

  const handleEndReached = useEvent((): void => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  })

  const listHeader = useMemo(
    () =>
      shouldShowOutageBanner ? (
        <Flex px="$spacing8">
          <DataApiOutageBanner title={t('dataApi.outage.banner.activity.title')} onPress={handleOutageBannerPress} />
        </Flex>
      ) : null,
    [shouldShowOutageBanner, t, handleOutageBannerPress],
  )

  const listFooter = useMemo(
    () =>
      isFetchingNextPage ? (
        <Flex px="$spacing8">
          <Loader.Transaction />
        </Flex>
      ) : null,
    [isFetchingNextPage],
  )

  return (
    <>
      <UniversalList
        // The sidepanel document is the scroller. Without this the DOM engine adds its own
        // `overflow: auto` wrapper, and the unbounded parent leaves it sized to the full content —
        // no virtualization, plus a second scrollbar gutter.
        useWindowScroll
        data={sectionData}
        getItemType={getActivityItemType}
        itemsAreEqual={activityItemsAreEqual}
        keyExtractor={keyExtractor}
        // Renders alongside the header, so an outage banner now survives an empty activity list —
        // previously the empty state replaced the whole tree, hiding the banner exactly when the
        // outage had left nothing to show.
        ListEmptyComponent={maybeEmptyComponent}
        ListFooterComponent={listFooter}
        ListHeaderComponent={listHeader}
        renderItem={renderActivityItem}
        showsVerticalScrollIndicator={false}
        style={{ className: 'w-full' }}
        onEndReached={handleEndReached}
        onEndReachedThreshold={ON_END_REACHED_THRESHOLD}
      />
      {/* Keep the modal mounted through activity recovery, including recovery to an empty state. */}
      <DataApiOutageModalContent
        isOpen={isOutageModalOpen}
        lastUpdatedAt={dataUpdatedAt}
        onClose={handleOutageModalClose}
      />
    </>
  )
})
