import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { collateralHeld } from '~/features/margin/utils/marginFormat'
import type { MarginReceiptFigures } from '~/pages/Swap/Margin/marginReceiptFigures'

// Static venue knowledge, not wire data: Aave closes only enough to restore health; Morpho liquidators
// usually take all of it and Compound v3 absorbs the account. Exhaustive, so a new venue states its style.
const LIQUIDATION_STYLES: Record<MarginVenue, 'partial' | 'full'> = {
  AAVE_V3: 'partial',
  AAVE_V4: 'partial',
  MORPHO: 'full',
  COMPOUND_V3: 'full',
}

export interface MarginReceiptDetails {
  entry: {
    mark?: number
    fill?: number
    // Fill vs mark signed as the trader's gain, net of the pool fee, so impact + fee adds up to the fill.
    impactPct?: number
    feePct?: number
    // A long paying with its collateral: the deposit at the mark blended with what the borrow bought.
    blend?: { paid: number; bought?: number; blended?: number }
    worstCase?: number
    slippageBps: number
  }
  liquidation: {
    style?: 'partial' | 'full'
    price?: number
    equityUsd?: number
    keptUsd?: number
    keptCollateral?: number
  }
  // Per unit of size. The collateral's supply APY isn't on the wire, so this is the borrow side only.
  leveragedRatePct?: number
  // Collateral-token units the position holds.
  collateral?: number
}

// What a liquidation at the quoted price leaves, before the venue's penalty (not on the wire yet).
function deriveLiquidation({
  isShort,
  size,
  debt,
  liq,
  collateral,
  venue,
}: {
  isShort: boolean
  size: number | undefined
  debt: number | undefined
  liq: number | undefined
  collateral: number | undefined
  venue: MarginVenue | undefined
}): MarginReceiptDetails['liquidation'] {
  const style = venue !== undefined && Object.hasOwn(LIQUIDATION_STYLES, venue) ? LIQUIDATION_STYLES[venue] : undefined
  const equityUsd =
    size === undefined || !liq
      ? undefined
      : isShort
        ? collateral === undefined
          ? undefined
          : collateral - size * liq
        : debt === undefined
          ? undefined
          : size * liq - debt
  if (equityUsd === undefined || !liq) {
    return { style, price: liq }
  }
  const keptUsd = Math.max(0, equityUsd)
  return { style, price: liq, equityUsd, keptUsd, keptCollateral: isShort ? keptUsd : keptUsd / liq }
}

// The receipt tooltips' figures. Prices are USD per exposure unit with the quote leg ≈ $1 (see
// collateralUsdValue). Each is undefined rather than guessed when an input is missing.
export function deriveMarginReceiptDetails({
  figures,
  isFillSettled,
  poolFeeBps,
  direction,
  equity,
  isPaymentCollateral,
  slippageBps,
  leverage,
  venue,
  borrowRatePct,
}: {
  figures: MarginReceiptFigures
  // A debounced or bridged quote's fill answers an earlier input.
  isFillSettled: boolean
  poolFeeBps: number | undefined
  direction: MarginDirection | undefined
  // The deposit, collateral-token units.
  equity: number | undefined
  isPaymentCollateral: boolean
  slippageBps: number
  leverage: number
  venue: MarginVenue | undefined
  borrowRatePct: number | undefined
}): MarginReceiptDetails {
  const isShort = direction === MarginDirection.SHORT
  const { oraclePrice: mark, size, borrowing: debt, liquidationPrice: liq } = figures
  const bought = isFillSettled ? figures.collateralBought : undefined
  const fill = isFillSettled ? figures.entryPrice : undefined
  const feePct = poolFeeBps === undefined ? undefined : poolFeeBps / 100
  const movePct = fill !== undefined && mark ? ((fill - mark) / mark) * 100 : undefined
  const slip = slippageBps / 10_000
  const worstFill = fill === undefined ? undefined : fill * (isShort ? 1 - slip : 1 + slip)
  const paid = !isShort && isPaymentCollateral ? equity : undefined
  const blendAt = (price: number | undefined): number | undefined =>
    paid === undefined || bought === undefined || mark === undefined || price === undefined || paid + bought <= 0
      ? undefined
      : (paid * mark + bought * price) / (paid + bought)

  // A long holds its size; a short its equity plus the sold debt marked back to collateral. A short's
  // equity is the current input, so it pairs with the quote's size only once the quote has settled.
  const collateral =
    equity !== undefined && bought !== undefined
      ? equity + bought
      : size === undefined || equity === undefined || (isShort && !isFillSettled)
        ? undefined
        : collateralHeld({ direction, exposure: size, equity, debt: size, mark: mark ?? fill })
  return {
    entry: {
      mark,
      fill,
      impactPct: movePct === undefined ? undefined : (isShort ? movePct : -movePct) + (feePct ?? 0),
      feePct,
      blend: paid === undefined ? undefined : { paid, bought, blended: blendAt(fill) },
      worstCase: paid === undefined ? worstFill : blendAt(worstFill),
      slippageBps,
    },
    liquidation: deriveLiquidation({ isShort, size, debt, liq, collateral, venue }),
    leveragedRatePct:
      borrowRatePct === undefined || !(leverage > 0)
        ? undefined
        : isShort
          ? borrowRatePct
          : borrowRatePct * (1 - 1 / leverage),
    collateral,
  }
}
