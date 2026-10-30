import { Anchor, Flex, Text, useMedia } from '@universe/mycelium'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from 'ui/src/components/tooltip/Tooltip'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { stopPropagation } from 'utilities/src/react/stopPropagation'
import { TokenCardCarousel } from '~/components/TokenCardCarousel/TokenCardCarousel'
import { useCarouselLayout } from '~/components/TokenCardCarousel/useCarouselLayout'
import { useHorizontalSnapCarousel } from '~/components/TokenCardCarousel/useHorizontalSnapCarousel'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import { useTopVerifiedAuctions } from '~/features/Toucan/hooks/useTopAuctions/useTopVerifiedAuctions'
import { AuctionChip } from '~/pages/Explore/tables/Auctions/AuctionChip'

export function TopVerifiedAuctionsSection() {
  const { t } = useTranslation()
  const media = useMedia()
  const { auctions: topVerifiedAuctions, isLoading, getAuctionTokenUsdPrice } = useTopVerifiedAuctions()
  const auctions = topVerifiedAuctions.filter((enrichedAuction) => enrichedAuction.auction)

  // Hide section if no verified auctions match criteria
  if (isLoading || auctions.length === 0) {
    return null
  }

  return (
    <Flex
      width="100%"
      maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
      mx="auto"
      flexDirection="column"
      gap="$spacing16"
      // Mobile: mirrors the tab row's bottom margin so the gaps above and below this section match.
      $md={{ pb: '$spacing20' }}
    >
      <Flex flexDirection="row" gap="$gap8" alignItems="center" mt="$spacing16" $md={{ mt: '$none' }}>
        <Text variant="subheading1" color="$neutral1" $md={{ variant: 'subheading2' }}>
          {t('toucan.topVerifiedAuctions.title')}
        </Text>
        <Tooltip placement="top">
          <Tooltip.Trigger>
            <Anchor
              href={UniswapHelpUrls.articles.toucanVerifiedAuctionsHelp}
              target="_blank"
              onPress={stopPropagation}
              display="flex"
              alignItems="center"
            >
              <InfoCircleFilled size="$icon.16" color="$neutral2" />
            </Anchor>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <Text variant="body4" color="$neutral1">
              {t('toucan.filter.verifiedLaunch.tooltip')}
            </Text>
          </Tooltip.Content>
        </Tooltip>
      </Flex>

      {media.md ? (
        <VerifiedAuctionsCarousel auctions={auctions} getAuctionTokenUsdPrice={getAuctionTokenUsdPrice} />
      ) : (
        <Flex
          width="100%"
          gap="$spacing12"
          $platform-web={{
            display: 'grid',
          }}
          gridTemplateColumns="repeat(4, 1fr)"
          $lg={{
            gridTemplateColumns: 'repeat(3, 1fr)',
          }}
        >
          {auctions.map((enrichedAuction) => (
            <AuctionChip
              key={enrichedAuction.auction?.auctionId}
              auction={enrichedAuction}
              auctionTokenUsdPrice={getAuctionTokenUsdPrice(enrichedAuction)}
            />
          ))}
        </Flex>
      )}
    </Flex>
  )
}

// Mounted only once auctions are loaded so the layout ref is attached when useCarouselLayout measures it.
function VerifiedAuctionsCarousel({
  auctions,
  getAuctionTokenUsdPrice,
}: {
  auctions: EnrichedAuction[]
  getAuctionTokenUsdPrice: (auction: EnrichedAuction) => number | undefined
}) {
  const layoutRef = useRef<HTMLDivElement>(null)
  const { cardWidth, fadeWidth, showArrowButtons } = useCarouselLayout(layoutRef)
  const carousel = useHorizontalSnapCarousel({ cardWidth, itemCount: auctions.length, isLoading: false })

  return (
    <Flex ref={layoutRef} width="100%">
      <TokenCardCarousel
        items={auctions}
        getItemKey={(enrichedAuction) => enrichedAuction.auction?.auctionId ?? ''}
        renderItem={(enrichedAuction) => (
          <Flex width={cardWidth}>
            <AuctionChip auction={enrichedAuction} auctionTokenUsdPrice={getAuctionTokenUsdPrice(enrichedAuction)} />
          </Flex>
        )}
        isLoading={false}
        skeletonCount={auctions.length}
        carousel={carousel}
        cardWidth={cardWidth}
        fadeWidth={fadeWidth}
        showArrowButtons={showArrowButtons}
      />
    </Flex>
  )
}
