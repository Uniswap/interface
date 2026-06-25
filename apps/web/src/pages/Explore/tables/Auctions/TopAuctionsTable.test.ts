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
  isCompleted,
  isComingSoon = false,
  verified = false,
}: {
  id: string
  totalBidVolumeUsd: number
  isCompleted: boolean
  isComingSoon?: boolean
  verified?: boolean
}): TestAuctionTableValue {
  const startBlockTimestamp = isComingSoon ? NOW_SECONDS + 3600n : NOW_SECONDS - 3600n

  return {
    id,
    auction: {
      auction: {
        totalBidVolumeUsd,
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
      raw: 0n,
      formattedBidToken: '—',
      usd: undefined,
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
})
