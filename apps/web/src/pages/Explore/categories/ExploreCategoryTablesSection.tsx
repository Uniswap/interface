import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { isGroupedRwaCategory } from 'uniswap/src/features/tokenCategories/groupedCategory'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { VolumeTimeFrameSelector } from '~/features/Explore/VolumeTimeFrameSelector'
import {
  deriveCategoryChipOptions,
  getStaticCategoryChipOptions,
  useFlexSlotCategoryId,
} from '~/pages/Explore/categories/exploreCategoryChipOptions'
import { ExploreCategoryChips } from '~/pages/Explore/categories/ExploreCategoryChips'
import { ExploreCategoryChipsSkeleton } from '~/pages/Explore/categories/ExploreCategoryChipsSkeleton'
import {
  resolveGroupedRwaCategory,
  resolveRwaDisclaimerCategory,
  showsRwaDisclaimer,
  showsVolumeTimeFrameSelector,
} from '~/pages/Explore/categories/exploreGroupedCategory'
import { ExploreRwaDisclaimer } from '~/pages/Explore/categories/ExploreRwaDisclaimer'
import { MoreCategoriesDropdown } from '~/pages/Explore/categories/MoreCategoriesDropdown'
import { ExploreCategory, useExploreCategory } from '~/pages/Explore/categories/useExploreCategory'
import { useExploreTokenCategories } from '~/pages/Explore/categories/useExploreTokenCategories'
import { rightEdgeFadeStyle, useWheelHorizontalScroll } from '~/pages/Explore/categories/useWheelHorizontalScroll'
import { TableNetworkFilter } from '~/pages/Explore/NetworkFilter'
import { CommoditiesTable } from '~/pages/Explore/rwa/table/CommoditiesTable'
import { RwaCategoryTable } from '~/pages/Explore/rwa/table/RwaCategoryTable'
import { SearchBar } from '~/pages/Explore/SearchBar'
import { TopTokensTable } from '~/pages/Explore/tables/Tokens/TopTokensTable'
import { ExploreTab } from '~/types/explore'

function ExploreCategoryTable({
  rwaCategory,
  categoryId,
  categoryUnverified,
}: {
  rwaCategory: RwaCategory
  /** Flat-category ListTokens filter; undefined renders the unfiltered (All) table. */
  categoryId?: string
  /** The category id came from the URL and ListCategories hasn't confirmed it yet. */
  categoryUnverified: boolean
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
      />
    )
  }
  return <TopTokensTable categoryId={categoryId} categoryUnverified={categoryUnverified} />
}

/** Uniform vertical gap between stacked category controls, disclaimer, and table on desktop. */
const CATEGORY_SECTION_GAP = '$spacing4'
/** Matches the chips <-> filters column gap on mWeb so the controls and table read as one block. */
const CATEGORY_SECTION_MWEB_GAP = '$spacing12'

/** Category filter chips and category tables on the Explore Tokens tab. */
export function ExploreCategoryTablesSection(): JSX.Element {
  const { t } = useTranslation()
  const { orderedCategories, validCategoryIds, dynamicChipsEnabled, categoriesPending, categoriesLoading } =
    useExploreTokenCategories()
  const [category, setCategory] = useExploreCategory({ validCategoryIds, trustUnverifiedIds: categoriesPending })
  const flexSlotCategoryId = useFlexSlotCategoryId({ categories: orderedCategories, selectedCategoryId: category })
  const options = useMemo(
    () =>
      dynamicChipsEnabled
        ? deriveCategoryChipOptions({
            categories: orderedCategories,
            selectedCategoryId: category,
            flexSlotCategoryId,
            t,
          })
        : getStaticCategoryChipOptions(t),
    [dynamicChipsEnabled, orderedCategories, category, flexSlotCategoryId, t],
  )
  const { scrollerRef: chipsScrollerRef, showRightFade } = useWheelHorizontalScroll()
  const rwaCategory = resolveGroupedRwaCategory({
    categoryId: category,
    categories: orderedCategories,
    categoriesPending,
  })
  const disclaimerCategory = resolveRwaDisclaimerCategory(category)
  const showRwaDisclaimer = showsRwaDisclaimer(disclaimerCategory)
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const showVolumeTimeFrameSelector = showsVolumeTimeFrameSelector({ rwaCategory, tokenCategoriesEnabled })
  const flatCategoryId =
    rwaCategory === RwaCategory.UNSPECIFIED && category !== ExploreCategory.All ? category : undefined
  const categoryUnverified = flatCategoryId !== undefined && !validCategoryIds.has(flatCategoryId)

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
            ...rightEdgeFadeStyle(showRightFade),
          }}
        >
          {categoriesLoading ? (
            <ExploreCategoryChipsSkeleton />
          ) : (
            <Flex row alignItems="center" gap="$spacing4">
              <ExploreCategoryChips
                options={options}
                value={category}
                onChange={setCategory}
                fadeSwapLastOption={dynamicChipsEnabled}
              />
              {dynamicChipsEnabled && (
                <>
                  <Flex height="$spacing16" width={1} backgroundColor="$surface3" flexShrink={0} />
                  <MoreCategoriesDropdown
                    categories={orderedCategories}
                    selectedCategoryId={category}
                    onSelectCategory={setCategory}
                  />
                </>
              )}
            </Flex>
          )}
        </Flex>
        <Flex row gap="$spacing8" alignItems="center" $md={{ width: '100%' }}>
          {showVolumeTimeFrameSelector && <VolumeTimeFrameSelector />}
          <TableNetworkFilter />
          <SearchBar tab={ExploreTab.Tokens} />
        </Flex>
      </Flex>
      {showRwaDisclaimer ? (
        <Flex width="100%">
          <Flex width="100%" maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT} mx="auto" mb="$spacing4">
            <ExploreRwaDisclaimer category={disclaimerCategory} />
          </Flex>
          <ExploreCategoryTable
            rwaCategory={rwaCategory}
            categoryId={flatCategoryId}
            categoryUnverified={categoryUnverified}
          />
        </Flex>
      ) : (
        <ExploreCategoryTable
          rwaCategory={rwaCategory}
          categoryId={flatCategoryId}
          categoryUnverified={categoryUnverified}
        />
      )}
    </Flex>
  )
}
