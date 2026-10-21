import type { MarginPosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginMarket } from '~/constants/margin'
import {
  hasMarginPositionBasis,
  isMarginActivePosition,
  marginPositionDebt,
} from '~/pages/Swap/Margin/marginPositionRow'
import { marginMarketDirection } from '~/pages/Swap/Margin/marginTokenDisplay'
import { marginPositionMark } from '~/pages/Swap/Margin/marginUsdPnl'

const SECONDS_PER_YEAR = 31_536_000

// Position SIZE in display space, for the overlays that draw or label an amount. Raw token amounts are
// divided by their own leg's decimals: collateral in COLLATERAL-token units, debt in DEBT-token units.
// Valuation belongs to marginUsdPnl — nothing here is a basis.
export interface PositionEconomics {
  collateral: number
  collateralAtOpen: number // size at open, before any partial close (current `collateral` drifts down)
  debt: number
  direction: 'LONG' | 'SHORT'
}

// undefined when the position isn't ACTIVE or the server can't attribute a cost basis, which is where
// the at-open size lives.
export function positionEconomics({
  position,
  market,
}: {
  position: MarginPosition
  market: MarginMarket
}): PositionEconomics | undefined {
  if (!isMarginActivePosition(position) || !hasMarginPositionBasis(position)) {
    return undefined
  }
  const direction =
    market.direction ??
    marginMarketDirection({ collateralToken: market.collateral.address, debtToken: market.debt.address })
  // `size` is always the exposure leg (a short's exposure IS its debt leg), so it's the venue-term
  // collateral for a LONG, direct. A SHORT's collateral (the stable leg) carries no raw balance on the
  // wire — solved from equity at the current oracle price instead (mirrors marginUsdPnl's marginUsdBasis,
  // including its refusal: the mark is load-bearing on that branch, and the wire's '0' sentinel would
  // collapse the solve to equity alone, understating the position by its whole debt leg).
  const mark = marginPositionMark({ position })
  if (direction === 'SHORT' && mark === undefined) {
    return undefined
  }
  const exposureAmount =
    Number(position.size) / 10 ** (direction === 'SHORT' ? market.debt.decimals : market.collateral.decimals)
  const collateral =
    direction === 'SHORT'
      ? Number(position.equity) / 10 ** market.collateral.decimals + exposureAmount * (mark ?? 0)
      : exposureAmount
  return {
    collateral,
    // Total collateral at open (before partial closes) — the ▲-open marker's true size; current
    // `collateral` drifts down after a partial close.
    collateralAtOpen: Number(position.collateralAtOpen ?? '0') / 10 ** market.collateral.decimals,
    debt: Number(marginPositionDebt(position)) / 10 ** market.debt.decimals,
    direction,
  }
}

// Display-only live tick of accrued interest between positions polls: linear pro-rata growth on the
// current debt. Re-anchor to the wire value each poll; dtSeconds 0 returns accruedWire unchanged.
export function extrapolateAccrued({
  accruedWire,
  debt,
  apyBps,
  dtSeconds,
}: {
  accruedWire: number
  debt: number
  apyBps: number
  dtSeconds: number
}): number {
  return accruedWire + debt * (apyBps / 1e4) * (dtSeconds / SECONDS_PER_YEAR)
}
