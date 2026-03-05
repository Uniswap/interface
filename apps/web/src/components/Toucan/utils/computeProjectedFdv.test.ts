import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { Q96 } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import {
  computeCompletedAuctionMarketFdvUsd,
  computeProjectedFdvTableValue,
} from '~/components/Toucan/utils/computeProjectedFdv'
import type { AuctionWithCurrencyInfo } from '~/state/explore/topAuctions/useTopAuctions'

function createAuctionWithCurrencyInfo({
  tokenTotalSupply = '2500000',
  totalSupply = '2500000',
  clearingPrice = Q96.toString(),
  floorPrice = '0',
  auctionTokenDecimals,
}: {
  tokenTotalSupply?: string
  totalSupply?: string
  clearingPrice?: string
  floorPrice?: string
  auctionTokenDecimals?: number
}): AuctionWithCurrencyInfo {
  return {
    auction: {
      tokenTotalSupply,
      totalSupply,
      clearingPrice,
      floorPrice,
    },
    currencyInfo:
      auctionTokenDecimals === undefined
        ? undefined
        : ({
            currency: {
              decimals: auctionTokenDecimals,
              symbol: 'AUCT',
            },
          } as Maybe<CurrencyInfo>),
    verified: false,
  } as unknown as AuctionWithCurrencyInfo
}

const bidTokenCurrencyInfo = {
  currency: {
    decimals: 6,
    symbol: 'USDC',
  },
} as Maybe<CurrencyInfo>

describe('computeProjectedFdvTableValue', () => {
  it('uses auction token market price for completed auctions even without bid token currency info', () => {
    const result = computeProjectedFdvTableValue({
      auction: createAuctionWithCurrencyInfo({
        tokenTotalSupply: '2000000000000000000',
        auctionTokenDecimals: 18,
      }),
      bidTokenCurrencyInfo: undefined,
      bidTokenUsdPrice: undefined,
      auctionTokenUsdPrice: 3.5,
      isCompleted: true,
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
      }),
      bidTokenCurrencyInfo,
      bidTokenUsdPrice: 1,
      auctionTokenUsdPrice: 3.5,
      isCompleted: true,
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
      }),
      bidTokenCurrencyInfo,
      bidTokenUsdPrice: 1,
      auctionTokenUsdPrice: 3.5,
      isCompleted: true,
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
      }),
      bidTokenCurrencyInfo,
      bidTokenUsdPrice: 2,
      isCompleted: true,
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
      }),
      bidTokenCurrencyInfo,
      bidTokenUsdPrice: 2,
      auctionTokenUsdPrice: 999,
      isCompleted: false,
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
      }),
      bidTokenCurrencyInfo,
      bidTokenUsdPrice: 2,
      auctionTokenUsdPrice: 0,
      isCompleted: true,
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
