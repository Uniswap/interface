import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { BidDistributionChartPlaceholder } from '~/features/Toucan/Auction/BidDistributionChart/BidDistributionChartPlaceholder'
import { BidDistributionChartRenderer } from '~/features/Toucan/Auction/BidDistributionChart/BidDistributionChartRenderer'
import { areUserBidsEqualUnordered } from '~/features/Toucan/Auction/BidDistributionChart/utils/equality'
import { fromQ96ToDecimalWithTokenDecimals } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { generateChartData, mergeUserBidVolumes } from '~/features/Toucan/Auction/BidDistributionChart/utils/utils'
import { AuctionDetails, AuctionProgressState, BidTokenInfo, UserBid } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/features/Toucan/Auction/utils/clearingPrice'
import { isGroupingMeaningful } from '~/features/Toucan/ToucanChart/bidDistribution/utils/tickGrouping'
import { ChartMode } from '~/features/Toucan/ToucanChart/renderer'

const PLACEHOLDER_HEIGHT = 400

interface BidDistributionChartProps {
  auctionDetails: AuctionDetails
  bidTokenInfo: BidTokenInfo
  auctionTokenDecimals: number
  tokenColor?: string
  userBids: UserBid[]
  onGroupingToggleDisabledChange?: (disabled: boolean) => void
  chartMode?: ChartMode
}

/**
 * BidDistributionChart handles the bid distribution visualization.
 * It is responsible for:
 * - Consuming bid distribution data from store (fetched by useLoadBidDistributionData in provider)
 * - Computing chart data for rendering
 * - Rendering the chart via BidDistributionChartRenderer
 *
 * Note: Concentration band is computed separately by useComputeConcentrationBand hook
 * at the provider level to ensure it's available for the stats banner on page load.
 */
export function BidDistributionChart({
  auctionDetails,
  bidTokenInfo,
  auctionTokenDecimals,
  tokenColor,
  userBids,
  onGroupingToggleDisabledChange,
  chartMode = 'distribution',
}: BidDistributionChartProps) {
  const { setGroupTicksEnabled } = useAuctionStoreActions()
  const { t } = useTranslation()

  // Get bid distribution data and derived clearing price from store
  const bidDistributionData = useAuctionStore((state) => state.bidDistributionData)
  const excludedBidVolume = useAuctionStore((state) => state.excludedBidVolume)
  const optimisticBid = useAuctionStore((state) => state.optimisticBid)
  const customBidTick = useAuctionStore((state) => state.customBidTick.tickValue)

  // Use on-chain clearing price during active auction for consistency with isInRange
  // Use simulated clearing price when auction has ended (preserves final state)
  const clearingPrice = useAuctionStore((state) => {
    const isAuctionActive = state.progress.state === AuctionProgressState.IN_PROGRESS
    const effectiveCheckpoint = isAuctionActive ? state.onchainCheckpoint : state.checkpointData
    return getClearingPrice(effectiveCheckpoint, state.auctionDetails)
  })
  // onchainClearingPrice for marker in-range detection (always uses on-chain truth)
  const onchainClearingPrice = useAuctionStore((state) =>
    getClearingPrice(state.onchainCheckpoint, state.auctionDetails),
  )

  // Use auction parameters from API data
  const tickSize = auctionDetails.tickSize || '0'
  const floorPrice = auctionDetails.floorPrice || '0'
  const totalSupply = auctionDetails.tokenTotalSupply

  const normalizedChainId = auctionDetails.chainId as UniverseChainId
  const connectedWalletAddress = useActiveAddress(normalizedChainId)

  const prevUserBidsRef = useRef<UserBid[]>(userBids)
  const stableUserBids = useMemo(() => {
    if (areUserBidsEqualUnordered(prevUserBidsRef.current, userBids)) {
      return prevUserBidsRef.current
    }
    prevUserBidsRef.current = userBids
    return userBids
  }, [userBids])

  const hasBidDistributionData = bidDistributionData !== null

  const effectiveBidDistributionData = useMemo(
    () =>
      mergeUserBidVolumes({
        bidDistributionData,
        userBids,
        optimisticBid,
      }),
    [bidDistributionData, optimisticBid, userBids],
  )

  const hasBidData = Boolean(
    hasBidDistributionData && effectiveBidDistributionData && effectiveBidDistributionData.size > 0,
  )

  // Calculate chart data once - shared between header and renderer
  // Use a simple formatter here since the renderer will apply proper formatting
  const chartData = useMemo(
    () =>
      effectiveBidDistributionData
        ? generateChartData({
            bidData: effectiveBidDistributionData,
            bidTokenInfo,
            totalSupply,
            auctionTokenDecimals,
            clearingPrice,
            floorPrice,
            tickSize,
            formatter: (amount: number) => amount.toString(),
            chartMode,
            excludedVolume: excludedBidVolume,
            extendedMaxTick: customBidTick,
          })
        : null,
    [
      effectiveBidDistributionData,
      bidTokenInfo,
      clearingPrice,
      floorPrice,
      tickSize,
      totalSupply,
      auctionTokenDecimals,
      chartMode,
      excludedBidVolume,
      customBidTick,
    ],
  )

  // Determine if tick grouping would be meaningful
  // Grouping is meaningful when it would combine at least 3 ticks per bar (>66 ticks in initial view)
  const groupingMeaningful = useMemo(() => {
    if (!chartData || chartData.bars.length === 0) {
      return false
    }
    return isGroupingMeaningful({
      bars: chartData.bars,
      minTick: chartData.minTick,
      maxTick: chartData.maxTick,
      tickSizeDecimal: fromQ96ToDecimalWithTokenDecimals({
        q96Value: tickSize,
        bidTokenDecimals: bidTokenInfo.decimals,
        auctionTokenDecimals,
      }),
      clearingPriceDecimal: fromQ96ToDecimalWithTokenDecimals({
        q96Value: clearingPrice,
        bidTokenDecimals: bidTokenInfo.decimals,
        auctionTokenDecimals,
      }),
      concentration: chartData.concentration
        ? { startTick: chartData.concentration.startTick, endTick: chartData.concentration.endTick }
        : null,
    })
  }, [auctionTokenDecimals, bidTokenInfo.decimals, chartData, clearingPrice, tickSize])

  // Notify parent of disabled state changes
  useEffect(() => {
    onGroupingToggleDisabledChange?.(!groupingMeaningful)
  }, [groupingMeaningful, onGroupingToggleDisabledChange])

  // Reset groupTicksEnabled when grouping is not meaningful
  useEffect(() => {
    if (!groupingMeaningful) {
      setGroupTicksEnabled(false)
    }
  }, [groupingMeaningful, setGroupTicksEnabled])

  const renderPlaceholder = (text: string) => (
    <Flex height={PLACEHOLDER_HEIGHT} alignItems="center" justifyContent="center">
      <BidDistributionChartPlaceholder height={PLACEHOLDER_HEIGHT}>{text}</BidDistributionChartPlaceholder>
    </Flex>
  )

  // Handle bid distribution specific states
  if (hasBidDistributionData && !hasBidData && !excludedBidVolume) {
    return renderPlaceholder(t('toucan.auction.noBids'))
  }

  // Show loading state when we don't have chart data yet
  if (!chartData) {
    return renderPlaceholder(t('toucan.auction.loadingBids'))
  }

  return (
    <BidDistributionChartRenderer
      key={auctionDetails.auctionId}
      chartData={chartData}
      bidTokenInfo={bidTokenInfo}
      totalSupply={totalSupply}
      auctionTokenDecimals={auctionTokenDecimals}
      clearingPrice={clearingPrice}
      onchainClearingPrice={onchainClearingPrice}
      floorPrice={floorPrice}
      tickSize={tickSize}
      tokenColor={tokenColor}
      userBids={stableUserBids}
      connectedWalletAddress={connectedWalletAddress}
      chartMode={chartMode}
    />
  )
}
