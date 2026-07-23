import { SharedEventName } from '@uniswap/analytics-events'
import { useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Flex } from 'ui/src'
import { useExploreStocks } from 'uniswap/src/data/rest/rwa/useExploreStocks'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useEvent } from 'utilities/src/react/hooks'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { scrollToExploreTokenSection } from '~/pages/Explore/categories/useExploreCategory'
import { AssetShelfCarousel } from '~/pages/Explore/rwa/shelf/AssetShelfCarousel'
import { AssetShelfHeader } from '~/pages/Explore/rwa/shelf/AssetShelfHeader'
import type { AssetCardClickHandler } from '~/pages/Explore/rwa/shelf/types'
import { useAssetShelfCarouselLayout } from '~/pages/Explore/rwa/shelf/useAssetShelfCarouselLayout'
import { useHorizontalSnapCarousel } from '~/pages/Explore/rwa/shelf/useHorizontalSnapCarousel'
import { ExploreTab } from '~/types/explore'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/** Featured asset shelf on Explore root (region-gated via `GatedFeature.ISSUER_SPECIFIC_RWA`). */
export function AssetShelf(): JSX.Element | null {
  const chainId = useChainIdFromUrlParam()
  const chainIds = useMemo(() => (chainId ? [chainId] : []), [chainId])
  const { featured, isLoading } = useExploreStocks(chainIds)
  const navigate = useNavigate()
  const layoutRef = useRef<HTMLDivElement>(null)
  const { cardWidth, fadeWidth, showArrowButtons } = useAssetShelfCarouselLayout(layoutRef)

  const { setScrollRef, isAtEnd, isAtStart, isScrollSettled, isHovered, showButton, hideButton, onNext, onPrev } =
    useHorizontalSnapCarousel({
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
      <AssetShelfHeader onViewAll={onViewAll} />
      <Flex ref={layoutRef} width="100%">
        <AssetShelfCarousel
          featured={featured}
          isLoading={isLoading}
          setScrollRef={setScrollRef}
          isAtEnd={isAtEnd}
          isAtStart={isAtStart}
          isScrollSettled={isScrollSettled}
          isHovered={isHovered}
          showButton={showButton}
          hideButton={hideButton}
          onNext={onNext}
          onPrev={onPrev}
          cardWidth={cardWidth}
          fadeWidth={fadeWidth}
          showArrowButtons={showArrowButtons}
          onAssetClick={onAssetClick}
        />
      </Flex>
    </Flex>
  )
}
