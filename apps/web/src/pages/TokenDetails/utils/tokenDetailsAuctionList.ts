import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { areEvmAddressesEqual } from '@universe/chains'
import { timestampToMs } from 'uniswap/src/data/apiClients/dataApiService/utils/protoTimestamp'

export enum TokenDetailsAuctionListPhase {
  Live = 'LIVE',
  Upcoming = 'UPCOMING',
  Ended = 'ENDED',
  Unknown = 'UNKNOWN',
}

const PHASE_ORDER: Record<TokenDetailsAuctionListPhase, number> = {
  [TokenDetailsAuctionListPhase.Live]: 0,
  [TokenDetailsAuctionListPhase.Upcoming]: 1,
  [TokenDetailsAuctionListPhase.Ended]: 2,
  [TokenDetailsAuctionListPhase.Unknown]: 3,
}

export function getAuctionListPhase({
  auction,
  nowMs,
}: {
  auction: PlainMessage<Auction>
  nowMs: number
}): TokenDetailsAuctionListPhase {
  const startMs = timestampToMs(auction.estimatedStartTime)
  const endMs = timestampToMs(auction.estimatedEndTime)
  if (startMs === undefined || endMs === undefined) {
    return TokenDetailsAuctionListPhase.Unknown
  }
  if (nowMs < startMs) {
    return TokenDetailsAuctionListPhase.Upcoming
  }
  return nowMs >= endMs ? TokenDetailsAuctionListPhase.Ended : TokenDetailsAuctionListPhase.Live
}

/** Live auctions ending soonest first, then upcoming by start, then ended most recent first. */
export function sortTokenDetailsAuctions({
  auctions,
  nowMs,
}: {
  auctions: PlainMessage<Auction>[]
  nowMs: number
}): PlainMessage<Auction>[] {
  const sortKey = (auction: PlainMessage<Auction>): number => {
    const phase = getAuctionListPhase({ auction, nowMs })
    const startMs = timestampToMs(auction.estimatedStartTime) ?? 0
    const endMs = timestampToMs(auction.estimatedEndTime) ?? 0
    if (phase === TokenDetailsAuctionListPhase.Live) {
      return endMs
    }
    if (phase === TokenDetailsAuctionListPhase.Upcoming) {
      return startMs
    }
    return phase === TokenDetailsAuctionListPhase.Ended ? -endMs : 0
  }
  return auctions
    .map((auction) => ({ auction, phase: PHASE_ORDER[getAuctionListPhase({ auction, nowMs })], key: sortKey(auction) }))
    .sort((a, b) => a.phase - b.phase || a.key - b.key)
    .map(({ auction }) => auction)
}

export function countOtherActiveAuctions({
  auctions,
  primaryAuctionAddress,
  nowMs,
}: {
  auctions: PlainMessage<Auction>[]
  primaryAuctionAddress: string | undefined
  nowMs: number
}): number {
  return auctions.filter((auction) => {
    if (primaryAuctionAddress && areEvmAddressesEqual(auction.address, primaryAuctionAddress)) {
      return false
    }
    const phase = getAuctionListPhase({ auction, nowMs })
    return phase === TokenDetailsAuctionListPhase.Live || phase === TokenDetailsAuctionListPhase.Upcoming
  }).length
}
