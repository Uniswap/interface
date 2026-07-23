import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useMedia } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useTopVerifiedAuctions } from '~/features/Toucan/hooks/useTopAuctions/useTopVerifiedAuctions'
import { useWheelHorizontalScroll } from '~/pages/Explore/categories/useWheelHorizontalScroll'
import { AuctionChip } from '~/pages/Explore/tables/Auctions/AuctionChip'

const EXPLORE_AUCTIONS_HREF = '/explore/auctions'
const SCROLL_CARD_WIDTH = 260
const EDGE_FADE_WIDTH_PX = 24
const EDGE_FADE_MASK = `linear-gradient(to right, black calc(100% - ${EDGE_FADE_WIDTH_PX}px), transparent)`

/**
 * Top verified auctions surfaced in the Positions empty state. Reuses the Explore AuctionChip.
 * Lays the chips out as a grid on desktop; on md and below they scroll horizontally in place.
 */
export function TopVerifiedAuctionsDiscoverySection(): JSX.Element | null {
  const { t } = useTranslation()
  const media = useMedia()
  const { auctions, isLoading, getAuctionTokenUsdPrice } = useTopVerifiedAuctions()
  const { scrollerRef, showRightFade } = useWheelHorizontalScroll()

  if (isLoading || auctions.length === 0) {
    return null
  }

  // On md and below the cards exceed the viewport — scroll them in place instead of cramming a grid.
  const isScroll = media.md

  return (
    <Flex gap="$spacing16" width="100%">
      <Text variant="subheading1" color="$neutral1">
        {t('toucan.topVerifiedAuctions.title')}
      </Text>

      <Flex
        ref={isScroll ? scrollerRef : undefined}
        width="100%"
        gap="$spacing12"
        className={isScroll ? 'scrollbar-hidden' : undefined}
        {...(isScroll
          ? {
              row: true,
              '$platform-web': {
                overflowX: 'auto',
                overscrollBehaviorX: 'none',
                ...(showRightFade ? { maskImage: EDGE_FADE_MASK, WebkitMaskImage: EDGE_FADE_MASK } : {}),
              },
            }
          : {
              '$platform-web': { display: 'grid', gridAutoRows: 'auto' },
              gridTemplateColumns: 'repeat(4, 1fr)',
            })}
      >
        {auctions.map((enrichedAuction) => {
          if (!enrichedAuction.auction) {
            return null
          }
          return (
            <Flex key={enrichedAuction.auction.auctionId} width={isScroll ? SCROLL_CARD_WIDTH : '100%'} flexShrink={0}>
              <AuctionChip auction={enrichedAuction} auctionTokenUsdPrice={getAuctionTokenUsdPrice(enrichedAuction)} />
            </Flex>
          )
        })}
      </Flex>

      <Trace logPress element={ElementName.PositionsEmptyStateExploreAuctions}>
        <Button
          tag="a"
          href={EXPLORE_AUCTIONS_HREF}
          variant="default"
          emphasis="tertiary"
          size="small"
          fill={false}
          borderRadius="$roundedFull"
          icon={<ArrowRight />}
          iconPosition="after"
          alignSelf="flex-start"
          $platform-web={{ textDecoration: 'none' }}
        >
          {t('toucan.topVerifiedAuctions.seeAll')}
        </Button>
      </Trace>
    </Flex>
  )
}
