import { SharedEventName } from '@uniswap/analytics-events'
import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex } from 'ui/src'
import {
  EXPLORE_STOCK_SHELF_COUNT,
  useExploreStocks,
} from 'uniswap/src/data/apiClients/dataApiService/rwa/useExploreStocks'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useEvent } from 'utilities/src/react/hooks'
import { TokenCardCarousel } from '~/components/TokenCardCarousel/TokenCardCarousel'
import { useCarouselLayout } from '~/components/TokenCardCarousel/useCarouselLayout'
import { useHorizontalSnapCarousel } from '~/components/TokenCardCarousel/useHorizontalSnapCarousel'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { scrollToExploreTokenSection } from '~/pages/Explore/categories/useExploreCategory'
import { useAssetShelfChainId } from '~/pages/Explore/hooks/useAssetShelfChainId'
import { AssetShelfHeader, NewBadge } from '~/pages/Explore/rwa/shelf/AssetShelfHeader'
import { getShelfItemKey, ShelfTokenCard } from '~/pages/Explore/rwa/shelf/ShelfTokenCard'
import type { AssetCardClickHandler } from '~/pages/Explore/rwa/shelf/types'
import { ExploreTab } from '~/types/explore'

/** Featured asset shelf on Explore root (region-gated via `GatedFeature.ISSUER_SPECIFIC_RWA`). */
export function AssetShelf(): JSX.Element | null {
  const { t } = useTranslation()
  const chainId = useAssetShelfChainId()
  const chainIds = useMemo(() => (chainId ? [chainId] : []), [chainId])
  const { featured, isLoading } = useExploreStocks(chainIds)
  const navigate = useNavigate()
  const layoutRef = useRef<HTMLDivElement>(null)
  const { cardWidth, fadeWidth, showArrowButtons } = useCarouselLayout(layoutRef)

  const carousel = useHorizontalSnapCarousel({
    cardWidth,
    itemCount: featured.length,
    isLoading,
  })

  const onViewAll = useEvent((): void => {
    navigate(`/explore/${ExploreTab.Tokens}?category=stocks`)
    requestAnimationFrame(() => {
      scrollToExploreTokenSection()
    })
  })

  const onAssetClick = useEvent(({ tokenAddress, tokenSymbol }: Parameters<AssetCardClickHandler>[0]): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.ExploreRwaStocksCarousel,
      token_address: tokenAddress,
      token_symbol: tokenSymbol,
      token_list_length: featured.length,
    })
  })

  if (!isLoading && featured.length === 0) {
    return null
  }

  return (
    <Flex width="100%" maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT} mx="auto" gap="$spacing12">
      <AssetShelfHeader
        title={t('common.stocks')}
        badge={<NewBadge>{t('common.new')}</NewBadge>}
        onViewAll={onViewAll}
      />
      <Flex ref={layoutRef} width="100%">
        <TokenCardCarousel
          items={featured}
          getItemKey={getShelfItemKey}
          renderItem={(item) => (
            <ShelfTokenCard rwa={item.rwa} issuer={item.issuer} cardWidth={cardWidth} onAssetClick={onAssetClick} />
          )}
          isLoading={isLoading}
          skeletonCount={EXPLORE_STOCK_SHELF_COUNT}
          carousel={carousel}
          cardWidth={cardWidth}
          fadeWidth={fadeWidth}
          showArrowButtons={showArrowButtons}
        />
      </Flex>
    </Flex>
  )
}
