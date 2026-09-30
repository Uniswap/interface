import { SharedEventName } from '@uniswap/analytics-events'
import { Flex, TouchableArea, useIsTouchDevice } from '@universe/mycelium'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import { TestID } from '@universe/test'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import type { RankedTokenCardItem } from 'uniswap/src/data/apiClients/dataApiService/utils/rankedTokenCardItem'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CategoryDefinitionTooltip } from 'uniswap/src/features/tokenCategories/CategoryDefinitionTooltip'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useEvent } from 'utilities/src/react/hooks'
import { CategoryDefinitionSheet } from '~/components/CategoryDefinitionCard/CategoryDefinitionSheet'
import { TokenCardCarousel } from '~/components/TokenCardCarousel/TokenCardCarousel'
import { useCarouselLayout } from '~/components/TokenCardCarousel/useCarouselLayout'
import { useHorizontalSnapCarousel } from '~/components/TokenCardCarousel/useHorizontalSnapCarousel'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { getExploreTrendingTableURL, scrollToExploreTokenSection } from '~/pages/Explore/categories/useExploreCategory'
import { getCategoryDetailsURL } from '~/pages/Explore/CategoryDetails/getCategoryDetailsURL'
import { AssetShelfHeader } from '~/pages/Explore/rwa/shelf/AssetShelfHeader'
import { TrendingShelfTokenCard } from '~/pages/Explore/trending/TrendingShelfTokenCard'
import {
  TRENDING_CAROUSEL_TOKEN_COUNT,
  useTrendingCarouselTokens,
} from '~/pages/Explore/trending/useTrendingCarouselTokens'

export function TrendingShelf(): JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tokens, isLoading, trendingCategory } = useTrendingCarouselTokens()
  const isTouchDevice = useIsTouchDevice()
  const [isDefinitionOpen, setIsDefinitionOpen] = useState(false)
  const layoutRef = useRef<HTMLDivElement>(null)
  const { cardWidth, fadeWidth, showArrowButtons } = useCarouselLayout(layoutRef)

  const carousel = useHorizontalSnapCarousel({
    cardWidth,
    itemCount: tokens.length,
    isLoading,
  })

  const onViewAll = useEvent((): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.ExploreTrendingViewAll,
      token_list_length: tokens.length,
    })
    navigate(getExploreTrendingTableURL())
    requestAnimationFrame(() => {
      scrollToExploreTokenSection()
    })
  })

  const logTrendingInfoPress = useEvent((category: TokenCategory): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.ExploreTrendingInfo,
      section: SectionName.ExploreTrendingTokensSection,
      category_id: category.id,
    })
  })

  const onPressCategoryDetails = useEvent((): void => {
    if (!trendingCategory) {
      return
    }
    logTrendingInfoPress(trendingCategory)
    navigate(getCategoryDetailsURL(trendingCategory.id))
  })

  const openDefinition = useEvent((): void => {
    if (!trendingCategory) {
      return
    }
    logTrendingInfoPress(trendingCategory)
    setIsDefinitionOpen(true)
  })
  const closeDefinition = useEvent((): void => setIsDefinitionOpen(false))

  const onTokenClick = useEvent((token: RankedTokenCardItem): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.ExploreTrendingCarousel,
      token_address: token.address,
      token_symbol: token.symbol,
      token_list_length: tokens.length,
    })
  })

  if (!isLoading && tokens.length === 0) {
    return null
  }

  return (
    <Flex width="100%" maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT} mx="auto" gap="$spacing12">
      <AssetShelfHeader
        title={t('common.trending')}
        badge={
          trendingCategory &&
          (isTouchDevice ? (
            <TouchableArea testID={TestID.ExploreTrendingInfo} onPress={openDefinition}>
              <InfoCircleFilled color="$neutral3" size="$icon.16" />
            </TouchableArea>
          ) : (
            <CategoryDefinitionTooltip category={trendingCategory} onPressViewAll={onPressCategoryDetails} />
          ))
        }
        onViewAll={onViewAll}
      />
      <Flex ref={layoutRef} width="100%">
        <TokenCardCarousel
          items={tokens}
          getItemKey={(item) => item.key}
          renderItem={(item) => (
            <TrendingShelfTokenCard token={item} cardWidth={cardWidth} onTokenClick={onTokenClick} />
          )}
          isLoading={isLoading}
          skeletonCount={TRENDING_CAROUSEL_TOKEN_COUNT}
          skeletonLayout="horizontal"
          carousel={carousel}
          cardWidth={cardWidth}
          fadeWidth={fadeWidth}
          showArrowButtons={showArrowButtons}
        />
      </Flex>
      {trendingCategory && (
        <CategoryDefinitionSheet
          category={trendingCategory}
          isOpen={isDefinitionOpen}
          section={SectionName.ExploreTrendingTokensSection}
          onClose={closeDefinition}
        />
      )}
    </Flex>
  )
}
