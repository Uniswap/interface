import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import type { MarginMarket } from '~/constants/margin'
import {
  collateralHeld,
  rawToNumber,
  scaledE18ToNumber,
  usablePriceX18,
  usableWireBalance,
} from '~/pages/Swap/Margin/marginFormat'
import { marginPositionLegDebt } from '~/pages/Swap/Margin/marginPositionRow'

/**
 * The one PnL definition for a margin position, in USD.
 *
 * Unrealized PnL = current USD equity − the server's USD cost basis. The basis is frozen at what the
 * owner actually put in (see the backend's marginCostBasis fold); everything that is not a cash flow
 * — price moves, accrued interest, a leverage retarget — lands in the difference, which is where it
 * belongs. Nothing here re-derives a basis from a fill price or from an equity token count, both of
 * which move when the owner's money did not.
 *
 * "USD" is the stable leg: the debt token for a LONG, the collateral token for a SHORT. That is the
 * denomination the backend ships costBasisUsd and notionalUsd in, so no cross-leg conversion is
 * needed — only a decimal shift.
 */

// Percent floor. Equity reaches zero at lltv × liquidationPrice, so a worse-than-total loss is only
// reachable past a price the position would already have been liquidated at: the raw figure there is
// arithmetic, not a number the owner can experience. pnlPctRaw carries it for tests and reconciliation.
const MIN_PNL_PCT = -100

// A market's decimals for the two legs. Narrower than MarginMarket so fixtures stay small.
type MarginUsdMarket = Pick<MarginMarket, 'collateral' | 'debt'>

// A position's legs in display units plus the server's USD figures. Built once per position and
// evaluated at as many prices as the caller likes (the chart hovers one per candle).
export interface MarginUsdBasis {
  direction: MarginDirection
  // Collateral leg in its own token units; debt leg in its own token units.
  collateral: number
  debt: number
  // Pro-rata basis of the equity still in the position.
  costBasisUsd: number
  // Deposits minus withdrawals, no pro-rata: total P&L = equity − this.
  netContributedUsd?: number
  // Realized on mid-life withdrawals so far, signed.
  realizedPnlUsd?: number
}

export interface MarginUsdPnl {
  // Mark-to-market equity at the evaluated price.
  equityUsd: number
  pnlUsd: number
  // Floored at −100% (see MIN_PNL_PCT); pnlPctRaw is unfloored.
  pnlPct: number
  pnlPctRaw: number
  // True when the floor bound the reported percent — the position is past its liquidation price.
  floored: boolean
}

// Which leg carries the USD denomination, in that leg's decimals.
export function marginUsdDecimals({
  market,
  direction,
}: {
  market: MarginUsdMarket
  direction: MarginDirection
}): number {
  return direction === 'SHORT' ? market.collateral.decimals : market.debt.decimals
}

// A raw USD-denominated wire amount (costBasisUsd, realizedPnlUsd, notionalUsd) as a display number.
export function marginRawUsdToNumber({
  raw,
  market,
  direction,
}: {
  raw: string
  market: MarginUsdMarket
  direction: MarginDirection
}): number {
  return rawToNumber({ raw, decimals: marginUsdDecimals({ market, direction }) })
}

// The single mark source for a position's PnL: the position's own oraclePrice. The debt, health
// factor and liquidation price on the same row were all computed against it in one backend request,
// so pairing it with a mark from the markets poll would report an equity neither read agrees with.
// Always the volatile leg's USD price — the backend pre-inverts it for a SHORT.
export function marginPositionMark({
  position,
}: {
  position: Pick<MarginActivePosition, 'oraclePrice'>
}): number | undefined {
  // Through usablePriceX18 rather than re-deriving "parseable and positive" here: that helper owns the
  // rule, and its docstring says so. It validates the BigInt parse before returning the string, so the
  // decode below cannot throw the SyntaxError a bare `scaledE18ToNumber` would on '1.5' or '1e18'.
  const usable = usablePriceX18(position.oraclePrice)
  return usable === undefined ? undefined : scaledE18ToNumber(usable)
}

// undefined ⇒ report nothing at all. A missing or non-positive costBasisUsd means the server could
// not value the equity log (or has not re-indexed yet), and an untradable pair has no single USD leg,
// so its direction — and therefore every USD figure on the row — is a guess.
export function marginUsdBasis({
  position,
  market,
}: {
  position: MarginActivePosition
  market: MarginUsdMarket
}): MarginUsdBasis | undefined {
  if (position.isTradable === false || position.costBasisUsd === undefined) {
    return undefined
  }
  const direction = position.direction
  const costBasisUsd = marginRawUsdToNumber({ raw: position.costBasisUsd, market, direction })
  if (!(costBasisUsd > 0)) {
    return undefined
  }
  // `size` is always the exposure leg (a short's exposure IS its debt leg), so it's the venue-term
  // collateral for a LONG and the venue-term debt for a SHORT — direct either way, no reconstruction.
  //
  // Through the guarded BALANCE reader, not a bare rawToNumber: that returns 0 for '' and NaN for
  // garbage, and both reach the balance sheet — an empty `size` collapses a LONG's collateral to nothing
  // and prints a confident −100% on a healthy position. Not usableWireAmount either: a balance of
  // exactly 0 is real here (a debt-free short, a fully reduced long) and must not be refused.
  const exposureAmount = usableWireBalance({
    raw: position.size,
    decimals: direction === 'SHORT' ? market.debt.decimals : market.collateral.decimals,
  })
  const equityAmount = usableWireBalance({
    raw: position.equity,
    decimals: marginUsdDecimals({ market, direction }),
  })
  if (exposureAmount === undefined || equityAmount === undefined) {
    return undefined
  }
  // A SHORT's collateral (the stable leg) carries no raw balance on the wire — solved from the one
  // point the wire DOES give exactly, equity at the current oracle price, since collateral is a token
  // balance and doesn't move with price. A LONG needs no such step: `size` IS the collateral leg and
  // `legs[0].debt` IS the debt leg, both direct.
  //
  // Branching on direction FIRST so the LONG arm can read and refuse its own leg: the strict read is
  // what stops `marginPositionDebt`'s '0' fallback making a leg-less row look debt-FREE, and every
  // figure below is built on it — equity would omit the borrowed leg and break-even would collapse to
  // costBasis/collateral. Reporting nothing sends the row through marginPnlSuppression, which says why.
  let debt: number
  if (direction === 'SHORT') {
    debt = exposureAmount
  } else {
    const longDebtRaw = marginPositionLegDebt(position)
    if (longDebtRaw === undefined) {
      return undefined
    }
    // The guarded BALANCE reader, which accepts a real '0' — a settled leg is a fact, not an absence —
    // while refusing blank and garbage. `Number('')` is 0, so a blank leg would otherwise value a
    // levered LONG as debt-FREE: the exact overstatement the strict read above exists to prevent, which
    // on its own only closes the missing-leg case.
    const longDebt = usableWireBalance({ raw: longDebtRaw, decimals: market.debt.decimals })
    if (longDebt === undefined) {
      return undefined
    }
    debt = longDebt
  }
  // A SHORT's collateral is `equity + debt x mark`, so the mark is load-bearing on that branch and the
  // '0' sentinel collapses it to equity alone — a basis short by the whole debt leg, which the chart
  // tooltip then prices as a total loss on a healthy position. A LONG's collateral IS its exposure and
  // needs no mark, so only the SHORT branch refuses. Through the guarded reader for the same reason
  // marginPositionMark exists 70 lines up: the bare decoder passes '0' through as a real price.
  // Through collateralHeld rather than inline: it expresses this same solve, so the mark convention has
  // one owner instead of two copies that have to be changed together — including the refusal.
  const collateral = collateralHeld({
    direction,
    exposure: exposureAmount,
    equity: equityAmount,
    debt,
    mark: marginPositionMark({ position }),
  })
  if (collateral === undefined) {
    return undefined
  }
  return {
    direction,
    collateral,
    debt,
    costBasisUsd,
    ...(position.netContributedUsd !== undefined && {
      netContributedUsd: marginRawUsdToNumber({ raw: position.netContributedUsd, market, direction }),
    }),
    ...(position.realizedPnlUsd !== undefined && {
      realizedPnlUsd: marginRawUsdToNumber({ raw: position.realizedPnlUsd, market, direction }),
    }),
  }
}

// Mark-to-market equity in USD at a volatile-leg price. LONG: collateral is volatile (× P) against
// stable debt. SHORT: the mirror — collateral is already ≈USD, the debt is volatile.
export function marginUsdEquityAtPrice({ basis, price }: { basis: MarginUsdBasis; price: number }): number {
  return basis.direction === 'SHORT' ? basis.collateral - basis.debt * price : basis.collateral * price - basis.debt
}

// undefined at a non-positive price: a zero close on a thin candle would otherwise print a confident
// −(debt + basis) loss that the position never had.
export function marginUsdPnlAtPrice({
  basis,
  price,
}: {
  basis: MarginUsdBasis
  price: number
}): MarginUsdPnl | undefined {
  if (!(price > 0)) {
    return undefined
  }
  const equityUsd = marginUsdEquityAtPrice({ basis, price })
  const pnlUsd = equityUsd - basis.costBasisUsd
  const pnlPctRaw = (pnlUsd / basis.costBasisUsd) * 100
  const floored = pnlPctRaw < MIN_PNL_PCT
  return { equityUsd, pnlUsd, pnlPct: floored ? MIN_PNL_PCT : pnlPctRaw, pnlPctRaw, floored }
}

// PnL right now, at the position's own mark. The table's row figure and the chart legend's.
export function marginUsdPnlNow({
  position,
  market,
}: {
  position: MarginActivePosition
  market: MarginUsdMarket
}): MarginUsdPnl | undefined {
  const basis = marginUsdBasis({ position, market })
  const mark = marginPositionMark({ position })
  return basis && mark !== undefined ? marginUsdPnlAtPrice({ basis, price: mark }) : undefined
}

// Price at which equity is worth exactly the basis again — the honest break-even. Solving
// equity(P) = basis gives (basis + debt)/collateral for a LONG and (collateral − basis)/debt for a
// SHORT. undefined when the leg it divides by is empty (a fully closed or debt-free position) or the
// price would be non-positive.
export function marginUsdBreakEvenPrice({ basis }: { basis: MarginUsdBasis }): number | undefined {
  const price =
    basis.direction === 'SHORT'
      ? (basis.collateral - basis.costBasisUsd) / basis.debt
      : (basis.costBasisUsd + basis.debt) / basis.collateral
  return Number.isFinite(price) && price > 0 ? price : undefined
}
