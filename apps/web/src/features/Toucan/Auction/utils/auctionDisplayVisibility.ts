import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
  type AuctionDisplayState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'

/**
 * Only an upcoming or live Custom auction whose pool is confirmed missing replaces the TDP's trading
 * layout. Takes `poolAvailability` rather than `shouldShowSwap` so it shares one input with the
 * initial-loading predicate (`mayResolveToAuctionOnly`) and the two cannot drift apart.
 */
export function shouldShowAuctionOnlyLayout({
  launchMethod,
  phase,
  poolAvailability,
}: {
  launchMethod?: LaunchProvenanceMethod
  phase: AuctionDisplayPhase
  poolAvailability: PoolAvailability
}): boolean {
  return (
    launchMethod === LaunchProvenanceMethod.CustomAuction &&
    (phase === AuctionDisplayPhase.Upcoming || phase === AuctionDisplayPhase.Live) &&
    poolAvailability === PoolAvailability.NoPool
  )
}

/** "Buy or sell {symbol}" under the bid form: only while bidding is live and the token already has a pool. */
export function shouldShowTradeTokenBanner(state: AuctionDisplayState | undefined): boolean {
  return state?.phase === AuctionDisplayPhase.Live && state.poolAvailability === PoolAvailability.HasPool
}

/**
 * A successful ended auction's timeline only promises trading once its pool is confirmed missing.
 * A pending or failed lookup is not "no pool": `shouldShowSwap` keeps offering trading in both, so
 * telling the user trading has not opened yet would contradict the swap on the same page.
 */
export function shouldShowClaimOnlyTimeline(state: AuctionDisplayState | undefined): boolean {
  return (
    state?.phase === AuctionDisplayPhase.Ended &&
    state.result === AuctionDisplayResult.Successful &&
    state.poolAvailability === PoolAvailability.NoPool
  )
}

/** Now-trading card in place of the bid form: once a successful auction has ended and the token has a pool, unless trading waits on a TGE. */
export function shouldShowNowTradingCard({
  state,
  tradingRestrictedUntilTge,
}: {
  state: AuctionDisplayState | undefined
  tradingRestrictedUntilTge: boolean
}): boolean {
  return (
    state?.phase === AuctionDisplayPhase.Ended &&
    state.result === AuctionDisplayResult.Successful &&
    state.poolAvailability === PoolAvailability.HasPool &&
    !tradingRestrictedUntilTge
  )
}

/**
 * Whether the card may still resolve into view, so its slot holds a skeleton rather than collapsing.
 * Its three inputs settle at different times — the chain head, the post-end checkpoint, the pool
 * lookup — and waiting for the slowest leaves the panel empty for a beat. Anything that rules the
 * card out for good (a failed auction, a confirmed missing pool, a TGE restriction) still hides it.
 */
export function mayShowNowTradingCard({
  state,
  tradingRestrictedUntilTge,
}: {
  state: AuctionDisplayState | undefined
  tradingRestrictedUntilTge: boolean
}): boolean {
  if (!state || tradingRestrictedUntilTge) {
    return false
  }

  const phaseMayEnd = state.phase === AuctionDisplayPhase.Ended || state.phase === AuctionDisplayPhase.Loading
  const resultMaySucceed =
    state.result === AuctionDisplayResult.Successful ||
    (state.result === AuctionDisplayResult.Unknown && state.resultPending === true)
  const poolMayExist =
    state.poolAvailability === PoolAvailability.HasPool || state.poolAvailability === PoolAvailability.Loading

  return phaseMayEnd && resultMaySucceed && poolMayExist
}
