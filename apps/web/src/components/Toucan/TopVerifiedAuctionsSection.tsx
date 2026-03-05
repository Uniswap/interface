import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Tooltip } from 'ui/src/components/tooltip/Tooltip'
import { zIndexes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { isStablecoinAddress } from 'uniswap/src/features/chains/utils'
import { AuctionChip } from '~/components/Toucan/AuctionChip'
import { buildTokenMarketPriceKey } from '~/components/Toucan/hooks/useTokenMarketPrices'
import {
  CommittedVolumeTableValue,
  computeCommittedVolumeTableValue,
} from '~/components/Toucan/utils/computeCommittedVolume'
import { computeProjectedFdvTableValue, ProjectedFdvTableValue } from '~/components/Toucan/utils/computeProjectedFdv'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { useMultiChainBlockNumbers } from '~/hooks/useMultiChainBlockNumbers'
import { isAuctionCompleted } from '~/state/explore/topAuctions/isAuctionCompleted'
import { useAuctionTokenPrices } from '~/state/explore/topAuctions/useAuctionTokenPrices'
import { useBidTokenInfos } from '~/state/explore/topAuctions/useBidTokenInfos'
import { useBidTokenPrices } from '~/state/explore/topAuctions/useBidTokenPrices'
import type { AuctionWithCurrencyInfo } from '~/state/explore/topAuctions/useTopAuctions'
import { useTopAuctions } from '~/state/explore/topAuctions/useTopAuctions'
import { getAverageBlockTimeMs } from '~/utils/averageBlockTimeMs'

interface AuctionWithComputedValues {
  auction: AuctionWithCurrencyInfo
  projectedFdv: ProjectedFdvTableValue
  committedVolume: CommittedVolumeTableValue
}

const TWENTY_FOUR_HOURS_MS = 86400000
const MAX_CHIPS = 8
const FALLBACK_CHIPS = 4

export function TopVerifiedAuctionsSection() {
  const { t } = useTranslation()
  const { auctions: allAuctions, isLoading } = useTopAuctions()
  const bidTokenInfos = useBidTokenInfos(allAuctions)
  const { priceMap: bidTokenPriceMap, loading: bidTokenPricesLoading } = useBidTokenPrices(allAuctions)
  const { priceMap: auctionTokenPriceMap, loading: auctionTokenPricesLoading } = useAuctionTokenPrices(allAuctions)

  // Extract unique chain IDs for block number fetching
  const auctionChainIds = useMemo(
    () => new Set(allAuctions.map((a) => a.auction?.chainId).filter((id): id is number => id !== undefined)),
    [allAuctions],
  )

  const blocksByChain = useMultiChainBlockNumbers(auctionChainIds)

  // Filter and compute values for top verified auctions
  const topVerifiedAuctions = useMemo<AuctionWithComputedValues[]>(() => {
    const currentTime = Date.now()

    // Step 1: Filter for verified auctions only
    const verifiedAuctions = allAuctions.filter((auctionWithCurrencyInfo) => auctionWithCurrencyInfo.verified)

    // Step 2: Filter for priority auctions (ongoing OR completed within 24h)
    const filteredByTime = verifiedAuctions.filter((auctionWithCurrencyInfo) => {
      const auction = auctionWithCurrencyInfo.auction
      if (!auction || !auction.startBlock || !auction.endBlock || !auction.chainId) {
        return false
      }

      const currentBlock = blocksByChain.get(auction.chainId)
      if (currentBlock === undefined) {
        return false
      }

      const startBlock = BigInt(auction.startBlock)
      const endBlock = BigInt(auction.endBlock)

      // Include auctions that haven't started yet
      if (currentBlock < startBlock) {
        return true
      }

      const isCompleted = isAuctionCompleted({
        endBlock: auction.endBlock,
        blockNumber: currentBlock,
      })

      // Include auctions that are ongoing
      if (currentBlock >= startBlock && !isCompleted) {
        return true
      }

      // For completed auctions, check if completed within 24 hours
      // Use creation timestamp to estimate end time (same as computeTimeRemaining)
      if (isCompleted) {
        if (!auction.creationBlock || !auction.createdAt) {
          return false
        }

        try {
          const creationTimestamp = new Date(auction.createdAt).getTime()
          if (isNaN(creationTimestamp)) {
            return false
          }

          const creationBlock = Number(auction.creationBlock)
          const endBlockNum = Number(endBlock)
          const averageBlockTimeMs = getAverageBlockTimeMs(auction.chainId)

          const endBlockDiff = endBlockNum - creationBlock
          const estimatedEndTime = creationTimestamp + endBlockDiff * averageBlockTimeMs

          const timeSinceCompletion = currentTime - estimatedEndTime
          return timeSinceCompletion <= TWENTY_FOUR_HOURS_MS
        } catch (_error) {
          return false
        }
      }

      return false
    })

    // Step 3: Determine which set to use
    const filteredAuctions =
      filteredByTime.length > 0
        ? filteredByTime
        : verifiedAuctions.filter((auctionWithCurrencyInfo) => {
            // Fallback: Show all completed auctions (any time)
            const auction = auctionWithCurrencyInfo.auction
            if (!auction || !auction.startBlock || !auction.endBlock || !auction.chainId) {
              return false
            }
            const currentBlock = blocksByChain.get(auction.chainId)
            if (currentBlock === undefined) {
              return false
            }
            const endBlock = BigInt(auction.endBlock)
            return currentBlock >= endBlock
          })

    // Step 4: Compute values for each auction
    const auctionsWithValues = filteredAuctions
      .map((auctionWithCurrencyInfo) => {
        const auction = auctionWithCurrencyInfo.auction
        if (!auction?.currency || !auction.chainId) {
          return undefined
        }

        const bidTokenCurrencyInfo = bidTokenInfos.get(auction.currency)

        const bidTokenMarketPriceUsd =
          bidTokenPriceMap[buildTokenMarketPriceKey({ chainId: auction.chainId, address: auction.currency })]

        const isCompleted = isAuctionCompleted({
          endBlock: auction.endBlock,
          blockNumber: blocksByChain.get(auction.chainId),
        })

        const auctionTokenUsdPrice = auction.tokenAddress
          ? auctionTokenPriceMap[buildTokenMarketPriceKey({ chainId: auction.chainId, address: auction.tokenAddress })]
          : undefined

        const projectedFdv = computeProjectedFdvTableValue({
          auction: auctionWithCurrencyInfo,
          bidTokenCurrencyInfo,
          bidTokenUsdPrice: bidTokenMarketPriceUsd,
          auctionTokenUsdPrice,
          isCompleted,
        })

        // Check if the bid token is a stablecoin
        const isStablecoin = isStablecoinAddress(auction.chainId, auction.currency)

        const committedVolume = computeCommittedVolumeTableValue({
          auction: auctionWithCurrencyInfo,
          bidTokenCurrencyInfo,
          bidTokenMarketPriceUsd,
          isStablecoin,
        })

        return {
          auction: auctionWithCurrencyInfo,
          projectedFdv,
          committedVolume,
        }
      })
      .filter((item): item is AuctionWithComputedValues => item !== undefined)

    // Step 5: Sort by committed volume (USD descending, fallback to raw)
    const sorted = auctionsWithValues.sort((a, b) => {
      if (a.committedVolume.usd !== undefined && b.committedVolume.usd !== undefined) {
        return b.committedVolume.usd - a.committedVolume.usd
      }
      if (a.committedVolume.usd !== undefined) {
        return -1
      }
      if (b.committedVolume.usd !== undefined) {
        return 1
      }
      // Both missing USD, compare raw values
      return Number(b.committedVolume.raw - a.committedVolume.raw)
    })

    // Step 6: Apply conditional limit
    const limit = filteredByTime.length > 0 ? MAX_CHIPS : FALLBACK_CHIPS
    return sorted.slice(0, limit)
  }, [allAuctions, bidTokenInfos, bidTokenPriceMap, auctionTokenPriceMap, blocksByChain])

  // Hide section if no verified auctions match criteria or still loading
  if (isLoading || bidTokenPricesLoading || auctionTokenPricesLoading || topVerifiedAuctions.length === 0) {
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
        {topVerifiedAuctions.map(({ auction, projectedFdv, committedVolume }) => {
          if (!auction.auction?.auctionId) {
            return null
          }
          return (
            <AuctionChip
              key={auction.auction.auctionId}
              auction={auction}
              projectedFdv={projectedFdv}
              committedVolume={committedVolume}
            />
          )
        })}
      </Flex>
    </Flex>
  )
}
