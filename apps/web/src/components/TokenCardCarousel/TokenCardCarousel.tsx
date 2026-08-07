import type { ReactNode } from 'react'
import { Flex, useSporeColors } from 'ui/src'
import { CarouselEdgeFade } from '~/components/TokenCardCarousel/CarouselEdgeFade'
import { CarouselScrollButtonOverlay } from '~/components/TokenCardCarousel/CarouselScrollButtonOverlay'
import { CAROUSEL_CARD_GAP } from '~/components/TokenCardCarousel/constants'
import { TokenCardSkeletonRow } from '~/components/TokenCardCarousel/TokenCardSkeleton'
import type { useHorizontalSnapCarousel } from '~/components/TokenCardCarousel/useHorizontalSnapCarousel'

export function TokenCardCarousel<T>({
  items,
  getItemKey,
  renderItem,
  isLoading,
  skeletonCount,
  carousel,
  cardWidth,
  fadeWidth,
  showArrowButtons,
  disableScrollSnap = false,
  forceLeftFade = false,
}: {
  items: T[]
  getItemKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  isLoading: boolean
  skeletonCount: number
  carousel: ReturnType<typeof useHorizontalSnapCarousel>
  cardWidth: number
  fadeWidth: number
  showArrowButtons: boolean
  /** Turns off CSS scroll snapping — for consumers that drive scrollLeft themselves (e.g. a marquee). */
  disableScrollSnap?: boolean
  /** Keeps the left edge fade on regardless of scroll state — for looping strips that always have content past the left edge. */
  forceLeftFade?: boolean
}): JSX.Element {
  const colors = useSporeColors()
  const { setScrollRef, isAtEnd, isAtStart, isScrollSettled, isHovered, showButton, hideButton, onNext, onPrev } =
    carousel

  return (
    <Flex
      position="relative"
      width="100%"
      pointerEvents="auto"
      onMouseEnter={isLoading ? undefined : showButton}
      onMouseLeave={isLoading ? undefined : hideButton}
    >
      {isLoading ? (
        <Flex row gap={CAROUSEL_CARD_GAP} flexWrap="nowrap" overflow="hidden" width="100%">
          <TokenCardSkeletonRow cardWidth={cardWidth} count={skeletonCount} />
        </Flex>
      ) : (
        /* oxlint-disable-next-line react/forbid-elements -- scroll container needs a real DOM node for the scroll ref plus web-only scroll-snap/scrollbar CSS that Flex doesn't expose */
        <div
          ref={setScrollRef}
          className="scrollbar-hidden"
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            gap: CAROUSEL_CARD_GAP,
            width: '100%',
            overflowX: 'scroll',
            overscrollBehaviorX: 'none',
            ...(disableScrollSnap ? {} : { scrollSnapType: 'x mandatory' as const }),
            scrollbarWidth: 'none',
          }}
        >
          {items.map((item) => (
            <Flex key={getItemKey(item)} flexShrink={0} $platform-web={{ scrollSnapAlign: 'start' }}>
              {renderItem(item)}
            </Flex>
          ))}
        </div>
      )}
      {!isLoading && (
        <CarouselEdgeFade
          side="left"
          fadeWidth={fadeWidth}
          surfaceColor={colors.surface1.val}
          opacity={forceLeftFade || (!isAtStart && (isAtEnd || !isScrollSettled)) ? 1 : 0}
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
