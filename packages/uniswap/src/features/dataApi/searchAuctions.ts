import type { PlainMessage } from '@bufbuild/protobuf'
import { AuctionLifecycle, type SearchAuction } from '@uniswap/client-data-api/dist/data/v2/search_pb'
import type { AuctionWithStats } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { type UniverseChainId, Platform } from '@universe/chains'
import { useMemo } from 'react'
import { type AuctionOption, OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { timestampToMs } from 'uniswap/src/data/apiClients/dataApiService/utils/protoTimestamp'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { getAuctionLaunchMethod, toLaunchProvenance } from 'uniswap/src/features/dataApi/launchProvenance'
import type { AuctionSearchStats, CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { getAuctionMetadata } from 'uniswap/src/features/toucan/auctionMetadata'
import { isHiddenAuction } from 'uniswap/src/features/toucan/hiddenAuctions'
import { useVerifiedAuctionIds } from 'uniswap/src/features/toucan/useVerifiedAuctionIds'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { parseFiniteNumber } from 'utilities/src/primitives/number'

/** Plain data.v2 auction shape, the canonical type for search auction results. */
export type SearchAuctionResult = PlainMessage<SearchAuction>

function isEndedLifecycle(lifecycle: AuctionLifecycle): boolean {
  return lifecycle === AuctionLifecycle.GRADUATED || lifecycle === AuctionLifecycle.FAILED
}

function lowercaseAscii(value: string): string {
  return value.replace(/[A-Z]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 32))
}

function getValidEvmAddress(address: string | undefined): string | undefined {
  if (!address) {
    return undefined
  }

  const trimmedAddress = address.trim()
  const addressWithPrefix =
    trimmedAddress.startsWith('0x') || trimmedAddress.startsWith('0X') ? trimmedAddress : `0x${trimmedAddress}`

  return addressWithPrefix.length === 42 ? lowercaseAscii(addressWithPrefix) : undefined
}

function getAuctionAddressFromAuctionId(auctionId: string): string | undefined {
  const [chainId, auctionAddress, extraSegment] = auctionId.split('_')
  if (!chainId || !auctionAddress || extraSegment) {
    return undefined
  }

  return getValidEvmAddress(auctionAddress)
}

function getSearchAuctionAddress(auction: SearchAuctionResult): string {
  const auctionAddress = getValidEvmAddress(auction.auctionAddress)
  if (auctionAddress) {
    return auctionAddress
  }

  return getAuctionAddressFromAuctionId(auction.auctionId) ?? ''
}

export function buildCurrencyInfoMap(
  currencyIds: string[],
  currencyInfos: Array<Maybe<CurrencyInfo>>,
): Map<string, CurrencyInfo> {
  const map = new Map<string, CurrencyInfo>()
  currencyIds.forEach((id, index) => {
    const info = currencyInfos[index]
    if (info) {
      map.set(id, info)
    }
  })
  return map
}

function toAuctionSearchStats({
  totalBidVolumeUsd,
  estimatedStartTime,
  estimatedEndTime,
  isEnded,
  isUpcoming,
}: Pick<SearchAuctionResult, 'estimatedStartTime' | 'estimatedEndTime'> & {
  totalBidVolumeUsd: string | undefined
  isEnded: boolean
  isUpcoming?: boolean
}): AuctionSearchStats | undefined {
  const stats = {
    committedVolumeUsd: parseFiniteNumber(totalBidVolumeUsd),
    startTimeMs: timestampToMs(estimatedStartTime),
    endTimeMs: timestampToMs(estimatedEndTime),
    isEnded: isEnded || undefined,
    isUpcoming: isUpcoming || undefined,
  }
  return Object.values(stats).every((value) => value === undefined) ? undefined : stats
}

function getAuctionOptionTokenMetadata({
  chainId,
  tokenAddress,
  tokenName,
  tokenSymbol,
  currencyInfo,
}: {
  chainId: number
  tokenAddress: string
  tokenName: string | undefined
  tokenSymbol: string
  currencyInfo: Maybe<CurrencyInfo>
}): Pick<AuctionOption, 'tokenName' | 'tokenSymbol' | 'tokenLogoUrl'> {
  const metadataOverride = getAuctionMetadata({ chainId, tokenAddress })

  return {
    tokenName: metadataOverride?.tokenName || currencyInfo?.currency.name || tokenName || undefined,
    tokenSymbol: metadataOverride?.tokenSymbol || currencyInfo?.currency.symbol || tokenSymbol,
    tokenLogoUrl: metadataOverride?.logoUrl || currencyInfo?.logoUrl || undefined,
  }
}

export function searchAuctionToAuctionOption({
  auction,
  currencyInfo,
  isVerified,
}: {
  auction: SearchAuctionResult
  currencyInfo: Maybe<CurrencyInfo>
  isVerified: boolean
}): AuctionOption {
  const tokenMetadata = getAuctionOptionTokenMetadata({
    chainId: auction.chainId,
    tokenAddress: auction.tokenAddress,
    tokenName: auction.tokenName,
    tokenSymbol: auction.tokenSymbol,
    currencyInfo,
  })

  return {
    type: OnchainItemListOptionType.Auction,
    auctionId: auction.auctionId,
    auctionAddress: getSearchAuctionAddress(auction),
    chainId: auction.chainId as UniverseChainId,
    tokenAddress: auction.tokenAddress,
    ...tokenMetadata,
    currencyInfo,
    committedVolumeUsd: parseFiniteNumber(auction.totalBidVolumeUsd),
    uniqueBidderCount: auction.bidderCount,
    launchMethod: toLaunchProvenance({ provenance: auction.launchProvenance })?.method,
    isVerified,
    searchStats: toAuctionSearchStats({
      totalBidVolumeUsd: auction.totalBidVolumeUsd,
      estimatedStartTime: auction.estimatedStartTime,
      estimatedEndTime: auction.estimatedEndTime,
      isEnded: isEndedLifecycle(auction.lifecycle),
      isUpcoming: auction.lifecycle === AuctionLifecycle.UPCOMING,
    }),
  }
}

export function auctionWithStatsToAuctionOption({
  auctionWithStats,
  currencyInfo,
  isVerified,
  isEnded,
}: {
  auctionWithStats: AuctionWithStats | PlainMessage<AuctionWithStats>
  currencyInfo: Maybe<CurrencyInfo>
  isVerified: boolean
  isEnded: boolean
}): AuctionOption | undefined {
  const auction = auctionWithStats.auction
  if (!auction) {
    return undefined
  }

  const tokenMetadata = getAuctionOptionTokenMetadata({
    chainId: auction.chainId,
    tokenAddress: auction.tokenAddress,
    tokenName: auction.tokenName,
    tokenSymbol: auction.tokenSymbol,
    currencyInfo,
  })

  return {
    type: OnchainItemListOptionType.Auction,
    auctionId: auction.auctionId,
    auctionAddress: auction.address,
    chainId: auction.chainId as UniverseChainId,
    tokenAddress: auction.tokenAddress,
    ...tokenMetadata,
    currencyInfo,
    committedVolumeUsd: parseFiniteNumber(auction.totalBidVolumeUsd),
    uniqueBidderCount: auctionWithStats.uniqueBidderCount,
    launchMethod: getAuctionLaunchMethod({ auction }),
    isVerified,
    searchStats: toAuctionSearchStats({
      totalBidVolumeUsd: auction.totalBidVolumeUsd,
      estimatedStartTime: auction.estimatedStartTime,
      estimatedEndTime: auction.estimatedEndTime,
      isEnded,
    }),
  }
}

/**
 * Turns the auction bucket of a search response into row options: drops testnet rows outside testnet mode, and
 * enriches with CurrencyInfo and the verified-auction config. The search request itself is made by
 * `useSearchResults`; the BE indexes curated display names, so override names match there.
 *
 * `alongsideTokens` (All tab): only in-flight auctions show.
 */
export function useSearchAuctionOptions({
  auctions,
  alongsideTokens,
  skip,
}: {
  auctions: SearchAuctionResult[] | undefined
  alongsideTokens: boolean
  skip: boolean
}): AuctionOption[] {
  const { isTestnetModeEnabled } = useEnabledChains({ platform: Platform.EVM })

  const verifiedAuctionIds = useVerifiedAuctionIds()

  const filteredAuctions = useMemo(() => {
    if (skip) {
      return []
    }
    return (auctions ?? []).filter(
      (auction) =>
        (!alongsideTokens || !isEndedLifecycle(auction.lifecycle)) &&
        (isTestnetModeEnabled || !isTestnetChain(auction.chainId)) &&
        !isHiddenAuction({ auctionId: auction.auctionId }),
    )
  }, [skip, auctions, alongsideTokens, isTestnetModeEnabled])

  // Enrich with currencyInfos for logos and safety info
  const currencyIds = useMemo(
    () => filteredAuctions.map((auction) => buildCurrencyId(auction.chainId, auction.tokenAddress)),
    [filteredAuctions],
  )

  const currencyInfos = useCurrencyInfos(currencyIds, {
    skip: !filteredAuctions.length,
  })

  const currencyInfoMap = useMemo(() => buildCurrencyInfoMap(currencyIds, currencyInfos), [currencyIds, currencyInfos])

  return useMemo<AuctionOption[]>(() => {
    if (!filteredAuctions.length) {
      return []
    }

    const verifiedSet = new Set(verifiedAuctionIds)

    return filteredAuctions.map((auction) => {
      const cId = buildCurrencyId(auction.chainId, auction.tokenAddress)
      return searchAuctionToAuctionOption({
        auction,
        currencyInfo: currencyInfoMap.get(cId) ?? null,
        isVerified: verifiedSet.has(auction.auctionId),
      })
    })
  }, [filteredAuctions, currencyInfoMap, verifiedAuctionIds])
}
