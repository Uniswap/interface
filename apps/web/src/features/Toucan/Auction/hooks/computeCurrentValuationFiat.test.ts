import { Q96 } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { computeCompletedAuctionValuationFiat } from '~/features/Toucan/Auction/hooks/computeCompletedAuctionValuationFiat'
import {
  computeCurrentValuationFiatFormatted,
  computeCurrentValuationUsd,
} from '~/features/Toucan/Auction/hooks/computeCurrentValuationFiat'
import { AuctionProgressState, BidTokenInfo } from '~/features/Toucan/Auction/store/types'

const USDC: BidTokenInfo = {
  symbol: 'USDC',
  decimals: 6,
  priceFiat: 1,
  isStablecoin: true,
  logoUrl: null,
}

// priceQ96 = Q96 means 1 bid-token raw unit per auction-token raw unit, so the
// valuation in bid-token raw units equals totalSupplyRaw: 2_500_000 raw = 2.5 USDC.
const BASE_PARAMS = {
  totalSupplyRaw: '2500000',
  auctionTokenDecimals: 18,
  clearingPriceQ96: Q96.toString(),
  bidTokenInfo: USDC,
}

describe('computeCompletedAuctionValuationFiat', () => {
  it('converts the launch valuation with the launch-time bid token price', () => {
    expect(
      computeCompletedAuctionValuationFiat({
        ...BASE_PARAMS,
        launchBidTokenPriceUsd: 2,
      }),
    ).toBeCloseTo(5, 9)
  })

  it('returns undefined without a launch-time bid token price instead of using the auction token market FDV', () => {
    // Regression (LP-821): this used to fall back to totalSupply x current auction
    // token market price, pairing a launch-time bid token amount with a post-launch
    // fiat value (e.g. "111M USDC" next to "$16.5M").
    expect(
      computeCompletedAuctionValuationFiat({
        ...BASE_PARAMS,
        launchBidTokenPriceUsd: undefined,
      }),
    ).toBeUndefined()
  })

  it('returns undefined without bid token info', () => {
    expect(
      computeCompletedAuctionValuationFiat({
        ...BASE_PARAMS,
        bidTokenInfo: undefined,
        launchBidTokenPriceUsd: 2,
      }),
    ).toBeUndefined()
  })

  it('handles realistic supplies beyond Number.MAX_SAFE_INTEGER without precision loss', () => {
    // 1B tokens (18 decimals, raw 1e27) at 1e-6 WETH each = 1000 WETH; x $2500 = $2.5M.
    expect(
      computeCompletedAuctionValuationFiat({
        totalSupplyRaw: (10n ** 27n).toString(),
        auctionTokenDecimals: 18,
        clearingPriceQ96: (Q96 / 10n ** 6n).toString(),
        bidTokenInfo: { symbol: 'WETH', decimals: 18, priceFiat: 2500, isStablecoin: false, logoUrl: null },
        launchBidTokenPriceUsd: 2500,
      }),
    ).toBeCloseTo(2_500_000, 3)
  })
})

describe('computeCurrentValuationUsd', () => {
  it('uses the launch-time bid token price for ended auctions even when a current price is available', () => {
    expect(
      computeCurrentValuationUsd({
        ...BASE_PARAMS,
        auctionProgressState: AuctionProgressState.ENDED,
        launchBidTokenPriceUsdRaw: '2',
        bidTokenMarketPriceUsd: 999,
      }),
    ).toBeCloseTo(5, 9)
  })

  it('falls back to the current bid token price applied to the same launch valuation for ended auctions', () => {
    // The fallback keeps both stat lines on the same bid-token valuation basis (LP-821).
    expect(
      computeCurrentValuationUsd({
        ...BASE_PARAMS,
        auctionProgressState: AuctionProgressState.ENDED,
        launchBidTokenPriceUsdRaw: undefined,
        bidTokenMarketPriceUsd: 3,
      }),
    ).toBeCloseTo(7.5, 9)
  })

  it('falls back to bidTokenInfo.priceFiat when no market price is available', () => {
    expect(
      computeCurrentValuationUsd({
        ...BASE_PARAMS,
        bidTokenInfo: { ...USDC, priceFiat: 4 },
        auctionProgressState: AuctionProgressState.ENDED,
        launchBidTokenPriceUsdRaw: undefined,
        bidTokenMarketPriceUsd: undefined,
      }),
    ).toBeCloseTo(10, 9)
  })

  it('returns undefined when no usable bid token price exists', () => {
    expect(
      computeCurrentValuationUsd({
        ...BASE_PARAMS,
        bidTokenInfo: { ...USDC, priceFiat: 0 },
        auctionProgressState: AuctionProgressState.ENDED,
        launchBidTokenPriceUsdRaw: undefined,
        bidTokenMarketPriceUsd: undefined,
      }),
    ).toBeUndefined()
  })

  it('ignores the launch price for in-progress auctions', () => {
    expect(
      computeCurrentValuationUsd({
        ...BASE_PARAMS,
        auctionProgressState: AuctionProgressState.IN_PROGRESS,
        launchBidTokenPriceUsdRaw: '2',
        bidTokenMarketPriceUsd: 3,
      }),
    ).toBeCloseTo(7.5, 9)
  })

  it('returns undefined for zero total supply', () => {
    expect(
      computeCurrentValuationUsd({
        ...BASE_PARAMS,
        totalSupplyRaw: '0',
        auctionProgressState: AuctionProgressState.ENDED,
        launchBidTokenPriceUsdRaw: '2',
        bidTokenMarketPriceUsd: 3,
      }),
    ).toBeUndefined()
  })
})

describe('computeCurrentValuationFiatFormatted', () => {
  const convertFiatAmountFormatted = (fromAmount: string | number | null | undefined): string => `$${fromAmount}`

  it('formats the computed valuation', () => {
    expect(
      computeCurrentValuationFiatFormatted({
        ...BASE_PARAMS,
        auctionProgressState: AuctionProgressState.ENDED,
        launchBidTokenPriceUsdRaw: '2',
        bidTokenMarketPriceUsd: undefined,
        convertFiatAmountFormatted,
      }),
    ).toBe('$5')
  })

  it('returns "--" when the valuation is unavailable', () => {
    expect(
      computeCurrentValuationFiatFormatted({
        ...BASE_PARAMS,
        bidTokenInfo: { ...USDC, priceFiat: 0 },
        auctionProgressState: AuctionProgressState.ENDED,
        launchBidTokenPriceUsdRaw: undefined,
        bidTokenMarketPriceUsd: undefined,
        convertFiatAmountFormatted,
      }),
    ).toBe('--')
  })
})
