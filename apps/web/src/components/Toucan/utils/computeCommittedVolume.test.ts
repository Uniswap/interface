import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { computeCommittedVolumeTableValue } from '~/components/Toucan/utils/computeCommittedVolume'
import type { AuctionWithCurrencyInfo } from '~/state/explore/topAuctions/useTopAuctions'

function createAuctionWithCurrencyInfo({
  nestedTotalBidVolume,
  deprecatedTotalBidVolume,
}: {
  nestedTotalBidVolume?: string
  deprecatedTotalBidVolume?: string
}): AuctionWithCurrencyInfo {
  return {
    auction: {
      totalBidVolume: nestedTotalBidVolume,
    },
    totalBidVolume: deprecatedTotalBidVolume ?? '',
    currencyInfo: undefined,
    verified: false,
  } as unknown as AuctionWithCurrencyInfo
}

const bidTokenCurrencyInfo = {
  currency: {
    decimals: 6,
    symbol: 'USDC',
  },
} as Maybe<CurrencyInfo>

describe('computeCommittedVolumeTableValue', () => {
  it('prefers nested auction.totalBidVolume over deprecated top-level totalBidVolume', () => {
    const result = computeCommittedVolumeTableValue({
      auction: createAuctionWithCurrencyInfo({
        nestedTotalBidVolume: '1000000',
        deprecatedTotalBidVolume: '2000000',
      }),
      bidTokenCurrencyInfo,
      bidTokenMarketPriceUsd: 2,
    })

    expect(result.raw).toBe(1000000n)
    expect(result.usd).toBe(2)
  })

  it('falls back to deprecated top-level totalBidVolume when nested value is missing', () => {
    const result = computeCommittedVolumeTableValue({
      auction: createAuctionWithCurrencyInfo({
        nestedTotalBidVolume: undefined,
        deprecatedTotalBidVolume: '2000000',
      }),
      bidTokenCurrencyInfo,
      bidTokenMarketPriceUsd: 2,
    })

    expect(result.raw).toBe(2000000n)
    expect(result.usd).toBe(4)
  })
})
