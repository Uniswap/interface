import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Tooltip } from 'ui/src/components/tooltip/Tooltip'
import { zIndexes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { AuctionChip } from '~/components/Toucan/AuctionChip'
import { buildTokenMarketPriceKey } from '~/components/Toucan/hooks/useTokenMarketPrices'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { useAuctionTokenPrices } from '~/state/explore/topAuctions/useAuctionTokenPrices'
import { auctionCommittedVolumeComparator, useTopAuctions } from '~/state/explore/topAuctions/useTopAuctions'

const TWENTY_FOUR_HOURS_MS = 86400000
const MAX_CHIPS = 8
const FALLBACK_CHIPS = 4

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
    const currentTime = Date.now()

    const completedAuctions = verifiedAuctions.filter((enrichedAuction) => {
      const auction = enrichedAuction.auction
      const endBlockTimestamp = enrichedAuction.timeRemaining.endBlockTimestamp

      if (
        !auction ||
        !auction.endBlock ||
        !auction.chainId ||
        !endBlockTimestamp ||
        !enrichedAuction.timeRemaining.isCompleted
      ) {
        return false
      }

      // For completed auctions, check if completed within 24 hours using the actual end block timestamp
      const endTime = Number(endBlockTimestamp) * 1000 // Convert to milliseconds
      const timeSinceCompletion = currentTime - endTime

      if (timeSinceCompletion <= TWENTY_FOUR_HOURS_MS) {
        return true
      }

      // if there are no ongoing auctions include auctions that completed over 24 hours ago as well
      return verifiedSortedOngoingAuctions.length <= 0
    })

    return completedAuctions.sort(auctionCommittedVolumeComparator)
  }, [verifiedAuctions, verifiedSortedOngoingAuctions.length])

  const limit = verifiedSortedOngoingAuctions.length > 0 ? MAX_CHIPS : FALLBACK_CHIPS
  const topVerifiedAuctions = [...verifiedSortedOngoingAuctions, ...verifiedSortedCompletedAuctions].slice(0, limit)

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
              href={uniswapUrls.helpArticleUrls.toucanVerifiedAuctionsHelp}
              target="_blank"
              onPress={(e) => e.stopPropagation()}
              display="flex"
              alignItems="center"
            >
              <InfoCircleFilled size="$icon.16" color="$neutral2" />
            </Anchor>
          </Tooltip.Trigger>
          <Tooltip.Content zIndex={zIndexes.overlay}>
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
