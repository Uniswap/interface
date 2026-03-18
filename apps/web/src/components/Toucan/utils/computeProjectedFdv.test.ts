import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { Q96 } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import {
  computeCompletedAuctionMarketFdvUsd,
  computeProjectedFdvTableValue,
} from '~/components/Toucan/utils/computeProjectedFdv'
import type { EnrichedAuction } from '~/state/explore/topAuctions/useTopAuctions'

function createAuctionWithCurrencyInfo({
  tokenTotalSupply = '2500000',
  totalSupply = '2500000',
  clearingPrice = Q96.toString(),
  floorPrice = '0',
  auctionTokenDecimals,
  currencyTokenDecimals = 6, // USDC has 6 decimals
  currencyPriceUsd,
  isCompleted = false,
}: {
  tokenTotalSupply?: string
  totalSupply?: string
  clearingPrice?: string
  floorPrice?: string
  auctionTokenDecimals?: number
  currencyTokenDecimals?: number
  currencyPriceUsd?: string
  isCompleted?: boolean
}): EnrichedAuction {
  return {
    auction: {
      tokenTotalSupply,
      totalSupply,
      clearingPrice,
      floorPrice,
      tokenDecimals: auctionTokenDecimals,
      tokenSymbol: 'AUCT',
      currencyTokenDecimals,
      currencyTokenSymbol: 'USDC',
      currencyPriceUsd,
    },
    verified: false,
    timeRemaining: {
      isCompleted,
      startBlockTimestamp: undefined,
      endBlockTimestamp: undefined,
    },
  } as unknown as EnrichedAuction
}

describe('computeProjectedFdvTableValue', () => {
  it('uses auction token market price for completed auctions even without bid token currency info', () => {
    const result = computeProjectedFdvTableValue({
      auction: createAuctionWithCurrencyInfo({
        tokenTotalSupply: '2000000000000000000',
        auctionTokenDecimals: 18,
        isCompleted: true,
      }),
      auctionTokenUsdPrice: 3.5,
    })

    expect(result.raw).toBe(0n)
    expect(result.formattedBidToken).toBe('—')
    expect(result.usd).toBeCloseTo(7, 5)
  })

  it('uses auction token market price for completed auctions when decimals are available', () => {
    const result = computeProjectedFdvTableValue({
      auction: createAuctionWithCurrencyInfo({
        tokenTotalSupply: '2000000000000000000',
        auctionTokenDecimals: 18,
        isCompleted: true,
      }),
      auctionTokenUsdPrice: 3.5,
    })

    expect(result.raw).toBe(0n)
    expect(result.formattedBidToken).toBe('—')
    expect(result.usd).toBeCloseTo(7, 5)
  })

  it('returns conservative fallback for completed auctions when auction token decimals are unavailable', () => {
    const result = computeProjectedFdvTableValue({
      auction: createAuctionWithCurrencyInfo({
        tokenTotalSupply: '2000000000000000000',
        auctionTokenDecimals: undefined,
        isCompleted: true,
      }),
      auctionTokenUsdPrice: 3.5,
    })

    expect(result).toEqual({
      raw: 0n,
      usd: undefined,
      formattedBidToken: '—',
    })
  })

  it('falls back to clearing price path for completed auctions when market price is unavailable', () => {
    const result = computeProjectedFdvTableValue({
      auction: createAuctionWithCurrencyInfo({
        tokenTotalSupply: '2500000',
        clearingPrice: Q96.toString(),
        auctionTokenDecimals: 18,
        currencyPriceUsd: '2',
        isCompleted: true,
      }),
    })

    expect(result.raw).toBe(2500000n)
    expect(result.formattedBidToken).toBe('2.5 USDC')
    expect(result.usd).toBe(5)
  })

  it('uses clearing price path for active auctions even when auction token market price is available', () => {
    const result = computeProjectedFdvTableValue({
      auction: createAuctionWithCurrencyInfo({
        tokenTotalSupply: '2500000',
        clearingPrice: Q96.toString(),
        auctionTokenDecimals: 18,
        currencyPriceUsd: '2',
        isCompleted: false,
      }),
      auctionTokenUsdPrice: 999,
    })

    expect(result.raw).toBe(2500000n)
    expect(result.formattedBidToken).toBe('2.5 USDC')
    expect(result.usd).toBe(5)
  })

  it('handles zero-valued auction token market prices for completed auctions', () => {
    const result = computeProjectedFdvTableValue({
      auction: createAuctionWithCurrencyInfo({
        tokenTotalSupply: '2000000000000000000',
        auctionTokenDecimals: 18,
        isCompleted: true,
      }),
      auctionTokenUsdPrice: 0,
    })

    expect(result.raw).toBe(0n)
    expect(result.formattedBidToken).toBe('—')
    expect(result.usd).toBe(0)
  })
})

describe('computeCompletedAuctionMarketFdvUsd', () => {
  it('returns undefined when decimals are unavailable', () => {
    expect(
      computeCompletedAuctionMarketFdvUsd({
        totalSupplyRaw: '2000000000000000000',
        auctionTokenDecimals: undefined,
        auctionTokenUsdPrice: 3.5,
      }),
    ).toBeUndefined()
  })

  it('computes USD value from total supply and market price', () => {
    expect(
      computeCompletedAuctionMarketFdvUsd({
        totalSupplyRaw: '2000000000000000000',
        auctionTokenDecimals: 18,
        auctionTokenUsdPrice: 3.5,
      }),
    ).toBeCloseTo(7, 5)
  })
})
