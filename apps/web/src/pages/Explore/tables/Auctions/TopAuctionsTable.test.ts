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
}): TestAuctionTableValue {
  const startBlockTimestamp = isComingSoon ? NOW_SECONDS + 3600n : NOW_SECONDS - 3600n

  return {
    id,
    auction: {
      auction: {
        totalBidVolumeUsd,
        totalBidVolume,
        currencyTokenDecimals,
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
