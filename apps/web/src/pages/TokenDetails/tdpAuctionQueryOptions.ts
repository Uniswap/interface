import { GetAuctionRequest } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { getValidAddress, isEVMChain, type UniverseChainId } from '@universe/chains'
import { auctionQueries } from 'uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries'
import { AuctionStaleTime } from 'uniswap/src/data/apiClients/dataApiService/auctions/queryTypes'

export function getTdpAuctionRequest({
  chainId,
  tokenAddress,
  isNative = false,
}: {
  chainId: UniverseChainId
  tokenAddress: string
  isNative?: boolean
}): GetAuctionRequest | undefined {
  const address = isEVMChain(chainId) && !isNative ? getValidAddress({ address: tokenAddress, chainId }) : null
  return address === null ? undefined : new GetAuctionRequest({ chainId, address })
}

export function getTdpAuctionQueryOptions({
  params,
  enabled,
}: {
  params: GetAuctionRequest | undefined
  enabled: boolean
}): ReturnType<typeof auctionQueries.getAuction> {
  const queryEnabled = enabled && params !== undefined
  return auctionQueries.getAuction({
    params: queryEnabled ? params : undefined,
    enabled: queryEnabled,
    // Share the TDP cache window with navigation prefetch.
    staleTime: AuctionStaleTime.SLOW,
  })
}
