import { Flex } from 'ui/src'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { VolumeTimeFrameSelector } from '~/features/Explore/VolumeTimeFrameSelector'
import { ExploreCategoryChips } from '~/pages/Explore/categories/ExploreCategoryChips'
import {
  exploreCategoryToRankedRwaCategory,
  isRankedRwaExploreCategory,
} from '~/pages/Explore/categories/exploreRwaCategory'
import { ExploreRwaDisclaimer } from '~/pages/Explore/categories/ExploreRwaDisclaimer'
import { ExploreCategory, useExploreCategory } from '~/pages/Explore/categories/useExploreCategory'
import { useWheelHorizontalScroll } from '~/pages/Explore/categories/useWheelHorizontalScroll'
import { TableNetworkFilter } from '~/pages/Explore/NetworkFilter'
import { CommoditiesTable } from '~/pages/Explore/rwa/table/CommoditiesTable'
import { RwaCategoryTable } from '~/pages/Explore/rwa/table/RwaCategoryTable'
import { SearchBar } from '~/pages/Explore/SearchBar'
import { TopTokensTable } from '~/pages/Explore/tables/Tokens/TopTokensTable'
import { ExploreTab } from '~/types/explore'

function ExploreCategoryTable({ category }: { category: ReturnType<typeof useExploreCategory>[0] }): JSX.Element {
  if (category === ExploreCategory.Commodities) {
    return <CommoditiesTable />
  }
  if (isRankedRwaExploreCategory(category)) {
    return (
      <RwaCategoryTable
        key={category}
        category={exploreCategoryToRankedRwaCategory(category)}
        // Client-side column sorting is stocks-only for this sprint; ETFs use API order.
        enableSorting={category === ExploreCategory.Stocks}
      />
    )
  }
  return <TopTokensTable />
}

/** Uniform vertical gap between stacked category controls, disclaimer, and table on mWeb (SWAP-2869). */
const CATEGORY_SECTION_MWEB_GAP = '$spacing16'

/** Popular | Stocks | Commodities | ETFs chips and category tables on Explore Tokens tab. */
const CHIPS_EDGE_FADE_WIDTH_PX = 24
const CHIPS_EDGE_FADE_MASK = `linear-gradient(to right, black calc(100% - ${CHIPS_EDGE_FADE_WIDTH_PX}px), transparent)`

export function ExploreCategoryTablesSection(): JSX.Element {
  const [category, setCategory] = useExploreCategory()
  const { scrollerRef: chipsScrollerRef, showRightFade } = useWheelHorizontalScroll()

  return (
    <Flex width="100%" $md={{ gap: CATEGORY_SECTION_MWEB_GAP }}>
      <Flex
        row
        width="100%"
        maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
        mx="auto"
        mt="$spacing8"
        mb="$spacing4"
        alignItems="center"
        justifyContent="space-between"
        gap="$spacing12"
        $md={{ row: false, flexDirection: 'column', alignItems: 'flex-start', mt: 0, mb: 0 }}
      >
        {/* Chips can exceed small viewports — scroll them in place instead of widening the page.
            The right-edge fade is a mask (not a painted gradient) so it blends with any background. */}
        <Flex
          ref={chipsScrollerRef}
          maxWidth="100%"
          flexShrink={1}
          minWidth={0}
          className="scrollbar-hidden"
          $platform-web={{
            overflowX: 'auto',
            overscrollBehaviorX: 'none',
            ...(showRightFade ? { maskImage: CHIPS_EDGE_FADE_MASK, WebkitMaskImage: CHIPS_EDGE_FADE_MASK } : {}),
          }}
        >
          <ExploreCategoryChips value={category} onChange={setCategory} />
        </Flex>
        <Flex row gap="$spacing8" alignItems="center" $md={{ width: '100%' }}>
          {category === 'popular' && <VolumeTimeFrameSelector />}
          <TableNetworkFilter />
          <SearchBar tab={ExploreTab.Tokens} />
        </Flex>
      </Flex>
      {isRankedRwaExploreCategory(category) && (
        <Flex width="100%" maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT} mx="auto" mb="$spacing12" $md={{ mb: 0 }}>
          <ExploreRwaDisclaimer category={category} />
        </Flex>
      )}
      <ExploreCategoryTable category={category} />
    </Flex>
  )
}
