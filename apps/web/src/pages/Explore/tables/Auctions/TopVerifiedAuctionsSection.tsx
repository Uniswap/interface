import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Tooltip } from 'ui/src/components/tooltip/Tooltip'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { buildTokenMarketPriceKey } from '~/features/Toucan/hooks/useTokenMarketPrices'
import { useAuctionTokenPrices } from '~/features/Toucan/hooks/useTopAuctions/useAuctionTokenPrices'
import { auctionCommittedVolumeComparator, useTopAuctions } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import { AuctionChip } from '~/pages/Explore/tables/Auctions/AuctionChip'

const MAX_CHIPS = 4

export function TopVerifiedAuctionsSection() {
  const { t } = useTranslation()
  const { auctions: allAuctions, isLoading } = useTopAuctions()
  const { priceMap: auctionTokenPriceMap } = useAuctionTokenPrices(allAuctions)

  const verifiedAuctions = useMemo(
    () => allAuctions.filter((enrichedAuction) => enrichedAuction.verified),
    [allAuctions],
  )

  const verifiedSortedOngoingAuctions = useMemo(() => {
    return verifiedAuctions
      .filter((enrichedAuction) => !enrichedAuction.timeRemaining.isCompleted)
      .sort(auctionCommittedVolumeComparator)
  }, [verifiedAuctions])

  const verifiedSortedCompletedAuctions = useMemo(() => {
    return verifiedAuctions
      .filter((enrichedAuction) => {
        const auction = enrichedAuction.auction
        return (
          enrichedAuction.timeRemaining.isCompleted &&
          !!auction &&
          !!auction.endBlock &&
          !!auction.chainId &&
          enrichedAuction.timeRemaining.endBlockTimestamp !== undefined
        )
      })
      .sort(auctionCommittedVolumeComparator)
  }, [verifiedAuctions])

  const topVerifiedAuctions = useMemo(() => {
    const remainingSlots = Math.max(0, MAX_CHIPS - verifiedSortedOngoingAuctions.length)
    return [...verifiedSortedOngoingAuctions, ...verifiedSortedCompletedAuctions.slice(0, remainingSlots)]
  }, [verifiedSortedOngoingAuctions, verifiedSortedCompletedAuctions])

  // Hide section if no verified auctions match criteria
  if (isLoading || topVerifiedAuctions.length === 0) {
    return null
  }

  return (
    <Flex width="100%" maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT} margin="0 auto" flexDirection="column" gap="$spacing16">
      <Flex flexDirection="row" gap="$gap8" alignItems="center" mt="$spacing16">
        <Text variant="subheading1" color="$neutral1">
          {t('toucan.topVerifiedAuctions.title')}
        </Text>
        <Tooltip placement="top" delay={0}>
          <Tooltip.Trigger>
            <Anchor
              href={UniswapHelpUrls.articles.toucanVerifiedAuctionsHelp}
              target="_blank"
              onPress={(e) => e.stopPropagation()}
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

      <Flex
        width="100%"
        gap="$spacing12"
        $platform-web={{
          display: 'grid',
          gridAutoRows: 'auto',
        }}
        gridTemplateColumns="repeat(4, 1fr)"
        $lg={{
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}
        $md={{
          gridTemplateColumns: 'repeat(2, 1fr)',
        }}
        $sm={{
          gridTemplateColumns: 'repeat(1, 1fr)',
        }}
      >
        {topVerifiedAuctions.map((enrichedAuction) => {
          if (!enrichedAuction.auction) {
            return null
          }
          return (
            <AuctionChip
              key={enrichedAuction.auction.auctionId}
              auction={enrichedAuction}
              auctionTokenUsdPrice={
                auctionTokenPriceMap[
                  buildTokenMarketPriceKey({
                    chainId: enrichedAuction.auction.chainId,
                    address: enrichedAuction.auction.tokenAddress,
                  })
                ]
              }
            />
          )
        })}
      </Flex>
    </Flex>
  )
}
