import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { GetTokenResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { areEvmAddressesEqual, normalizeTokenAddressForCache, type UniverseChainId } from '@universe/chains'
import { useEffect } from 'react'
import { getGetTokenQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { logger } from 'utilities/src/logger/logger'
import { useAuctionTradingToken } from '~/features/Toucan/Auction/hooks/useAuctionTradingToken'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'

/** Trading surfaces use the underlying token's identity; bids and claims keep the receipt. */
export function useAuctionTradingTokenInfo({ enabled }: { enabled: boolean }): {
  address: string | undefined
  symbol: string | undefined
  logoUrl: string | undefined
  loading: boolean
} {
  const auction = useAuctionStore((state) => state.auctionDetails)
  const chainId = auction?.chainId
  const { tradingTokenAddress, loading } = useAuctionTradingToken({
    chainId,
    tokenAddress: auction?.tokenAddress,
    enabled,
  })
  const isUnderlying = Boolean(
    auction && tradingTokenAddress && !areEvmAddressesEqual(tradingTokenAddress, auction.tokenAddress),
  )
  const metadataEnabled = enabled && isUnderlying
  const tokenQuery = useQuery(
    getGetTokenQueryOptions({
      params: auction && tradingTokenAddress ? { chainId: auction.chainId, address: tradingTokenAddress } : undefined,
      enabled: metadataEnabled,
      keepPreviousData: false,
    }),
  )
  useWarnOnMetadataFailure({ chainId, tradingTokenAddress, enabled: metadataEnabled, tokenQuery })

  return {
    address: tradingTokenAddress,
    symbol: isUnderlying ? tokenQuery.data?.token?.symbol : (auction?.token?.currency.symbol ?? auction?.tokenSymbol),
    logoUrl: isUnderlying
      ? tokenQuery.data?.token?.project?.logoUrl
      : (auction?.token?.logoUrl ?? auction?.tokenImageUrl),
    loading: loading || (isUnderlying && tokenQuery.isLoading && !tokenQuery.isFetched),
  }
}

/** The query is cached per token, so a failed refetch of the same token never re-enters the error state: one warning per token. */
function useWarnOnMetadataFailure({
  chainId,
  tradingTokenAddress,
  enabled,
  tokenQuery,
}: {
  chainId: UniverseChainId | undefined
  tradingTokenAddress: string | undefined
  enabled: boolean
  tokenQuery: Pick<UseQueryResult<PlainMessage<GetTokenResponse>>, 'isError' | 'data'>
}): void {
  // A retained token from before a failed background refresh is still usable, so it is not a failure.
  const failed = enabled && tokenQuery.isError && !tokenQuery.data?.token
  const failureKey =
    failed && chainId && tradingTokenAddress
      ? `${chainId}:${normalizeTokenAddressForCache(tradingTokenAddress)}`
      : undefined
  useEffect(() => {
    if (!failureKey) {
      return
    }
    logger.warn(
      'useAuctionTradingTokenInfo',
      'useAuctionTradingTokenInfo',
      'Failed to load underlying auction trading token metadata',
      { chainId },
    )
  }, [chainId, failureKey])
}
