import { useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Flex } from 'ui/src'
import { useExploreStocks } from 'uniswap/src/data/rest/rwa/useExploreStocks'
import { useEvent } from 'utilities/src/react/hooks'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { scrollToExploreTokenSection } from '~/pages/Explore/categories/useExploreCategory'
import { AssetShelfCarousel } from '~/pages/Explore/rwa/shelf/AssetShelfCarousel'
import { AssetShelfHeader } from '~/pages/Explore/rwa/shelf/AssetShelfHeader'
import { useAssetShelfCarouselLayout } from '~/pages/Explore/rwa/shelf/useAssetShelfCarouselLayout'
import { useHorizontalSnapCarousel } from '~/pages/Explore/rwa/shelf/useHorizontalSnapCarousel'
import { ExploreTab } from '~/types/explore'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/** Featured asset shelf on Explore root (gated by `FeatureFlags.RWAUXExploreCarousel`). */
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
        />
      </Flex>
    </Flex>
  )
}
