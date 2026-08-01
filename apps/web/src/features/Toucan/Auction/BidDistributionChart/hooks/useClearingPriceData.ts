import { useQuery } from '@tanstack/react-query'
import { GetClearingPriceHistoryRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useMemo } from 'react'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import type { AuctionDetails, BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/features/Toucan/Auction/utils/clearingPrice'
import { getAuctionTokenDecimals } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { normalizeClearingSeries } from '~/features/Toucan/ToucanChart/clearingPrice/utils/normalizeSeries'
import { useBlockTimestamp } from '~/hooks/useBlockTimestamp'
import { getPollingIntervalMs } from '~/utils/averageBlockTimeMs'

/**
 * Fetches and normalizes clearing price history for the combined auction chart.
 * Mirrors the data-fetching logic from ClearingPriceChart.tsx.
 */
export function useClearingPriceData({
  auctionDetails,
  bidTokenInfo,
}: {
  auctionDetails: AuctionDetails
  bidTokenInfo: Pick<BidTokenInfo, 'decimals'>
}) {
  const { currentBlockNumber, checkpointData } = useAuctionStore((state) => ({
    currentBlockNumber: state.currentBlockNumber,
    checkpointData: state.checkpointData,
  }))

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

  const latestClearingPriceQ96 = getClearingPrice(checkpointData, auctionDetails)

  const normalizedData = useMemo(
    () =>
      normalizeClearingSeries({
        auctionDetails,
        bidTokenDecimals: bidTokenInfo.decimals,
        auctionTokenDecimals: getAuctionTokenDecimals(auctionDetails.token),
        currentBlockNumber,
        clearingHistory,
        latestClearingPriceQ96,
        auctionStartBlockTimestamp,
        auctionEndBlockTimestamp,
      }),
    [
      auctionDetails,
      bidTokenInfo.decimals,
      currentBlockNumber,
      clearingHistory,
      latestClearingPriceQ96,
      auctionStartBlockTimestamp,
      auctionEndBlockTimestamp,
    ],
  )

  return { normalizedData, currentBlockNumber }
}
