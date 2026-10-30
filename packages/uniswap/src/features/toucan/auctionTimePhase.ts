export enum AuctionTimePhase {
  Live = 'LIVE',
  Upcoming = 'UPCOMING',
  Ended = 'ENDED',
  Unknown = 'UNKNOWN',
}

type AuctionTimePhaseState =
  | { phase: AuctionTimePhase.Upcoming; startTimeMs: number }
  | { phase: AuctionTimePhase.Live; endTimeMs: number }
  | { phase: AuctionTimePhase.Ended }
  | { phase: AuctionTimePhase.Unknown }

/** Unknown when a missing estimate leaves the phase undetermined. */
export function getAuctionTimePhase({
  startTimeMs,
  endTimeMs,
  nowMs,
}: {
  startTimeMs: number | undefined
  endTimeMs: number | undefined
  nowMs: number
}): AuctionTimePhaseState {
  if (startTimeMs !== undefined && nowMs < startTimeMs) {
    return { phase: AuctionTimePhase.Upcoming, startTimeMs }
  }
  if (endTimeMs !== undefined && nowMs >= endTimeMs) {
    return { phase: AuctionTimePhase.Ended }
  }
  if (startTimeMs === undefined || endTimeMs === undefined) {
    return { phase: AuctionTimePhase.Unknown }
  }
  return { phase: AuctionTimePhase.Live, endTimeMs }
}
