import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { isGroupedRwaCategory } from 'uniswap/src/features/tokenCategories/groupedCategory'
import type { TokenCategoryDefaultSort } from 'uniswap/src/features/tokenCategories/types'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { VolumeTimeFrameSelector } from '~/features/Explore/VolumeTimeFrameSelector'
import { CategoryChipRow } from '~/pages/Explore/categories/CategoryChipRow'
import {
  deriveCategoryChipOptions,
  getAllChipOption,
  getStaticCategoryChipOptions,
  useFlexSlotCategoryId,
} from '~/pages/Explore/categories/exploreCategoryChipOptions'
import {
  resolveGroupedRwaCategory,
  resolveRwaDisclaimerCategory,
  showsVolumeTimeFrameSelector,
} from '~/pages/Explore/categories/exploreGroupedCategory'
import { ExploreRwaDisclaimer } from '~/pages/Explore/categories/ExploreRwaDisclaimer'
import { ExploreCategory, useExploreCategory } from '~/pages/Explore/categories/useExploreCategory'
import { useExploreTokenCategories } from '~/pages/Explore/categories/useExploreTokenCategories'
import { useNetworkScopedCategoryStats } from '~/pages/Explore/categories/useNetworkScopedCategoryStats'
import { useResetEmptyCategoryOnNetworkSwitch } from '~/pages/Explore/categories/useResetEmptyCategoryOnNetworkSwitch'
import { TableNetworkFilter } from '~/pages/Explore/NetworkFilter'
import { CommoditiesTable } from '~/pages/Explore/rwa/table/CommoditiesTable'
import { RwaCategoryTable } from '~/pages/Explore/rwa/table/RwaCategoryTable'
import { SearchBar } from '~/pages/Explore/SearchBar'
import { TopTokensTable } from '~/pages/Explore/tables/Tokens/TopTokensTable'
import { ExploreTab } from '~/types/explore'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

function ExploreCategoryTable({
  rwaCategory,
  categoryId,
  holdEmptyResult,
  defaultSort,
}: {
  rwaCategory: RwaCategory
  /** Flat-category ListTokens filter; undefined renders the unfiltered (All) table. */
  categoryId?: string
  holdEmptyResult: boolean
  defaultSort?: TokenCategoryDefaultSort
}): JSX.Element {
  // Flag-off only: with token categories on, Commodities is `grouped: false` and renders the flat table below.
  if (rwaCategory === RwaCategory.COMMODITIES) {
    return <CommoditiesTable />
  }
  if (isGroupedRwaCategory(rwaCategory)) {
    return (
      <RwaCategoryTable
        key={rwaCategory}
        category={rwaCategory}
        // Client-side column sorting is stocks-only for this sprint; ETFs use API order.
        enableSorting={rwaCategory === RwaCategory.STOCKS}
        holdEmptyResult={holdEmptyResult}
      />
    )
  }
  return <TopTokensTable categoryId={categoryId} holdEmptyResult={holdEmptyResult} defaultSort={defaultSort} />
}

/** Uniform vertical gap between stacked category controls, disclaimer, and table on desktop. */
const CATEGORY_SECTION_GAP = '$spacing4'
/** Matches the chips <-> filters column gap on mWeb so the controls and table read as one block. */
const CATEGORY_SECTION_MWEB_GAP = '$spacing16'

/** Category filter chips and category tables on the Explore Tokens tab. */
export function ExploreCategoryTablesSection(): JSX.Element {
  const { t } = useTranslation()
  const {
    orderedCategories,
    validCategoryIds,
    dynamicChipsEnabled,
    exploreCategoriesEnabled,
    categoriesPending,
    categoriesLoading,
  } = useExploreTokenCategories()
  const [urlCategory, setCategory] = useExploreCategory({
    kind: 'token',
    validCategoryIds,
    trustUnverifiedIds: categoriesPending,
  })
  const { isCategoryEmpty, scopedStatsPending } = useNetworkScopedCategoryStats('token')
  const { category, awaitingNetworkStats } = useResetEmptyCategoryOnNetworkSwitch({
    category: urlCategory,
    setCategory,
    categories: orderedCategories,
    isCategoryEmpty,
    scopedStatsPending,
  })
  const flexSlotCategoryId = useFlexSlotCategoryId({
    kind: 'token',
    categories: orderedCategories,
    selectedCategoryId: category,
    isCategoryEmpty,
  })
  const options = useMemo(
    () =>
      dynamicChipsEnabled
        ? deriveCategoryChipOptions({
            kind: 'token',
            categories: orderedCategories,
            selectedCategoryId: category,
            flexSlotCategoryId,
            isCategoryEmpty,
            t,
          })
        : exploreCategoriesEnabled
          ? getStaticCategoryChipOptions(t)
          : [getAllChipOption(t)],
    [
      dynamicChipsEnabled,
      exploreCategoriesEnabled,
      orderedCategories,
      category,
      flexSlotCategoryId,
      isCategoryEmpty,
      t,
    ],
  )
  const chainId = useChainIdFromUrlParam()
  const rwaCategory = resolveGroupedRwaCategory({
    categoryId: category,
    categories: orderedCategories,
    categoriesPending,
  })
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const showVolumeTimeFrameSelector = showsVolumeTimeFrameSelector({ rwaCategory, tokenCategoriesEnabled })
  const flatCategoryId =
    rwaCategory === RwaCategory.UNSPECIFIED && category !== ExploreCategory.All ? category : undefined
  // An unverified deep link may be a bogus slug, and a network pick may be about to reset to All.
  const holdEmptyResult =
    (flatCategoryId !== undefined && !validCategoryIds.has(flatCategoryId)) || awaitingNetworkStats
  const defaultSort = orderedCategories.find(({ id }) => id === flatCategoryId)?.defaultSort

  return (
    <Flex width="100%" gap={CATEGORY_SECTION_GAP} $md={{ gap: CATEGORY_SECTION_MWEB_GAP }}>
      <Flex
        row
        width="100%"
        maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
        mx="auto"
        mt="$spacing8"
        alignItems="center"
        justifyContent="space-between"
        gap="$spacing12"
        $md={{ row: false, flexDirection: 'column', alignItems: 'flex-start', mt: 0, mb: 0 }}
      >
        <CategoryChipRow
          // Remount per network so the flex slot doesn't fade out the previous network's chip.
          key={chainId ?? 'all-networks'}
          kind="token"
          options={options}
          value={category}
          onChange={setCategory}
          // An uncached network's stats decide which chips show, so wait for them rather than swapping the row.
          loading={categoriesLoading || scopedStatsPending}
          moreCategories={dynamicChipsEnabled ? orderedCategories : undefined}
        />
        <Flex row gap="$spacing8" alignItems="center" $md={{ width: '100%' }}>
          {showVolumeTimeFrameSelector && <VolumeTimeFrameSelector />}
          <TableNetworkFilter />
          <SearchBar tab={ExploreTab.Tokens} />
        </Flex>
      </Flex>
      {/* Wrapped so the section gap doesn't apply between the disclaimer and its table. */}
      <Flex width="100%">
        {/* With token categories on, the disclaimer moves to the category details header. */}
        {!tokenCategoriesEnabled && <ExploreRwaDisclaimer category={resolveRwaDisclaimerCategory(category)} />}
        <ExploreCategoryTable
          rwaCategory={rwaCategory}
          categoryId={flatCategoryId}
          holdEmptyResult={holdEmptyResult}
          defaultSort={defaultSort}
        />
      </Flex>
    </Flex>
  )
}
