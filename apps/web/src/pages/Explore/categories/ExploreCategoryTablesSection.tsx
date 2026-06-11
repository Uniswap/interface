import { Flex } from 'ui/src'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { VolumeTimeFrameSelector } from '~/features/Explore/VolumeTimeFrameSelector'
import { ExploreCategoryChips } from '~/pages/Explore/categories/ExploreCategoryChips'
import {
  exploreCategoryToRankedRwaCategory,
  isRankedRwaExploreCategory,
} from '~/pages/Explore/categories/exploreRwaCategory'
import { useExploreCategory } from '~/pages/Explore/categories/useExploreCategory'
import { TableNetworkFilter } from '~/pages/Explore/NetworkFilter'
import { CommoditiesTable } from '~/pages/Explore/rwa/table/CommoditiesTable'
import { RwaCategoryTable } from '~/pages/Explore/rwa/table/RwaCategoryTable'
import { SearchBar } from '~/pages/Explore/SearchBar'
import { TopTokensTable } from '~/pages/Explore/tables/Tokens/TopTokensTable'
import { ExploreTab } from '~/types/explore'

function ExploreCategoryTable({ category }: { category: ReturnType<typeof useExploreCategory>[0] }): JSX.Element {
  if (category === 'commodities') {
    return <CommoditiesTable />
  }
  if (isRankedRwaExploreCategory(category)) {
    return (
      <RwaCategoryTable
        key={category}
        category={exploreCategoryToRankedRwaCategory(category)}
        // Client-side column sorting is stocks-only for this sprint; ETFs use API order.
        enableSorting={category === 'stocks'}
      />
    )
  }
  return <TopTokensTable />
}

/** Popular | Stocks | Commodities | ETFs chips and category tables on Explore Tokens tab. */
export function ExploreCategoryTablesSection(): JSX.Element {
  const [category, setCategory] = useExploreCategory()

  return (
    <Flex width="100%">
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
        $md={{ row: false, flexDirection: 'column', alignItems: 'flex-start' }}
      >
        <ExploreCategoryChips value={category} onChange={setCategory} />
        <Flex row gap="$spacing8" alignItems="center" $md={{ width: '100%' }}>
          {category === 'popular' && <VolumeTimeFrameSelector />}
          <TableNetworkFilter />
          <SearchBar tab={ExploreTab.Tokens} />
        </Flex>
      </Flex>
      <ExploreCategoryTable category={category} />
    </Flex>
  )
}
