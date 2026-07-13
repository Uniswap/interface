import { Flex, useSporeColors } from 'ui/src'
import type { ExploreStockShelfItem } from 'uniswap/src/data/rest/rwa/types'
import { AssetCard } from '~/pages/Explore/rwa/shelf/AssetCard'
import { ASSET_SHELF_CARD_GAP } from '~/pages/Explore/rwa/shelf/assetCardConstants'
import { AssetCardSkeletonRow } from '~/pages/Explore/rwa/shelf/AssetCardSkeleton'
import { CarouselEdgeFade } from '~/pages/Explore/rwa/shelf/CarouselEdgeFade'
import { CarouselScrollButtonOverlay } from '~/pages/Explore/rwa/shelf/CarouselScrollButtonOverlay'
import type { AssetCardClickHandler } from '~/pages/Explore/rwa/shelf/types'

export function AssetShelfCarousel({
  featured,
  isLoading,
  setScrollRef,
  isAtEnd,
  isAtStart,
  isScrollSettled,
  isHovered,
  showButton,
  hideButton,
  onNext,
  onPrev,
  cardWidth,
  fadeWidth,
  showArrowButtons,
  onAssetClick,
}: {
  featured: ExploreStockShelfItem[]
  isLoading: boolean
  setScrollRef: (node: HTMLDivElement | null) => void
  isAtEnd: boolean
  isAtStart: boolean
  isScrollSettled: boolean
  isHovered: boolean
  showButton: () => void
  hideButton: () => void
  onNext: () => void
  onPrev: () => void
  cardWidth: number
  fadeWidth: number
  showArrowButtons: boolean
  onAssetClick?: AssetCardClickHandler
}): JSX.Element {
  const colors = useSporeColors()

  return (
    <Flex
      position="relative"
      width="100%"
      pointerEvents="auto"
      onMouseEnter={isLoading ? undefined : showButton}
      onMouseLeave={isLoading ? undefined : hideButton}
    >
      {isLoading ? (
        <Flex row gap="$spacing12" flexWrap="nowrap" overflow="hidden" width="100%">
          <AssetCardSkeletonRow cardWidth={cardWidth} />
        </Flex>
      ) : (
        /* oxlint-disable-next-line eslint-plugin-react(forbid-elements) -- scroll container needs a real DOM node for the scroll ref plus web-only scroll-snap/scrollbar CSS that Flex doesn't expose */
        <div
          ref={setScrollRef}
          className="scrollbar-hidden"
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            gap: ASSET_SHELF_CARD_GAP,
            width: '100%',
            overflowX: 'scroll',
            overscrollBehaviorX: 'none',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
          }}
        >
          {featured.map((item) => (
            <AssetCard
              key={item.rwa.symbol}
              rwa={item.rwa}
              issuer={item.issuer}
              cardWidth={cardWidth}
              onAssetClick={onAssetClick}
            />
          ))}
        </div>
      )}
      {!isLoading && (
        <CarouselEdgeFade
          side="left"
          fadeWidth={fadeWidth}
          surfaceColor={colors.surface1.val}
          opacity={!isAtStart && (isAtEnd || !isScrollSettled) ? 1 : 0}
        />
      )}
      {(isLoading || !isAtEnd) && (
        <CarouselEdgeFade side="right" fadeWidth={fadeWidth} surfaceColor={colors.surface1.val} opacity={1} />
      )}
      {showArrowButtons &&
        !isLoading &&
        (['left', 'right'] as const).map((direction) => {
          const isScrollable = direction === 'left' ? !isAtStart : !isAtEnd
          if (!isScrollable) {
            return null
          }

          return (
            <CarouselScrollButtonOverlay
              key={direction}
              direction={direction}
              visible={isHovered}
              onPress={direction === 'left' ? onPrev : onNext}
            />
          )
        })}
    </Flex>
  )
}
