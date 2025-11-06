import { memo } from 'react'
import { Flex, Loader, ScrollView } from 'ui/src'
import { useInfiniteScroll } from 'utilities/src/react/useInfiniteScroll'
import { useActivityDataWallet } from 'wallet/src/features/activity/useActivityDataWallet'

export const ActivityTab = memo(function _ActivityTab({
  address,
  skip,
}: {
  address: Address
  skip?: boolean
}): JSX.Element {
  const { maybeEmptyComponent, renderActivityItem, sectionData, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useActivityDataWallet({
      evmOwner: address,
      skip,
    })

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasNextPage,
    isFetching: isFetchingNextPage,
  })

  if (maybeEmptyComponent) {
    return maybeEmptyComponent
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} width="100%">
      {/* `sectionData` will be either an array of transactions or an array of loading skeletons */}
      {sectionData.map((item, index) => renderActivityItem({ item, index }))}
      {/* Show skeleton loading indicator while fetching next page */}
      {isFetchingNextPage && (
        <Flex px="$spacing8">
          <Loader.Transaction />
        </Flex>
      )}
      {/* Intersection observer sentinel for infinite scroll */}
      <Flex ref={sentinelRef} height={1} my={10} />
    </ScrollView>
  )
})
