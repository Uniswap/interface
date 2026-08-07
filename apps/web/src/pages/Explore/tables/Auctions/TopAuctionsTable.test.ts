import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import {
  sortAuctions,
  sortAuctionsByDefault,
  type SortableTopAuctionTableValue,
} from '~/pages/Explore/tables/Auctions/TopAuctionsTable'
import { AuctionSortField } from '~/pages/Explore/tables/Auctions/TopAuctionsTableCells'

interface TestAuctionTableValue extends SortableTopAuctionTableValue {
  id: string
}

const NOW_MS = 1_000_000_000_000
const NOW_SECONDS = BigInt(NOW_MS / 1000)

function createAuctionTableValue({
  id,
  totalBidVolumeUsd,
  totalBidVolume,
  currencyTokenDecimals,
  fdvUsd,
  fdvRaw = 0n,
  isCompleted = false,
  isComingSoon = false,
  verified = false,
  launchThresholdUsd,
  launchThresholdTokens,
}: {
  id: string
  totalBidVolumeUsd?: number
  totalBidVolume?: string
  currencyTokenDecimals?: number
  fdvUsd?: number
  fdvRaw?: bigint
  isCompleted?: boolean
  isComingSoon?: boolean
  verified?: boolean
  launchThresholdUsd?: number
  launchThresholdTokens?: number
}): TestAuctionTableValue {
  const startBlockTimestamp = isComingSoon ? NOW_SECONDS + 3600n : NOW_SECONDS - 3600n

  return {
    id,
    auction: {
      auction: {
        totalBidVolumeUsd,
        totalBidVolume,
        currencyTokenDecimals,
        // Currency token priced at $1 with 6 decimals, so the threshold's USD value equals launchThresholdUsd
        ...(launchThresholdUsd !== undefined && {
          requiredCurrencyRaised: BigInt(Math.round(launchThresholdUsd * 1e6)).toString(),
          currencyTokenDecimals: 6,
          currencyPriceUsd: '1',
        }),
        // Threshold in bid-token units with no USD price feed (e.g. Robinhood chains)
        ...(launchThresholdTokens !== undefined && {
          requiredCurrencyRaised: BigInt(Math.round(launchThresholdTokens * 1e18)).toString(),
          currencyTokenDecimals: 18,
        }),
      },
      verified,
      logoUrl: undefined,
      timeRemaining: {
        isCompleted,
        startBlockTimestamp,
        endBlockTimestamp: undefined,
      },
    } as unknown as EnrichedAuction,
    projectedFdv: {
      raw: fdvRaw,
      formattedBidToken: '—',
      usd: fdvUsd,
    },
  }
}

describe('top auctions table sorting', () => {
  const verifiedCompletedHighVolume = createAuctionTableValue({
    id: 'verified-completed-high-volume',
    totalBidVolumeUsd: 100,
    isCompleted: true,
    verified: true,
  })
  const verifiedLiveLowVolume = createAuctionTableValue({
    id: 'verified-live-low-volume',
    totalBidVolumeUsd: 10,
    isCompleted: false,
    verified: true,
  })
  const verifiedLiveHighVolume = createAuctionTableValue({
    id: 'verified-live-high-volume',
    totalBidVolumeUsd: 50,
    isCompleted: false,
    verified: true,
  })
  const verifiedComingSoon = createAuctionTableValue({
    id: 'verified-coming-soon',
    totalBidVolumeUsd: 75,
    isCompleted: false,
    isComingSoon: true,
    verified: true,
  })
  const unverifiedLive = createAuctionTableValue({
    id: 'unverified-live',
    totalBidVolumeUsd: 200,
    isCompleted: false,
  })
  const unverifiedCompleted = createAuctionTableValue({
    id: 'unverified-completed',
    totalBidVolumeUsd: 300,
    isCompleted: true,
  })

  it('sorts the initial list by committed volume before grouping by auction priority', () => {
    const sorted = sortAuctionsByDefault(
      [
        unverifiedCompleted,
        verifiedLiveLowVolume,
        unverifiedLive,
        verifiedCompletedHighVolume,
        verifiedComingSoon,
        verifiedLiveHighVolume,
      ],
      NOW_MS,
    )

    expect(sorted.map((auction) => auction.id)).toEqual([
      'verified-live-high-volume',
      'verified-live-low-volume',
      'unverified-live',
      'verified-coming-soon',
      'verified-completed-high-volume',
      'unverified-completed',
    ])
  })

  it('uses committed volume only when the committed volume header controls sorting', () => {
    const sorted = sortAuctions({
      auctions: [
        verifiedLiveLowVolume,
        verifiedCompletedHighVolume,
        verifiedLiveHighVolume,
        unverifiedCompleted,
        unverifiedLive,
      ],
      sortMethod: AuctionSortField.COMMITTED_VOLUME,
      sortAscending: false,
    })

    expect(sorted.map((auction) => auction.id)).toEqual([
      'unverified-completed',
      'unverified-live',
      'verified-completed-high-volume',
      'verified-live-high-volume',
      'verified-live-low-volume',
    ])
  })

  describe('launch threshold sorting', () => {
    const highThreshold = createAuctionTableValue({
      id: 'high-threshold',
      totalBidVolumeUsd: 10,
      isCompleted: false,
      launchThresholdUsd: 500_000,
    })
    const lowThreshold = createAuctionTableValue({
      id: 'low-threshold',
      totalBidVolumeUsd: 200,
      isCompleted: false,
      launchThresholdUsd: 1_000,
    })
    const noThreshold = createAuctionTableValue({
      id: 'no-threshold',
      totalBidVolumeUsd: 300,
      isCompleted: false,
    })

    it('sorts by threshold USD value descending with missing thresholds at the end', () => {
      const sorted = sortAuctions({
        auctions: [noThreshold, lowThreshold, highThreshold],
        sortMethod: AuctionSortField.LAUNCH_THRESHOLD,
        sortAscending: false,
      })

      expect(sorted.map((auction) => auction.id)).toEqual(['high-threshold', 'low-threshold', 'no-threshold'])
    })

    it('reverses the order when sorting ascending', () => {
      const sorted = sortAuctions({
        auctions: [lowThreshold, highThreshold, noThreshold],
        sortMethod: AuctionSortField.LAUNCH_THRESHOLD,
        sortAscending: true,
      })

      expect(sorted.map((auction) => auction.id)).toEqual(['no-threshold', 'low-threshold', 'high-threshold'])
    })

    it('falls back to bid-token threshold amounts when USD is missing', () => {
      // Robinhood-chain case: currencyPriceUsd absent so the threshold has no USD value on any row
      const lowTokenThreshold = createAuctionTableValue({ id: 'low-token-threshold', launchThresholdTokens: 1 })
      const highTokenThreshold = createAuctionTableValue({ id: 'high-token-threshold', launchThresholdTokens: 5 })
      const midTokenThreshold = createAuctionTableValue({ id: 'mid-token-threshold', launchThresholdTokens: 3 })
      const noThresholdData = createAuctionTableValue({ id: 'no-threshold-data', currencyTokenDecimals: 18 })

      const sorted = sortAuctions({
        auctions: [lowTokenThreshold, noThresholdData, highTokenThreshold, midTokenThreshold],
        sortMethod: AuctionSortField.LAUNCH_THRESHOLD,
        sortAscending: false,
      })

      expect(sorted.map((auction) => auction.id)).toEqual([
        'high-token-threshold',
        'mid-token-threshold',
        'low-token-threshold',
        'no-threshold-data',
      ])
    })
  })

  describe('committed volume sort without USD prices', () => {
    // Chains without a USD price feed (e.g. Robinhood) have totalBidVolumeUsd undefined on every row
    const lowTokenVolume = createAuctionTableValue({
      id: 'low-token-volume',
      totalBidVolume: '1000000000000000000', // 1 token @ 18 decimals
      currencyTokenDecimals: 18,
    })
    const highTokenVolume = createAuctionTableValue({
      id: 'high-token-volume',
      totalBidVolume: '5000000000000000000', // 5 tokens @ 18 decimals
      currencyTokenDecimals: 18,
    })
    const midTokenVolume = createAuctionTableValue({
      id: 'mid-token-volume',
      totalBidVolume: '3000000000000000000', // 3 tokens @ 18 decimals
      currencyTokenDecimals: 18,
    })
    const noVolumeData = createAuctionTableValue({ id: 'no-volume-data' })

    it('falls back to bid-token amounts when USD is missing (descending)', () => {
      const sorted = sortAuctions({
        auctions: [lowTokenVolume, noVolumeData, highTokenVolume, midTokenVolume],
        sortMethod: AuctionSortField.COMMITTED_VOLUME,
        sortAscending: false,
      })

      expect(sorted.map((auction) => auction.id)).toEqual([
        'high-token-volume',
        'mid-token-volume',
        'low-token-volume',
        'no-volume-data',
      ])
    })

    it('reverses order when ascending', () => {
      const sorted = sortAuctions({
        auctions: [lowTokenVolume, highTokenVolume, midTokenVolume],
        sortMethod: AuctionSortField.COMMITTED_VOLUME,
        sortAscending: true,
      })

      expect(sorted.map((auction) => auction.id)).toEqual(['low-token-volume', 'mid-token-volume', 'high-token-volume'])
    })

    it('treats rows that are both missing data as equal (stable sort)', () => {
      const otherNoData = createAuctionTableValue({ id: 'other-no-data' })
      const sorted = sortAuctions({
        auctions: [noVolumeData, otherNoData, highTokenVolume],
        sortMethod: AuctionSortField.COMMITTED_VOLUME,
        sortAscending: false,
      })

      expect(sorted.map((auction) => auction.id)).toEqual(['high-token-volume', 'no-volume-data', 'other-no-data'])
    })
  })

  describe('FDV sort', () => {
    const lowFdvUsd = createAuctionTableValue({ id: 'low-fdv-usd', fdvUsd: 1000, fdvRaw: 10n ** 18n })
    const highFdvUsd = createAuctionTableValue({ id: 'high-fdv-usd', fdvUsd: 5000, fdvRaw: 5n * 10n ** 18n })
    const midFdvUsd = createAuctionTableValue({ id: 'mid-fdv-usd', fdvUsd: 3000, fdvRaw: 3n * 10n ** 18n })

    it('sorts by USD when available (descending)', () => {
      const sorted = sortAuctions({
        auctions: [lowFdvUsd, highFdvUsd, midFdvUsd],
        sortMethod: AuctionSortField.FDV,
        sortAscending: false,
      })

      expect(sorted.map((auction) => auction.id)).toEqual(['high-fdv-usd', 'mid-fdv-usd', 'low-fdv-usd'])
    })

    it('falls back to bid-token FDV when USD is missing', () => {
      // Robinhood-chain case: currencyPriceUsd absent so projectedFdv.usd is undefined for all rows
      const lowFdvRaw = createAuctionTableValue({ id: 'low-fdv-raw', fdvRaw: 10n ** 18n, currencyTokenDecimals: 18 })
      const highFdvRaw = createAuctionTableValue({
        id: 'high-fdv-raw',
        fdvRaw: 5n * 10n ** 18n,
        currencyTokenDecimals: 18,
      })
      const midFdvRaw = createAuctionTableValue({
        id: 'mid-fdv-raw',
        fdvRaw: 3n * 10n ** 18n,
        currencyTokenDecimals: 18,
      })
      const noFdvData = createAuctionTableValue({ id: 'no-fdv-data', currencyTokenDecimals: 18 })

      const sorted = sortAuctions({
        auctions: [lowFdvRaw, noFdvData, highFdvRaw, midFdvRaw],
        sortMethod: AuctionSortField.FDV,
        sortAscending: false,
      })

      expect(sorted.map((auction) => auction.id)).toEqual(['high-fdv-raw', 'mid-fdv-raw', 'low-fdv-raw', 'no-fdv-data'])
    })

    it('reverses order when ascending', () => {
      const sorted = sortAuctions({
        auctions: [midFdvUsd, lowFdvUsd, highFdvUsd],
        sortMethod: AuctionSortField.FDV,
        sortAscending: true,
      })

      expect(sorted.map((auction) => auction.id)).toEqual(['low-fdv-usd', 'mid-fdv-usd', 'high-fdv-usd'])
    })
  })
})

describe('time remaining sorting', () => {
  function createTimeSortValue({
    id,
    startOffsetSec,
    endOffsetSec,
    isCompleted = false,
  }: {
    id: string
    startOffsetSec: number
    endOffsetSec: number
    isCompleted?: boolean
  }): TestAuctionTableValue {
    return {
      id,
      auction: {
        auction: {
          totalBidVolumeUsd: 0,
        },
        verified: false,
        logoUrl: undefined,
        timeRemaining: {
          isCompleted,
          startBlockTimestamp: NOW_SECONDS + BigInt(startOffsetSec),
          endBlockTimestamp: NOW_SECONDS + BigInt(endOffsetSec),
        },
      } as unknown as EnrichedAuction,
      projectedFdv: {
        raw: 0n,
        formattedBidToken: '—',
        usd: undefined,
      },
    }
  }

  const ongoingEndingSoon = createTimeSortValue({ id: 'ongoing-ending-soon', startOffsetSec: -3600, endOffsetSec: 600 })
  const ongoingEndingLater = createTimeSortValue({
    id: 'ongoing-ending-later',
    startOffsetSec: -3600,
    endOffsetSec: 7200,
  })
  // Ends after upcoming-starting-later ends — proves upcoming rows sort on start, not end
  const upcomingStartingSoon = createTimeSortValue({
    id: 'upcoming-starting-soon',
    startOffsetSec: 600,
    endOffsetSec: 10_000,
  })
  const upcomingStartingLater = createTimeSortValue({
    id: 'upcoming-starting-later',
    startOffsetSec: 3600,
    endOffsetSec: 5000,
  })
  const completedRecently = createTimeSortValue({
    id: 'completed-recently',
    startOffsetSec: -7200,
    endOffsetSec: -600,
    isCompleted: true,
  })
  const completedLongAgo = createTimeSortValue({
    id: 'completed-long-ago',
    startOffsetSec: -14_400,
    endOffsetSec: -7200,
    isCompleted: true,
  })

  const auctions = [
    completedRecently,
    upcomingStartingLater,
    ongoingEndingLater,
    completedLongAgo,
    upcomingStartingSoon,
    ongoingEndingSoon,
  ]

  it('groups ongoing, then upcoming, then completed when sorting descending', () => {
    const sorted = sortAuctions({
      auctions,
      sortMethod: AuctionSortField.TIME_REMAINING,
      sortAscending: false,
      currentTimeMs: NOW_MS,
    })

    expect(sorted.map((auction) => auction.id)).toEqual([
      'ongoing-ending-soon',
      'ongoing-ending-later',
      'upcoming-starting-soon',
      'upcoming-starting-later',
      'completed-long-ago',
      'completed-recently',
    ])
  })

  it('inverts the grouping and in-group order when sorting ascending', () => {
    const sorted = sortAuctions({
      auctions,
      sortMethod: AuctionSortField.TIME_REMAINING,
      sortAscending: true,
      currentTimeMs: NOW_MS,
    })

    expect(sorted.map((auction) => auction.id)).toEqual([
      'completed-recently',
      'completed-long-ago',
      'upcoming-starting-later',
      'upcoming-starting-soon',
      'ongoing-ending-later',
      'ongoing-ending-soon',
    ])
  })

  it('keeps upcoming auctions out of the ongoing group even when their end falls between ongoing ends', () => {
    const sorted = sortAuctions({
      auctions: [ongoingEndingLater, upcomingStartingLater, ongoingEndingSoon],
      sortMethod: AuctionSortField.TIME_REMAINING,
      sortAscending: false,
      currentTimeMs: NOW_MS,
    })

    // upcoming-starting-later ends (+5000s) between the ongoing ends (+600s, +7200s); it must still sort after both
    expect(sorted.map((auction) => auction.id)).toEqual([
      'ongoing-ending-soon',
      'ongoing-ending-later',
      'upcoming-starting-later',
    ])
  })

  it('sorts auctions with no end timestamp to the end', () => {
    const noData = createTimeSortValue({ id: 'no-data', startOffsetSec: -3600, endOffsetSec: 0 })
    noData.auction.timeRemaining.endBlockTimestamp = undefined

    const sorted = sortAuctions({
      auctions: [noData, ongoingEndingSoon],
      sortMethod: AuctionSortField.TIME_REMAINING,
      sortAscending: false,
      currentTimeMs: NOW_MS,
    })

    expect(sorted.map((auction) => auction.id)).toEqual(['ongoing-ending-soon', 'no-data'])
  })

  it('keeps an ongoing auction with no end timestamp in the ongoing group, above completed rows', () => {
    const ongoingNoEnd = createTimeSortValue({ id: 'ongoing-no-end', startOffsetSec: -3600, endOffsetSec: 0 })
    ongoingNoEnd.auction.timeRemaining.endBlockTimestamp = undefined

    const sorted = sortAuctions({
      auctions: [completedRecently, ongoingNoEnd, ongoingEndingSoon],
      sortMethod: AuctionSortField.TIME_REMAINING,
      sortAscending: false,
      currentTimeMs: NOW_MS,
    })

    // Undefined end sorts last within ongoing, but never below the completed group
    expect(sorted.map((auction) => auction.id)).toEqual(['ongoing-ending-soon', 'ongoing-no-end', 'completed-recently'])
  })
})
