import {
  auctionCommittedVolumeComparator,
  compareDescendingMissingLast,
  type EnrichedAuction,
} from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'

// Comparator-level tests for the USD -> bid-token sort fallback. Table-level ordering
// (grouping, ascending toggle, stability) is covered in TopAuctionsTable.test.ts.

function createEnrichedAuction({
  totalBidVolumeUsd,
  totalBidVolume,
  currencyTokenDecimals,
}: {
  totalBidVolumeUsd?: number
  totalBidVolume?: string
  currencyTokenDecimals?: number
}): EnrichedAuction {
  return {
    auction: {
      totalBidVolumeUsd,
      totalBidVolume,
      currencyTokenDecimals,
    },
  } as unknown as EnrichedAuction
}

describe('compareDescendingMissingLast', () => {
  it('sorts defined values descending', () => {
    expect(compareDescendingMissingLast(1, 5)).toBeGreaterThan(0)
    expect(compareDescendingMissingLast(5, 1)).toBeLessThan(0)
    expect(compareDescendingMissingLast(3, 3)).toBe(0)
  })

  it('sorts missing values last, symmetrically', () => {
    expect(compareDescendingMissingLast(undefined, 1)).toBeGreaterThan(0)
    expect(compareDescendingMissingLast(1, undefined)).toBeLessThan(0)
  })

  it('treats two missing values as equal', () => {
    expect(compareDescendingMissingLast(undefined, undefined)).toBe(0)
  })
})

describe('auctionCommittedVolumeComparator', () => {
  const ONE_TOKEN_18_DECIMALS = '1000000000000000000'
  const FIVE_TOKENS_18_DECIMALS = '5000000000000000000'

  it('sorts by USD volume descending when both sides have it', () => {
    const lowUsd = createEnrichedAuction({ totalBidVolumeUsd: 10 })
    const highUsd = createEnrichedAuction({ totalBidVolumeUsd: 100 })

    expect(auctionCommittedVolumeComparator(lowUsd, highUsd)).toBeGreaterThan(0)
    expect(auctionCommittedVolumeComparator(highUsd, lowUsd)).toBeLessThan(0)
    expect(auctionCommittedVolumeComparator(highUsd, highUsd)).toBe(0)
  })

  it('falls back to bid-token amounts when USD is missing on either side', () => {
    // Chains without a USD price feed (e.g. Robinhood): totalBidVolumeUsd is undefined
    const oneToken = createEnrichedAuction({ totalBidVolume: ONE_TOKEN_18_DECIMALS, currencyTokenDecimals: 18 })
    const fiveTokens = createEnrichedAuction({ totalBidVolume: FIVE_TOKENS_18_DECIMALS, currencyTokenDecimals: 18 })

    expect(auctionCommittedVolumeComparator(oneToken, fiveTokens)).toBeGreaterThan(0)
    expect(auctionCommittedVolumeComparator(fiveTokens, oneToken)).toBeLessThan(0)
  })

  it('uses the bid-token fallback when only one side has USD', () => {
    // Mixed case: one row has USD, the other does not — USD is not comparable cross-row,
    // so both fall back to bid-token amounts.
    const usdWithLowTokenVolume = createEnrichedAuction({
      totalBidVolumeUsd: 1000,
      totalBidVolume: ONE_TOKEN_18_DECIMALS,
      currencyTokenDecimals: 18,
    })
    const noUsdWithHighTokenVolume = createEnrichedAuction({
      totalBidVolume: FIVE_TOKENS_18_DECIMALS,
      currencyTokenDecimals: 18,
    })

    expect(auctionCommittedVolumeComparator(usdWithLowTokenVolume, noUsdWithHighTokenVolume)).toBeGreaterThan(0)
    expect(auctionCommittedVolumeComparator(noUsdWithHighTokenVolume, usdWithLowTokenVolume)).toBeLessThan(0)
  })

  it('sorts rows with no volume data last, symmetrically', () => {
    const hasTokenVolume = createEnrichedAuction({ totalBidVolume: ONE_TOKEN_18_DECIMALS, currencyTokenDecimals: 18 })
    const noData = createEnrichedAuction({})
    const missingDecimals = createEnrichedAuction({ totalBidVolume: ONE_TOKEN_18_DECIMALS })

    expect(auctionCommittedVolumeComparator(noData, hasTokenVolume)).toBeGreaterThan(0)
    expect(auctionCommittedVolumeComparator(hasTokenVolume, noData)).toBeLessThan(0)
    // Token volume without decimals is unconvertible and treated as missing
    expect(auctionCommittedVolumeComparator(missingDecimals, hasTokenVolume)).toBeGreaterThan(0)
  })

  it('returns 0 when both sides are missing volume data', () => {
    const noDataA = createEnrichedAuction({})
    const noDataB = createEnrichedAuction({})

    expect(auctionCommittedVolumeComparator(noDataA, noDataB)).toBe(0)
  })
})
