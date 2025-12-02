import { OpenLimitOrdersButton } from 'components/AccountDrawer/MiniPortfolio/Limits/OpenLimitOrdersButton'
import { MenuStateVariant, useSetMenu } from 'components/AccountDrawer/menuState'
import { useMemo } from 'react'
import { Flex, Loader, ScrollView } from 'ui/src'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useInfiniteScroll } from 'utilities/src/react/useInfiniteScroll'

export default function ActivityTab({
  evmOwner,
  svmOwner,
}: {
  evmOwner: Address | undefined
  svmOwner: Address | undefined
}) {
  const setMenu = useSetMenu()

  const { maybeEmptyComponent, renderActivityItem, sectionData, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useActivityData({
      evmOwner,
      svmOwner,
      ownerAddresses: [evmOwner, svmOwner].filter(Boolean) as string[],
      fiatOnRampParams: undefined,
      skip: false,
    })

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasNextPage,
    isFetching: isFetchingNextPage,
  })

  const ActivityItems = useMemo(() => {
    /* `sectionData` will be either an array of transactions or an array of loading skeletons */
    return sectionData?.map((item: ActivityItem, index) => {
      return renderActivityItem({
        item,
        index,
      })
    })
  }, [sectionData, renderActivityItem])

  if (maybeEmptyComponent) {
    return maybeEmptyComponent
  }

  return (
    <Flex mx="$spacing8" gap="$none" testID={TestID.ActivityContent}>
      {evmOwner && (
        <OpenLimitOrdersButton
          openLimitsMenu={() => setMenu({ variant: MenuStateVariant.LIMITS })}
          account={evmOwner}
        />
      )}
      <ScrollView showsVerticalScrollIndicator={false} width="100%">
        {ActivityItems}
        {/* Show skeleton loading indicator while fetching next page */}
        {isFetchingNextPage && (
          <Flex px="$spacing8">
            <Loader.Transaction />
          </Flex>
        )}
        {/* Intersection observer sentinel for infinite scroll */}
        <Flex ref={sentinelRef} height={1} />
      </ScrollView>
    </Flex>
  )
}
