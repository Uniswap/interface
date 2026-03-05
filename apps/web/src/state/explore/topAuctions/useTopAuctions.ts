import { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import { AuctionWithStats, ListTopAuctionsRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { DynamicConfigs, useDynamicConfigValue, VerifiedAuctionsConfigKey } from '@universe/gating'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { DEFAULT_VERIFIED_AUCTION_IDS } from '~/components/Toucan/Config/config'
import useDebounce from '~/hooks/useDebounce'
import { useMultiChainBlockNumbers } from '~/hooks/useMultiChainBlockNumbers'
import {
  AuctionStatusFilter,
  AuctionVerificationFilter,
  useExploreTablesFilterStore,
} from '~/pages/Explore/exploreTablesFilterStore'
import { EXPLORE_API_PAGE_SIZE } from '~/state/explore/constants'
import { isAuctionCompleted } from '~/state/explore/topAuctions/isAuctionCompleted'
import { useChainIdFromUrlParam } from '~/utils/chainParams'

export type AuctionWithCurrencyInfo = PlainMessage<AuctionWithStats> & {
  currencyInfo: Maybe<CurrencyInfo>
  verified: boolean
}

/**
 * Filters auctions by search string (token name, symbol, address, auction ID)
 */
function filterAuctionsBySearchString(
  auctions: readonly AuctionWithCurrencyInfo[],
  filterString: string,
): AuctionWithCurrencyInfo[] {
  if (!filterString.trim()) {
    return [...auctions]
  }

  const lowercaseFilter = filterString.trim().toLowerCase()

  return auctions.filter((auctionWithCurrencyInfo) => {
    const auction = auctionWithCurrencyInfo.auction
    if (!auction) {
      return false
    }

    const symbolMatch = auction.tokenSymbol.toLowerCase().includes(lowercaseFilter)
    const addressMatch = normalizeTokenAddressForCache(auction.tokenAddress).toLowerCase().includes(lowercaseFilter)
    const auctionIdMatch = auction.auctionId.toLowerCase().includes(lowercaseFilter)
    const nameMatch = auctionWithCurrencyInfo.currencyInfo?.currency.name?.toLowerCase().includes(lowercaseFilter)

    return symbolMatch || addressMatch || auctionIdMatch || nameMatch
  })
}

/**
 * Filters auctions by verification and status
 */
function filterAuctionsByVerificationAndStatus(
  auctions: readonly AuctionWithCurrencyInfo[],
  options: {
    verificationFilter: AuctionVerificationFilter
    statusFilter: AuctionStatusFilter
    verifiedAuctionIds: Set<string>
    blocksByChain: Map<number, bigint>
  },
): AuctionWithCurrencyInfo[] {
  return auctions.filter((auctionWithCurrencyInfo) => {
    const auction = auctionWithCurrencyInfo.auction
    if (!auction) {
      return false
    }

    const isVerified = options.verifiedAuctionIds.has(auction.auctionId)
    const isCompleted = isAuctionCompleted({
      endBlock: auction.endBlock,
      blockNumber: options.blocksByChain.get(auction.chainId),
    })

    // Apply verification filter
    if (options.verificationFilter === AuctionVerificationFilter.Verified && !isVerified) {
      return false
    }
    if (options.verificationFilter === AuctionVerificationFilter.Unverified && isVerified) {
      return false
    }

    // Apply status filter
    if (options.statusFilter === AuctionStatusFilter.Active && isCompleted) {
      return false
    }
    if (options.statusFilter === AuctionStatusFilter.Complete && !isCompleted) {
      return false
    }

    return true
  })
}

/**
 * Hook that fetches and filters top auctions with chain and search filtering.
 *
 * - Chain filtering: Backend (via ListTopAuctionsRequest chainIds parameter)
 * - Search filtering: Client-side (by token name, symbol, address, and auction ID)
 * - Type filtering: Client-side (by verified, unverified, or completed status)
 */
export function useTopAuctions(): {
  auctions: AuctionWithCurrencyInfo[]
  isLoading: boolean
  isError: boolean
} {
  const chainId = useChainIdFromUrlParam()
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const debouncedFilterString = useDebounce(filterString, 300)
  const verificationFilter = useExploreTablesFilterStore((s) => s.verificationFilter)
  const statusFilter = useExploreTablesFilterStore((s) => s.statusFilter)
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

  const auctionsWithCurrencyInfo = useMemo<AuctionWithCurrencyInfo[]>(() => {
    if (!topAuctions?.auctions) {
      return []
    }

    const verifiedSet = new Set(verifiedAuctionIds)

    return topAuctions.auctions
      .map((auction, index) => ({
        ...auction,
        currencyInfo: currencyInfos[index],
        verified: auction.auction ? verifiedSet.has(auction.auction.auctionId) : false,
      }))
      .filter((auctionWithInfo) => {
        // Filter out testnet chains when testnet mode is not enabled
        const chainId = auctionWithInfo.auction?.chainId
        return chainId !== undefined && (isTestnetModeEnabled || !isTestnetChain(chainId))
      })
  }, [topAuctions?.auctions, currencyInfos, verifiedAuctionIds, isTestnetModeEnabled])

  // Extract unique chain IDs from auctions to minimize RPC calls
  const auctionChainIds = useMemo(
    () =>
      new Set(
        auctionsWithCurrencyInfo
          .map((a) => a.auction?.chainId)
          .filter((id): id is EVMUniverseChainId => id !== undefined),
      ),
    [auctionsWithCurrencyInfo],
  )

  // Fetch current block numbers only for chains that have auctions
  const blocksByChain = useMultiChainBlockNumbers(auctionChainIds)

  // Apply search filter first
  const searchFiltered = useMemo(
    () => filterAuctionsBySearchString(auctionsWithCurrencyInfo, debouncedFilterString),
    [auctionsWithCurrencyInfo, debouncedFilterString],
  )

  // Apply verification and status filters after search filter
  const filteredAuctions = useMemo(
    () =>
      filterAuctionsByVerificationAndStatus(searchFiltered, {
        verificationFilter,
        statusFilter,
        verifiedAuctionIds: new Set(verifiedAuctionIds),
        blocksByChain,
      }),
    [searchFiltered, verificationFilter, statusFilter, verifiedAuctionIds, blocksByChain],
  )

  return {
    auctions: filteredAuctions,
    isLoading,
    isError,
  }
}
