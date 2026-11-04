import type {
  MarginActivePosition,
  MarginMarketRow,
  MarginPosition,
  MarginPositionLeg,
  MarginTerminalPosition,
  MarginTokenMetadata,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { positionLeverage } from '~/features/margin/utils/marginAdjustPositionMath'

// The wire speaks TRADER terms (exposure/counter). The venue, the router calldata and every display
// path here speak VENUE terms (collateral/debt). `direction` is the only thing separating them: a LONG
// borrows the counter token against exposure collateral, a SHORT the reverse.
export interface MarginVenueTerms {
  collateralToken: string
  collateralDecimals: number
  debtToken: string
  debtDecimals: number
}

function venueTerms(row: {
  direction: MarginDirection
  exposureToken: MarginTokenMetadata
  counterToken: MarginTokenMetadata
}): MarginVenueTerms {
  const collateral = row.direction === MarginDirection.SHORT ? row.counterToken : row.exposureToken
  const debt = row.direction === MarginDirection.SHORT ? row.exposureToken : row.counterToken
  return {
    collateralToken: collateral.address,
    collateralDecimals: collateral.decimals,
    debtToken: debt.address,
    debtDecimals: debt.decimals,
  }
}

export function marginPositionTokens(position: MarginPosition): MarginVenueTerms {
  return venueTerms(position)
}

export function marginMarketRowTokens(market: MarginMarketRow): MarginVenueTerms {
  return venueTerms(market)
}

export function isMarginActivePosition(position: MarginPosition): position is MarginActivePosition {
  return position.status === 'ACTIVE'
}

export function isMarginTerminalPosition(position: MarginPosition): position is MarginTerminalPosition {
  return position.status !== 'ACTIVE'
}

// v1 positions are single-leg, so legs[0] IS the position's venue identity. Reading it through here
// rather than indexing at each site is what keeps a future multi-leg position from silently
// reporting only its first leg.
export function marginPositionLeg(position: MarginPosition): MarginPositionLeg | undefined {
  return position.legs[0]
}

export function marginPositionVenue(position: MarginPosition): MarginVenue | undefined {
  return marginPositionLeg(position)?.venue
}

// The on-chain (owner, subId) slot. `positionId` is the opaque handle a quote takes back; v1 spells
// it as this same subId, but only the leg is the account-derivation input.
export function marginPositionSubId(position: MarginPosition): string | undefined {
  return marginPositionLeg(position)?.subId
}

export function marginPositionAccount(position: MarginPosition): string | undefined {
  return marginPositionLeg(position)?.account
}

// Live debt in DEBT-token raw units, or undefined where the row carries no leg to read it from. The
// STRICT reader: an unknown debt and a settled one are different facts, and a figure that feeds PnL
// must not confuse them.
export function marginPositionLegDebt(position: MarginPosition): string | undefined {
  return marginPositionLeg(position)?.debt
}

// Live debt in DEBT-token raw units. Terminal rows carry a settled leg, so this reads '0' there — and
// so does a leg-less row, which is why anything VALUING the position reads marginPositionLegDebt
// instead and suppresses rather than reporting a debt-free balance sheet.
export function marginPositionDebt(position: MarginPosition): string {
  return marginPositionLegDebt(position) ?? '0'
}

// '0' is the documented sentinel for an open-time timestamp the indexer never recorded. Its own
// predicate because everything that needs only an AGE — the row's age cell, the drawer's opened-at
// date, the per-day accrual — must NOT ride the basis gate below, which additionally demands an entry
// price and would drop figures the wire fully supports.
export function hasMarginOpenedAt(position: MarginPosition): boolean {
  const openedAtSeconds = Number(position.openedAt)
  return Number.isFinite(openedAtSeconds) && openedAtSeconds > 0
}

// '0' is the documented sentinel for a basis the server cannot attribute — the row renders nothing
// rather than a $0 entry. Replaces the old "costBasis is present" gate.
export function hasMarginPositionBasis(position: MarginPosition): boolean {
  // Parsed, not compared to the '0' literal: '' and '0.0' are the same fact and both used to pass,
  // leaving downstream Number(entryPrice) to produce 0 or NaN — the fail-open shape the sibling
  // readers here already close.
  const entryPrice = Number(position.entryPrice)
  return Number.isFinite(entryPrice) && entryPrice > 0 && hasMarginOpenedAt(position)
}

// Exposure leverage at open, or undefined where the indexer never recorded a ratio — it stamps '0' in
// that case, and '0' is not nullish, so an absent-only check reports a fabricated 0x. Every surface
// that states an open-time leverage reads it through here.
export function marginOpenedLeverage(position: MarginActivePosition): number | undefined {
  const leverage = Number(position.openedLeverage ?? '0')
  // Finite, not just positive: the wire is a decimal STRING, so 'Infinity' parses to a number that
  // passes `> 0` and then scales every figure derived from it to 0 or ∞.
  return Number.isFinite(leverage) && leverage > 0 ? leverage : undefined
}

// Exposure leverage at open. The stamped ratio wins where the indexer recorded one; otherwise a LONG's
// collateral at open over the equity deposited into it, both raw collateral units (a long's collateral IS
// its exposure). A SHORT's collateral is the counter token, so that ratio is not its exposure leverage and
// it reports nothing without a stamp — as does any non-positive or malformed input.
export function marginLeverageAtOpen(position: MarginActivePosition): number | undefined {
  const stamped = marginOpenedLeverage(position)
  if (stamped !== undefined || position.direction !== MarginDirection.LONG) {
    return stamped
  }
  const collateralAtOpen = Number(position.collateralAtOpen ?? '0')
  const depositedEquity = Number(position.depositedEquity ?? '0')
  // Inverted so NaN fails too — `NaN <= 0` is false.
  if (!(collateralAtOpen > 0) || !(depositedEquity > 0)) {
    return undefined
  }
  const leverage = collateralAtOpen / depositedEquity
  return Number.isFinite(leverage) ? leverage : undefined
}

// Live leverage for display. The wire's figure wins; without one, zero equity has no finite leverage (∞),
// and a LONG's positive equity derives it as size / equity — both raw collateral units, since a long's
// collateral IS its exposure. A SHORT's equity is in the counter token while its size is the debt leg, so
// it has no such ratio and reports nothing without the wire's figure. undefined also where neither field
// parses, so the caller shows no figure rather than a guess.
export function marginCurrentLeverage(position: MarginActivePosition): number | undefined {
  const served = positionLeverage(position)
  if (served !== undefined) {
    return served
  }
  const equity = Number(position.equity)
  const size = Number(position.size)
  if (!Number.isFinite(equity) || position.equity.trim() === '') {
    return undefined
  }
  if (equity <= 0) {
    return Number.POSITIVE_INFINITY
  }
  if (position.direction !== MarginDirection.LONG) {
    return undefined
  }
  return Number.isFinite(size) && size >= 0 ? size / equity : undefined
}
