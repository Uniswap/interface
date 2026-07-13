import { FiatNumberType } from 'utilities/src/format/types'
import { BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { computeCommittedVolumeBreakdown } from '~/features/Toucan/Auction/utils/computeCommittedVolumeBreakdown'

const ETH: BidTokenInfo = {
  symbol: 'ETH',
  decimals: 18,
  priceFiat: 0,
  isStablecoin: false,
  logoUrl: null,
}

const fiatFormatter = (fromAmount: Maybe<number | string>, _numberType: FiatNumberType): string =>
  `$${Math.round(Number(fromAmount ?? 0))}`

const ONE_ETH = 10n ** 18n

describe('computeCommittedVolumeBreakdown', () => {
  it('returns null when bid token info is missing', () => {
    expect(
      computeCommittedVolumeBreakdown({
        bidDistributionData: null,
        clearingPriceQ96: '100',
        filledRaw: '0',
        totalRaw: (10n * ONE_ETH).toString(),
        requiredRaw: undefined,
        bidTokenInfo: undefined,
        bidTokenMarketPriceUsd: undefined,
        convertFiatAmountFormatted: fiatFormatter,
      }),
    ).toBeNull()
  })

  it('returns null when total is missing', () => {
    expect(
      computeCommittedVolumeBreakdown({
        bidDistributionData: null,
        clearingPriceQ96: '100',
        filledRaw: '0',
        totalRaw: undefined,
        requiredRaw: undefined,
        bidTokenInfo: ETH,
        bidTokenMarketPriceUsd: undefined,
        convertFiatAmountFormatted: fiatFormatter,
      }),
    ).toBeNull()
  })

  it('splits total into filled, in-range outstanding, and out-of-range buckets that sum to total', () => {
    const bidDistributionData = new Map<string, string>([
      ['50', (1n * ONE_ETH).toString()],
      ['80', (2n * ONE_ETH).toString()],
      ['150', (4n * ONE_ETH).toString()],
    ])

    const result = computeCommittedVolumeBreakdown({
      bidDistributionData,
      clearingPriceQ96: '100',
      filledRaw: (5n * ONE_ETH).toString(),
      totalRaw: (15n * ONE_ETH).toString(),
      requiredRaw: (2n * ONE_ETH).toString(),
      bidTokenInfo: ETH,
      bidTokenMarketPriceUsd: undefined,
      convertFiatAmountFormatted: fiatFormatter,
    })

    expect(result).not.toBeNull()
    expect(result!.outOfRangeRaw).toBe(3n * ONE_ETH)
    expect(result!.filledRaw).toBe(5n * ONE_ETH)
    expect(result!.inRangeOutstandingRaw).toBe(7n * ONE_ETH)
    expect(result!.totalRaw).toBe(15n * ONE_ETH)
    expect(result!.filledRaw + result!.inRangeOutstandingRaw + result!.outOfRangeRaw).toBe(result!.totalRaw)
  })

  it('treats ticks at exactly the clearing price as in range', () => {
    const bidDistributionData = new Map<string, string>([['100', (3n * ONE_ETH).toString()]])

    const result = computeCommittedVolumeBreakdown({
      bidDistributionData,
      clearingPriceQ96: '100',
      filledRaw: '0',
      totalRaw: (3n * ONE_ETH).toString(),
      requiredRaw: undefined,
      bidTokenInfo: ETH,
      bidTokenMarketPriceUsd: undefined,
      convertFiatAmountFormatted: fiatFormatter,
    })

    expect(result!.outOfRangeRaw).toBe(0n)
    expect(result!.inRangeOutstandingRaw).toBe(3n * ONE_ETH)
  })

  it('clamps filled so in-range outstanding never goes negative', () => {
    const bidDistributionData = new Map<string, string>([['50', (4n * ONE_ETH).toString()]])

    const result = computeCommittedVolumeBreakdown({
      bidDistributionData,
      clearingPriceQ96: '100',
      filledRaw: (100n * ONE_ETH).toString(),
      totalRaw: (10n * ONE_ETH).toString(),
      requiredRaw: undefined,
      bidTokenInfo: ETH,
      bidTokenMarketPriceUsd: undefined,
      convertFiatAmountFormatted: fiatFormatter,
    })

    expect(result!.outOfRangeRaw).toBe(4n * ONE_ETH)
    expect(result!.filledRaw).toBe(6n * ONE_ETH)
    expect(result!.inRangeOutstandingRaw).toBe(0n)
    expect(result!.filledRaw + result!.inRangeOutstandingRaw + result!.outOfRangeRaw).toBe(result!.totalRaw)
  })

  it('clamps out-of-range volume to the authoritative total', () => {
    const bidDistributionData = new Map<string, string>([['50', (20n * ONE_ETH).toString()]])

    const result = computeCommittedVolumeBreakdown({
      bidDistributionData,
      clearingPriceQ96: '100',
      filledRaw: '0',
      totalRaw: (10n * ONE_ETH).toString(),
      requiredRaw: undefined,
      bidTokenInfo: ETH,
      bidTokenMarketPriceUsd: undefined,
      convertFiatAmountFormatted: fiatFormatter,
    })

    expect(result!.outOfRangeRaw).toBe(10n * ONE_ETH)
    expect(result!.inRangeOutstandingRaw).toBe(0n)
  })

  it('produces fiat strings only when a market price is provided', () => {
    const params = {
      bidDistributionData: null,
      clearingPriceQ96: '100',
      filledRaw: '0',
      totalRaw: (10n * ONE_ETH).toString(),
      requiredRaw: (2n * ONE_ETH).toString(),
      bidTokenInfo: ETH,
      convertFiatAmountFormatted: fiatFormatter,
    }

    const withoutPrice = computeCommittedVolumeBreakdown({ ...params, bidTokenMarketPriceUsd: undefined })
    expect(withoutPrice!.totalFiatFormatted).toBeNull()
    expect(withoutPrice!.requiredFiatFormatted).toBeNull()

    const withPrice = computeCommittedVolumeBreakdown({ ...params, bidTokenMarketPriceUsd: 2000 })
    expect(withPrice!.totalFiatFormatted).toBe('$20000')
    expect(withPrice!.requiredFiatFormatted).toBe('$4000')
  })

  it('handles missing clearing price by treating all volume as in range', () => {
    const bidDistributionData = new Map<string, string>([['50', (3n * ONE_ETH).toString()]])

    const result = computeCommittedVolumeBreakdown({
      bidDistributionData,
      clearingPriceQ96: undefined,
      filledRaw: '0',
      totalRaw: (3n * ONE_ETH).toString(),
      requiredRaw: undefined,
      bidTokenInfo: ETH,
      bidTokenMarketPriceUsd: undefined,
      convertFiatAmountFormatted: fiatFormatter,
    })

    expect(result!.outOfRangeRaw).toBe(0n)
    expect(result!.inRangeOutstandingRaw).toBe(3n * ONE_ETH)
  })

  it('ignores unparsable distribution entries', () => {
    const bidDistributionData = new Map<string, string>([
      ['not-a-number', '123'],
      ['50', 'also-bad'],
      ['80', (2n * ONE_ETH).toString()],
    ])

    const result = computeCommittedVolumeBreakdown({
      bidDistributionData,
      clearingPriceQ96: '100',
      filledRaw: '0',
      totalRaw: (5n * ONE_ETH).toString(),
      requiredRaw: undefined,
      bidTokenInfo: ETH,
      bidTokenMarketPriceUsd: undefined,
      convertFiatAmountFormatted: fiatFormatter,
    })

    expect(result!.outOfRangeRaw).toBe(2n * ONE_ETH)
  })
})
