import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { Q96 } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import {
  computeCompletedAuctionMarketFdvUsd,
  computeProjectedFdvTableValue,
} from '~/features/Toucan/utils/computeProjectedFdv'

function createAuctionWithCurrencyInfo({
  tokenTotalSupply = '2500000',
  totalSupply = '2500000',
  clearingPrice = Q96.toString(),
  floorPrice = '0',
  auctionTokenDecimals,
  auctionTokenSymbol = 'AUCT',
  currencyTokenDecimals = 6, // USDC has 6 decimals
  currencyPriceUsd,
  isCompleted = false,
}: {
  tokenTotalSupply?: string
  totalSupply?: string
  clearingPrice?: string
  floorPrice?: string
  auctionTokenDecimals?: number
  auctionTokenSymbol?: string
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
      tokenSymbol: auctionTokenSymbol,
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

  it('returns conservative fallback for corrupt token metadata (decimals=0 with empty name/symbol)', () => {
    const result = computeProjectedFdvTableValue({
      auction: createAuctionWithCurrencyInfo({
        tokenTotalSupply: '2000000000000000000',
        auctionTokenDecimals: 0,
        auctionTokenSymbol: '',
        isCompleted: true,
      }),
      auctionTokenUsdPrice: 3.5,
    })

    // Never computes FDV from a raw un-scaled supply
    expect(result).toEqual({
      raw: 0n,
      usd: undefined,
      formattedBidToken: '—',
    })
  })

  it('keeps a legitimate 0-decimals token (real symbol) computing normally', () => {
    const result = computeProjectedFdvTableValue({
      auction: createAuctionWithCurrencyInfo({
        tokenTotalSupply: '2',
        auctionTokenDecimals: 0,
        auctionTokenSymbol: 'ZERO',
        isCompleted: true,
      }),
      auctionTokenUsdPrice: 3.5,
    })

    expect(result.usd).toBeCloseTo(7, 5)
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
