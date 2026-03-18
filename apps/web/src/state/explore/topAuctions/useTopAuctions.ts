import { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import { AuctionWithStats, ListTopAuctionsRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { DynamicConfigs, useDynamicConfigValue, VerifiedAuctionsConfigKey } from '@universe/gating'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { DEFAULT_VERIFIED_AUCTION_IDS } from '~/components/Toucan/Config/config'
import { BlockTimestampRequest, useGetBlockTimestamps, useMultiChainBlockInfo } from '~/hooks/useMultiChainBlockInfo'
import { EXPLORE_API_PAGE_SIZE } from '~/state/explore/constants'
import { isAuctionCompleted } from '~/state/explore/topAuctions/isAuctionCompleted'
import { useChainIdFromUrlParam } from '~/utils/chainParams'

export function auctionCommittedVolumeComparator(a: EnrichedAuction, b: EnrichedAuction): number {
  // Use USD values for cross-currency comparison (follows portfolio balances pattern)
  if (a.auction?.totalBidVolumeUsd === undefined) {
    return 1 // Missing price sorts to end
  }
  if (b.auction?.totalBidVolumeUsd === undefined) {
    return -1
  }

  return Number(b.auction.totalBidVolumeUsd) - Number(a.auction.totalBidVolumeUsd)
}

export type EnrichedAuction = PlainMessage<AuctionWithStats> & {
  verified: boolean
  logoUrl: Maybe<string>
  timeRemaining: {
    isCompleted: boolean
    startBlockTimestamp: bigint | undefined
    endBlockTimestamp: bigint | undefined
  }
}

/**
 * Hook that fetches and filters top auctions with chain and search filtering.
 * - Chain filtering: Backend (via ListTopAuctionsRequest chainIds parameter)
 */
export function useTopAuctions(): {
  auctions: EnrichedAuction[]
  isLoading: boolean
  isError: boolean
} {
  const chainId = useChainIdFromUrlParam()
  const isTestnetModeEnabled = useSelector(selectIsTestnetModeEnabled)

  const verifiedAuctionIds: string[] = useDynamicConfigValue({
    config: DynamicConfigs.VerifiedAuctions,
    key: VerifiedAuctionsConfigKey.VerifiedAuctionIds,
    defaultValue: DEFAULT_VERIFIED_AUCTION_IDS,
  })

  const params = useMemo(
    () =>
      new ListTopAuctionsRequest({
        pageSize: EXPLORE_API_PAGE_SIZE,
        chainIds: chainId ? [chainId] : [], // Empty array = all chains
      }),
    [chainId],
  )

  const { data: topAuctions, isLoading, isError } = useQuery(auctionQueries.listTopAuctions({ params }))

  const currencyIds = useMemo(
    () =>
      (topAuctions?.auctions ?? [])
        .map((auction) =>
          auction.auction ? buildCurrencyId(auction.auction.chainId, auction.auction.tokenAddress) : undefined,
        )
        .filter((id): id is string => id !== undefined),
    [topAuctions?.auctions],
  )
  const currencyInfos = useCurrencyInfos(currencyIds, {
    skip: !topAuctions?.auctions || topAuctions.auctions.length === 0,
  })

  // Extract unique chain IDs from auctions to minimize RPC calls
  const auctionChainIds = useMemo(() => {
    if (!topAuctions?.auctions) {
      return new Set<EVMUniverseChainId>()
    }
    return new Set(
      topAuctions.auctions.map((a) => a.auction?.chainId).filter((id): id is EVMUniverseChainId => id !== undefined),
    )
  }, [topAuctions?.auctions])

  // Fetch current block numbers and timestamps for chains that have auctions
  const blocksByChain = useMultiChainBlockInfo(auctionChainIds)

  const areBlocksLoaded = useMemo(
    () => [...auctionChainIds].every((chainId) => blocksByChain.has(chainId)),
    [auctionChainIds, blocksByChain],
  )

  // Build requests for block timestamps - extract endBlock values from auctions
  const blockTimestampRequests = useMemo<BlockTimestampRequest[]>(() => {
    if (!topAuctions?.auctions) {
      return []
    }

    return topAuctions.auctions
      .map((auctionWithStats) => {
        const auction = auctionWithStats.auction
        // Only create request if both chainId and endBlock are valid
        if (!auction || !auction.chainId) {
          return null
        }

        const requests: BlockTimestampRequest[] = []
        if (auction.startBlock) {
          requests.push({
            chainId: auction.chainId,
            blockNumber: auction.startBlock,
          })
        }

        if (auction.endBlock) {
          requests.push({
            chainId: auction.chainId,
            blockNumber: auction.endBlock,
          })
        }

        return requests
      })
      .flat()
      .filter((req): req is BlockTimestampRequest => req !== null)
  }, [topAuctions?.auctions])

  const getBlockTimestamp = useGetBlockTimestamps(blockTimestampRequests, blocksByChain)

  const auctionsWithCurrencyInfo = useMemo<EnrichedAuction[]>(() => {
    if (!topAuctions?.auctions) {
      return []
    }

    const verifiedSet = new Set(verifiedAuctionIds)

    return topAuctions.auctions
      .map((auction, index) => {
        const startBlockTimestamp =
          auction.auction?.startBlock && auction.auction.chainId
            ? getBlockTimestamp(auction.auction.chainId, auction.auction.startBlock)
            : undefined

        const endBlockTimestamp =
          auction.auction && auction.auction.chainId && auction.auction.endBlock
            ? getBlockTimestamp(auction.auction.chainId, auction.auction.endBlock)
            : undefined

        return {
          ...auction,
          verified: auction.auction ? verifiedSet.has(auction.auction.auctionId) : false,
          logoUrl: currencyInfos[index]?.logoUrl,
          timeRemaining: {
            startBlockTimestamp,
            endBlockTimestamp,
            isCompleted: isAuctionCompleted({
              endBlock: auction.auction?.endBlock,
              blockNumber: auction.auction?.chainId ? blocksByChain.get(auction.auction.chainId)?.number : undefined,
            }),
          },
        }
      })
      .filter((auctionWithInfo) => {
        // Filter out testnet chains when testnet mode is not enabled
        const chainId = auctionWithInfo.auction?.chainId
        return chainId !== undefined && (isTestnetModeEnabled || !isTestnetChain(chainId))
      })
  }, [topAuctions?.auctions, verifiedAuctionIds, isTestnetModeEnabled, getBlockTimestamp, currencyInfos, blocksByChain])

  return {
    auctions: auctionsWithCurrencyInfo,
    isLoading: isLoading || !areBlocksLoaded,
    isError,
  }
}
