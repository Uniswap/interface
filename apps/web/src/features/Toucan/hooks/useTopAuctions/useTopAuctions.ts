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
import { approximateNumberFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { computePreBidEndBlock } from '~/features/Toucan/Auction/utils/preBidEndBlock'
import { DEFAULT_VERIFIED_AUCTION_IDS, getAuctionMetadata } from '~/features/Toucan/Config/config'
import { isAuctionCompleted } from '~/features/Toucan/hooks/useTopAuctions/isAuctionCompleted'
import { BlockTimestampRequest, useGetBlockTimestamps, useMultiChainBlockInfo } from '~/hooks/useMultiChainBlockInfo'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

export const AUCTION_LIST_API_PAGE_SIZE = 200

// TEMP frontend stopgap: hide abandoned auctions from the Explore "top auctions" list until the
// backend excludes them from ListTopAuctions. Direct auction links still resolve. Ids use the same
// `${chainId}_${checksummedAuctionAddress}` form as DEFAULT_VERIFIED_AUCTION_IDS and are matched
// exactly against the backend auctionId (mirrors the verified check). Remove once the backend ships.
const HIDDEN_AUCTION_IDS = new Set<string>([
  '1_0xD9E8355f9f57185928347a5BdDEe164006b16e58', // Abandoned Interfold (FOLD) auction, superseded by 0x687Cc3...
])

/** Descending comparator that sorts rows without a sort value to the end. */
export function compareDescendingMissingLast(a: number | undefined, b: number | undefined): number {
  if (a === undefined && b === undefined) {
    return 0
  }
  if (a === undefined) {
    return 1
  }
  if (b === undefined) {
    return -1
  }
  return b - a
}

function getBidTokenVolume(auction: EnrichedAuction['auction']): number | undefined {
  if (!auction?.totalBidVolume || !auction.currencyTokenDecimals) {
    return undefined
  }
  return approximateNumberFromRaw({ raw: BigInt(auction.totalBidVolume), decimals: auction.currencyTokenDecimals })
}

export function auctionCommittedVolumeComparator(a: EnrichedAuction, b: EnrichedAuction): number {
  // USD when both sides have it (cross-currency comparison); otherwise fall back to the
  // bid-token amount so chains without a USD price feed (e.g. Robinhood) still sort.
  const aUsd = a.auction?.totalBidVolumeUsd
  const bUsd = b.auction?.totalBidVolumeUsd
  if (aUsd !== undefined && bUsd !== undefined) {
    return Number(bUsd) - Number(aUsd)
  }
  return compareDescendingMissingLast(getBidTokenVolume(a.auction), getBidTokenVolume(b.auction))
}

export type EnrichedAuction = PlainMessage<AuctionWithStats> & {
  verified: boolean
  logoUrl: Maybe<string>
  timeRemaining: {
    isCompleted: boolean
    startBlockTimestamp: bigint | undefined
    endBlockTimestamp: bigint | undefined
    /** When pre-bidding ends (first token-emitting auction step). Equals start when there's no pre-bid window. */
    preBidEndBlockTimestamp: bigint | undefined
  }
}

type Auction = NonNullable<PlainMessage<AuctionWithStats>['auction']>
type CurrencyInfo = ReturnType<typeof useCurrencyInfos>[number]
type GetBlockTimestamp = ReturnType<typeof useGetBlockTimestamps>
type BlocksByChain = ReturnType<typeof useMultiChainBlockInfo>

function getAuctionCurrencyId(auction: Auction | undefined): string | undefined {
  return auction ? buildCurrencyId(auction.chainId, auction.tokenAddress) : undefined
}

function getAuctionOverrideLogo(auction: Auction | undefined): string | undefined {
  return auction?.chainId && auction.tokenAddress
    ? getAuctionMetadata({ chainId: auction.chainId, tokenAddress: auction.tokenAddress })?.logoUrl
    : undefined
}

function getAuctionTimeRemaining({
  auction,
  blocksByChain,
  getBlockTimestamp,
}: {
  auction: Auction | undefined
  blocksByChain: BlocksByChain
  getBlockTimestamp: GetBlockTimestamp
}): EnrichedAuction['timeRemaining'] {
  const startBlockTimestamp =
    auction?.startBlock && auction.chainId ? getBlockTimestamp(auction.chainId, auction.startBlock) : undefined

  const endBlockTimestamp =
    auction && auction.chainId && auction.endBlock ? getBlockTimestamp(auction.chainId, auction.endBlock) : undefined

  const preBidEndBlock = auction ? computePreBidEndBlock(auction.parsedAuctionSteps, auction.startBlock) : undefined
  const preBidEndBlockTimestamp =
    auction?.chainId && preBidEndBlock && preBidEndBlock !== auction.startBlock
      ? getBlockTimestamp(auction.chainId, preBidEndBlock)
      : startBlockTimestamp

  return {
    startBlockTimestamp,
    endBlockTimestamp,
    preBidEndBlockTimestamp,
    isCompleted: isAuctionCompleted({
      endBlock: auction?.endBlock,
      blockNumber: auction?.chainId ? blocksByChain.get(auction.chainId)?.number : undefined,
    }),
  }
}

function getAuctionWithCurrencyInfo({
  auction,
  currencyInfo,
}: {
  auction: Auction | undefined
  currencyInfo: CurrencyInfo | undefined
}): PlainMessage<AuctionWithStats>['auction'] {
  if (auction === undefined) {
    return undefined
  }

  return {
    ...toPlainMessage(auction),
    tokenName: currencyInfo?.currency.name ?? auction.tokenName,
    tokenSymbol: currencyInfo?.currency.symbol ?? auction.tokenSymbol,
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

  // Build a lookup map from currencyId → currencyInfo to avoid index misalignment
  // (currencyIds filters out null-auction entries, so its indices don't match topAuctions.auctions)
  const currencyInfoByCurrencyId = useMemo(() => {
    const map = new Map<string, (typeof currencyInfos)[number]>()
    currencyIds.forEach((id, i) => {
      if (currencyInfos[i]) {
        map.set(id, currencyInfos[i])
      }
    })
    return map
  }, [currencyIds, currencyInfos])

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

        const preBidEndBlock = computePreBidEndBlock(auction.parsedAuctionSteps, auction.startBlock)
        if (preBidEndBlock && preBidEndBlock !== auction.startBlock) {
          requests.push({
            chainId: auction.chainId,
            blockNumber: preBidEndBlock,
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
      .map((auction) => {
        const coreAuction = auction.auction
        const currencyId = getAuctionCurrencyId(coreAuction)
        const currencyInfo = currencyId ? currencyInfoByCurrencyId.get(currencyId) : undefined

        // Image precedence (mirrors the auction detail page): curated config override logo
        // (authoritative) -> creator-uploaded API image -> indexed currency logo -> TokenLogo
        // placeholder. Centralized here so the table cell and chip stay consistent.
        const overrideLogo = getAuctionOverrideLogo(coreAuction)
        const timeRemaining = getAuctionTimeRemaining({ auction: coreAuction, blocksByChain, getBlockTimestamp })
        const auctionWithCurrency = getAuctionWithCurrencyInfo({ auction: coreAuction, currencyInfo })

        return {
          ...auction,
          verified: coreAuction ? verifiedSet.has(coreAuction.auctionId) : false,
          // `||` (not `??`) so an empty-string API image is treated as absent and doesn't
          // suppress the override / indexed logo, independent of the backend's unset-vs-"".
          logoUrl: overrideLogo || coreAuction?.tokenImageUrl || currencyInfo?.logoUrl,
          timeRemaining,
          auction: auctionWithCurrency,
        }
      })
      .filter((auctionWithInfo) => {
        // TEMP: hide abandoned auctions (see HIDDEN_AUCTION_IDS) pending backend ListTopAuctions exclusion
        const auctionId = auctionWithInfo.auction?.auctionId
        if (auctionId && HIDDEN_AUCTION_IDS.has(auctionId)) {
          return false
        }
        // Filter out testnet chains when testnet mode is not enabled
        // oxlint-disable-next-line no-shadow
        const chainId = auctionWithInfo.auction?.chainId
        return chainId !== undefined && (isTestnetModeEnabled || !isTestnetChain(chainId))
      })
  }, [
    mergedAuctions,
    verifiedAuctionIds,
    isTestnetModeEnabled,
    getBlockTimestamp,
    currencyInfoByCurrencyId,
    blocksByChain,
  ])

  return {
    auctions: auctionsWithCurrencyInfo,
    isLoading: isLoading || verifiedFallbackLoading || !areBlocksLoaded,
    isError,
  }
}
