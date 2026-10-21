import { GetAuctionRequest } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { auctionQueries } from 'uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries'
import { AuctionStaleTime } from 'uniswap/src/data/apiClients/dataApiService/auctions/queryTypes'
import { getTdpAuctionQueryOptions, getTdpAuctionRequest } from '~/pages/TokenDetails/tdpAuctionQueryOptions'

const TOKEN_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const NORMALIZED_TOKEN_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

describe('TDP auction query options', () => {
  it('shares the normalized token lookup key and stale time with navigation prefetch', () => {
    const params = getTdpAuctionRequest({ chainId: UniverseChainId.Mainnet, tokenAddress: TOKEN_ADDRESS })
    const options = getTdpAuctionQueryOptions({ params, enabled: true })

    expect(params?.address).toBe(NORMALIZED_TOKEN_ADDRESS)
    expect(options.queryKey).toEqual(
      auctionQueries.getAuction({
        params: new GetAuctionRequest({ chainId: UniverseChainId.Mainnet, address: NORMALIZED_TOKEN_ADDRESS }),
      }).queryKey,
    )
    expect(options.staleTime).toBe(AuctionStaleTime.SLOW)
    expect(options.enabled).toBe(true)
  })

  it.each([
    ['native token', UniverseChainId.Mainnet, TOKEN_ADDRESS, true],
    ['non-EVM chain', UniverseChainId.Solana, TOKEN_ADDRESS, false],
    ['invalid address', UniverseChainId.Mainnet, 'invalid', false],
  ])('does not enable a lookup for a %s', (_label, chainId, tokenAddress, isNative) => {
    const params = getTdpAuctionRequest({ chainId, tokenAddress, isNative })

    expect(params).toBeUndefined()
    expect(getTdpAuctionQueryOptions({ params, enabled: true }).enabled).toBe(false)
  })

  it('does not retain a token query key when disabled', () => {
    const params = getTdpAuctionRequest({ chainId: UniverseChainId.Mainnet, tokenAddress: TOKEN_ADDRESS })
    const options = getTdpAuctionQueryOptions({ params, enabled: false })

    expect(options.enabled).toBe(false)
    expect(options.queryKey).toEqual(auctionQueries.getAuction({ params: undefined }).queryKey)
  })
})
