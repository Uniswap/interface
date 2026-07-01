import { PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  AuctionWithStats,
  GetAuctionRequest,
  ListTopAuctionsRequest,
} from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { DynamicConfigs, useDynamicConfigValue, VerifiedAuctionsConfigKey } from '@universe/gating'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
// oxlint-disable-next-line no-restricted-imports -- Direct selector access needed for auction testnet filtering
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { DEFAULT_VERIFIED_AUCTION_IDS, getAuctionMetadata } from '~/features/Toucan/Config/config'
import { isAuctionCompleted } from '~/features/Toucan/hooks/useTopAuctions/isAuctionCompleted'
import { BlockTimestampRequest, useGetBlockTimestamps, useMultiChainBlockInfo } from '~/hooks/useMultiChainBlockInfo'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

export const AUCTION_LIST_API_PAGE_SIZE = 200

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
        pageSize: AUCTION_LIST_API_PAGE_SIZE,
        chainIds: chainId ? [chainId] : [], // Empty array = all chains
      }),
    [chainId],
  )

  const { data: topAuctions, isLoading, isError } = useQuery(auctionQueries.listTopAuctions({ params }))

  // Parse verified IDs ("chainId_address") and filter by URL chain when present.
  // GetAuction is used as a fallback so verified auctions outside the top-N (e.g. not-yet-started
  // ones with zero bid volume) still surface in the verified section.
  const verifiedAuctionParams = useMemo<{ chainId: number; address: string }[]>(
    () =>
      verifiedAuctionIds
        .map((id) => {
          const sepIndex = id.indexOf('_')
          if (sepIndex < 0) {
            return undefined
          }
          const parsedChainId = Number(id.slice(0, sepIndex))
          const address = id.slice(sepIndex + 1)
          if (!Number.isFinite(parsedChainId) || !address) {
            return undefined
          }
          return { chainId: parsedChainId, address }
        })
        .filter((p): p is { chainId: number; address: string } => p !== undefined)
        .filter((p) => !chainId || p.chainId === chainId),
    [verifiedAuctionIds, chainId],
  )

  const topAuctionIdSet = useMemo(
    () =>
      new Set(
        (topAuctions?.auctions ?? []).map((a) => a.auction?.auctionId).filter((id): id is string => id !== undefined),
      ),
    [topAuctions?.auctions],
  )

  const missingVerifiedParams = useMemo(
    () => verifiedAuctionParams.filter((p) => !topAuctionIdSet.has(`${p.chainId}_${p.address}`)),
    [verifiedAuctionParams, topAuctionIdSet],
  )

  const missingVerifiedQueries = useQueries({
    queries: missingVerifiedParams.map((p) => auctionQueries.getAuction({ params: new GetAuctionRequest(p) })),
  })

  // Merge ListTopAuctions results with any verified auctions fetched individually via GetAuction.
  // The verified-only entries are appended with empty totalBidVolume so they sort to the end via
  // auctionCommittedVolumeComparator (USD volume missing/zero).
  const mergedAuctions = useMemo<PlainMessage<AuctionWithStats>[]>(() => {
    const base = topAuctions?.auctions ?? []
    const extras: PlainMessage<AuctionWithStats>[] = []
    for (const q of missingVerifiedQueries) {
      const auction = q.data?.auctions[0]
      if (auction) {
        extras.push(new AuctionWithStats({ auction, totalBidVolume: '' }))
      }
    }
    return extras.length > 0 ? [...base, ...extras] : base
  }, [topAuctions?.auctions, missingVerifiedQueries])

  const verifiedFallbackLoading = missingVerifiedQueries.some((q) => q.isLoading)

  const currencyIds = useMemo(
    () =>
      mergedAuctions
        .map((auction) =>
          auction.auction ? buildCurrencyId(auction.auction.chainId, auction.auction.tokenAddress) : undefined,
        )
        .filter((id): id is string => id !== undefined),
    [mergedAuctions],
  )
  const currencyInfos = useCurrencyInfos(currencyIds, {
    skip: mergedAuctions.length === 0,
  })

  // Extract unique chain IDs from auctions to minimize RPC calls
  const auctionChainIds = useMemo(() => {
    return new Set(
      mergedAuctions.map((a) => a.auction?.chainId).filter((id): id is EVMUniverseChainId => id !== undefined),
    )
  }, [mergedAuctions])

  // Fetch current block numbers and timestamps for chains that have auctions
  const blocksByChain = useMultiChainBlockInfo(auctionChainIds)

  const areBlocksLoaded = useMemo(
    // oxlint-disable-next-line no-shadow
    () => [...auctionChainIds].every((chainId) => blocksByChain.has(chainId)),
    [auctionChainIds, blocksByChain],
  )

  // Build requests for block timestamps - extract endBlock values from auctions
  const blockTimestampRequests = useMemo<BlockTimestampRequest[]>(() => {
    return mergedAuctions
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
  }, [mergedAuctions])

  const getBlockTimestamp = useGetBlockTimestamps(blockTimestampRequests, blocksByChain)

  const auctionsWithCurrencyInfo = useMemo<EnrichedAuction[]>(() => {
    if (mergedAuctions.length === 0) {
      return []
    }

    const verifiedSet = new Set(verifiedAuctionIds)

    return mergedAuctions
      .map((auction, index) => {
        const coreAuction = auction.auction
        const currencyInfo = currencyInfos[index]

        // Image precedence (mirrors the auction detail page): curated config override logo
        // (authoritative) -> creator-uploaded API image -> indexed currency logo -> TokenLogo
        // placeholder. Centralized here so the table cell and chip stay consistent.
        const overrideLogo =
          coreAuction?.chainId && coreAuction.tokenAddress
            ? getAuctionMetadata({ chainId: coreAuction.chainId, tokenAddress: coreAuction.tokenAddress })?.logoUrl
            : undefined

        const startBlockTimestamp =
          coreAuction?.startBlock && coreAuction.chainId
            ? getBlockTimestamp(coreAuction.chainId, coreAuction.startBlock)
            : undefined

        const endBlockTimestamp =
          coreAuction && coreAuction.chainId && coreAuction.endBlock
            ? getBlockTimestamp(coreAuction.chainId, coreAuction.endBlock)
            : undefined

        let auctionWithCurrency: PlainMessage<AuctionWithStats>['auction']
        if (coreAuction !== undefined) {
          auctionWithCurrency = {
            ...toPlainMessage(coreAuction),
            tokenName: currencyInfo?.currency.name ?? coreAuction.tokenName,
            tokenSymbol: currencyInfo?.currency.symbol ?? coreAuction.tokenSymbol,
          }
        } else {
          auctionWithCurrency = undefined
        }

        return {
          ...auction,
          verified: coreAuction ? verifiedSet.has(coreAuction.auctionId) : false,
          // `||` (not `??`) so an empty-string API image is treated as absent and doesn't
          // suppress the override / indexed logo, independent of the backend's unset-vs-"".
          logoUrl: overrideLogo || coreAuction?.tokenImageUrl || currencyInfo?.logoUrl,
          timeRemaining: {
            startBlockTimestamp,
            endBlockTimestamp,
            isCompleted: isAuctionCompleted({
              endBlock: coreAuction?.endBlock,
              blockNumber: coreAuction?.chainId ? blocksByChain.get(coreAuction.chainId)?.number : undefined,
            }),
          },
          auction: auctionWithCurrency,
        }
      })
      .filter((auctionWithInfo) => {
        // Filter out testnet chains when testnet mode is not enabled
        // oxlint-disable-next-line no-shadow
        const chainId = auctionWithInfo.auction?.chainId
        return chainId !== undefined && (isTestnetModeEnabled || !isTestnetChain(chainId))
      })
  }, [mergedAuctions, verifiedAuctionIds, isTestnetModeEnabled, getBlockTimestamp, currencyInfos, blocksByChain])

  return {
    auctions: auctionsWithCurrencyInfo,
    isLoading: isLoading || verifiedFallbackLoading || !areBlocksLoaded,
    isError,
  }
}
