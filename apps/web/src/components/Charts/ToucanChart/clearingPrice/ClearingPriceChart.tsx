import { useQuery } from '@tanstack/react-query'
import { GetClearingPriceHistoryRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { ClearingPriceChartRenderer } from '~/components/Charts/ToucanChart/clearingPrice/ClearingPriceChartRenderer'
import { normalizeClearingSeries } from '~/components/Charts/ToucanChart/clearingPrice/utils/normalizeSeries'
import { calculateMaxFractionDigits } from '~/components/Charts/ToucanChart/clearingPrice/utils/yAxisRange'
import { BidDistributionChartPlaceholder } from '~/components/Toucan/Auction/BidDistributionChart/BidDistributionChartPlaceholder'
import { CHART_DIMENSIONS } from '~/components/Toucan/Auction/BidDistributionChart/constants'
import type { AuctionDetails, BidTokenInfo } from '~/components/Toucan/Auction/store/types'
import { useBlockTimestamp } from '~/hooks/useBlockTimestamp'
import { getPollingIntervalMs } from '~/utils/averageBlockTimeMs'

interface ClearingPriceChartProps {
  auctionDetails: AuctionDetails
  bidTokenInfo: BidTokenInfo
  currentBlockNumber?: number
  latestClearingPriceQ96?: string
  tokenColor?: string
  height?: number
}

/**
 * Clearing Price Chart container component.
 *
 * Responsibilities:
 * - Fetch clearing price data from API
 * - Normalize data for chart consumption
 * - Calculate display parameters (fraction digits)
 * - Render the chart via ClearingPriceChartRenderer
 *
 * This follows the same container/presenter pattern as BidDistributionChart
 * for consistency across Toucan charts.
 */
export function ClearingPriceChart({
  auctionDetails,
  bidTokenInfo,
  currentBlockNumber,
  latestClearingPriceQ96,
  tokenColor,
  height = CHART_DIMENSIONS.HEIGHT,
}: ClearingPriceChartProps): JSX.Element {
  const { t } = useTranslation()
  const queryParams = useMemo(
    () =>
      new GetClearingPriceHistoryRequest({
        chainId: auctionDetails.chainId,
        address: auctionDetails.address,
      }),
    [auctionDetails.address, auctionDetails.chainId],
  )

  const isAuctionActive = useMemo(() => {
    if (!currentBlockNumber || !auctionDetails.endBlock) {
      return false
    }
    return Number(currentBlockNumber) < Number(auctionDetails.endBlock)
  }, [auctionDetails.endBlock, currentBlockNumber])

  const refetchInterval = useMemo<number | false>(() => {
    if (!isAuctionActive) {
      return false
    }
    return getPollingIntervalMs(auctionDetails.chainId)
  }, [auctionDetails.chainId, isAuctionActive])

  const { data: clearingPriceResponse } = useQuery(
    auctionQueries.getClearingPriceHistory({
      params: queryParams,
      refetchInterval,
    }),
  )
  const clearingHistory = clearingPriceResponse?.changes

  const auctionStartBlockNumber = auctionDetails.startBlock ? Number(auctionDetails.startBlock) : undefined
  const auctionStartBlockTimestamp = useBlockTimestamp({
    chainId: auctionDetails.chainId,
    blockNumber: auctionStartBlockNumber,
  })

  const auctionEndBlockNumber = auctionDetails.endBlock ? Number(auctionDetails.endBlock) : undefined
  const auctionEndBlockTimestamp = useBlockTimestamp({
    chainId: auctionDetails.chainId,
    blockNumber: auctionEndBlockNumber,
  })

  const normalizedData = useMemo(
    () =>
      normalizeClearingSeries({
        auctionDetails,
        bidTokenDecimals: bidTokenInfo.decimals,
        auctionTokenDecimals: auctionDetails.token?.currency.decimals,
        currentBlockNumber,
        clearingHistory,
        latestClearingPriceQ96,
        auctionStartBlockTimestamp,
        auctionEndBlockTimestamp,
      }),
    [
      auctionDetails,
      auctionDetails.token?.currency.decimals,
      bidTokenInfo.decimals,
      currentBlockNumber,
      clearingHistory,
      latestClearingPriceQ96,
      auctionStartBlockTimestamp,
      auctionEndBlockTimestamp,
    ],
  )

  if (!normalizedData) {
    return (
      <BidDistributionChartPlaceholder height={height}>
        {t('toucan.auction.errorLoading')}
      </BidDistributionChartPlaceholder>
    )
  }

  const maxFractionDigits = calculateMaxFractionDigits(normalizedData.yMax)

  return (
    <ClearingPriceChartRenderer
      normalizedData={normalizedData}
      bidTokenInfo={bidTokenInfo}
      maxFractionDigits={maxFractionDigits}
      tokenColor={tokenColor}
      height={height}
    />
  )
}
