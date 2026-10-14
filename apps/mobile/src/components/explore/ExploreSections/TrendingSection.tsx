import { RankingType } from '@universe/api'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex, Loader } from '@universe/mycelium'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import {
  EXPLORE_TOKEN_CONTAINER_PROPS,
  EXPLORE_TOKEN_ROW_HEIGHT,
  tokenItemDataKey,
} from 'src/components/explore/ExploreSections/exploreListItems'
import { ExploreSectionHeader } from 'src/components/explore/ExploreSections/ExploreSectionHeader'
import { useExploreTokenItems } from 'src/components/explore/ExploreSections/useExploreTokenItems'
import { TokenItem } from 'src/components/explore/TokenItem'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import { MobileEventName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { findTrendingCategory } from 'uniswap/src/features/tokenCategories/findTrendingCategory'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useEvent } from 'utilities/src/react/hooks'

const TRENDING_SECTION_ROW_COUNT = 3

/**
 * Trending section on mobile Explore: tappable header navigating to the trending category's
 * detail view, over a short token list. Owns its own token query, scoped to the trending
 * category and pinned to the default multichain volume ranking, so the rows don't follow the
 * Top tokens sort/network controls.
 */
export const TrendingSection = memo(function TrendingSection(): JSX.Element | null {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const { data: categories, isLoading: isCategoriesLoading } = useListCategoriesQuery()
  const trendingCategory = findTrendingCategory(categories)

  const { topTokenItems, isLoading: isTokensLoading } = useExploreTokenItems({
    selectedNetwork: null,
    orderBy: RankingType.Volume,
    categoryId: trendingCategory?.id,
    pageSize: TRENDING_SECTION_ROW_COUNT,
    skip: !tokenCategoriesEnabled || trendingCategory === undefined,
  })
  const items = topTokenItems.slice(0, TRENDING_SECTION_ROW_COUNT)

  const onPressHeader = useEvent(() => {
    if (trendingCategory) {
      sendAnalyticsEvent(MobileEventName.ExploreTrendingHeaderSelected, { category_id: trendingCategory.id })
      navigation.navigate(MobileScreens.CategoryDetails, { categoryId: trendingCategory.id })
    }
  })

  if (!tokenCategoriesEnabled) {
    return null
  }

  if (!trendingCategory && !isCategoriesLoading) {
    return null
  }

  // Reserve the section's space while either query resolves so it doesn't push the sections
  // below down post-paint (same treatment as CollectionsSection's skeleton).
  const showSkeleton = items.length === 0
  if (showSkeleton && !isTokensLoading && !isCategoriesLoading) {
    return null
  }

  return (
    <Flex>
      {/* Always pass onPress so the chevron doesn't pop in when categories resolve; the
          handler no-ops until trendingCategory is available. */}
      <ExploreSectionHeader title={t('explore.section.trending')} onPress={onPressHeader} />
      {showSkeleton
        ? Array.from({ length: TRENDING_SECTION_ROW_COUNT }, (_, index) => (
            <Flex key={index} height={EXPLORE_TOKEN_ROW_HEIGHT} justifyContent="center" px="$spacing20">
              <Loader.Token />
            </Flex>
          ))
        : items.map((item, index) => (
            <TokenItem
              key={tokenItemDataKey(item.tokenItemData)}
              hideNumberedList
              eventName={MobileEventName.ExploreTokenItemSelected}
              index={index}
              metadataDisplayType={item.tokenMetadataDisplayType}
              section={SectionName.ExploreTrendingTokensSection}
              tokenItemData={item.tokenItemData}
              containerProps={EXPLORE_TOKEN_CONTAINER_PROPS}
            />
          ))}
    </Flex>
  )
})
