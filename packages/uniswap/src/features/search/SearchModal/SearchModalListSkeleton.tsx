import { Flex, iconSizes, Text } from '@universe/mycelium'
import { Skeleton } from 'ui/src'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SECTION_HEADER_LAYOUT, SECTION_HEADER_TITLE_VARIANT } from 'uniswap/src/components/lists/SectionHeader'
import { SelectorBaseListSkeleton } from 'uniswap/src/components/lists/SelectorBaseList'
import { RecentSearchPillsSkeleton } from 'uniswap/src/features/search/SearchModal/RecentSearchPills/RecentSearchPillsSkeleton'
import { hasSectionGap, SectionGapSpacer } from 'uniswap/src/features/search/SearchModal/viewAll/withSectionGaps'

const SKELETON_ROW_COUNT = 12

export function SearchModalListSkeleton({ pillCount = 0 }: { pillCount?: number }): JSX.Element {
  return (
    <Flex grow overflow="hidden">
      {pillCount > 0 && (
        <>
          <SectionHeaderSkeleton />
          <RecentSearchPillsSkeleton count={pillCount} />
          {hasSectionGap(OnchainItemSectionName.RecentSearches) && <SectionGapSpacer />}
        </>
      )}
      <SectionHeaderSkeleton />
      <SelectorBaseListSkeleton repeat={SKELETON_ROW_COUNT} />
    </Flex>
  )
}

function SectionHeaderSkeleton(): JSX.Element {
  return (
    <Skeleton>
      <Flex row alignItems="center" {...SECTION_HEADER_LAYOUT}>
        <Flex
          backgroundColor="$neutral3"
          borderRadius="$roundedFull"
          height={iconSizes.icon16}
          width={iconSizes.icon16}
        />
        <Text
          loading="no-shimmer"
          loadingPlaceholderText="Trending tokens"
          numberOfLines={1}
          variant={SECTION_HEADER_TITLE_VARIANT}
        />
      </Flex>
    </Skeleton>
  )
}
