import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import type { MarginMarket } from '~/constants/margin'
import {
  projectedDebtAmount,
  quoteLiqDistanceSignedPct,
  scaledE18ToNumber,
  usablePriceX18,
  usableWireAmount,
} from '~/features/margin/utils/marginFormat'
import { MarginSwapSide, marginPriceImpactBps } from '~/pages/Swap/Margin/marginPriceImpact'

const DAYS_PER_YEAR = 365
const BPS_PER_PERCENT = 100

export interface MarginReceiptFigures {
  entryPrice?: number
  // The quote's oracle mark, which its liquidation price and health factor were computed against.
  oraclePrice?: number
  // Execution vs mark, adverse-only (marginPriceImpactBps clamps a favourable fill to 0).
  priceImpactBps?: number
  // Signed, negative when the fill is worse than the mark. Undefined when there is no mark to compare.
  entryImpactPct?: number
  liquidationPrice?: number
  liqDistancePct?: number
  healthFactor?: number
  // Debt-token units.
  borrowing?: number
  borrowApyPct?: number
  borrowPerDayUsd?: number
  // Collateral-token units bought by the leverage swap.
  collateralBought?: number
  breakEvenPrice?: number
  gasUsd?: number
  gasEth?: number
}

// Every numeric figure the open form's receipt shows, all from the one quote: its oracle mark is the
// snapshot its liquidation price and health factor were computed on, so the mark-relative figures can't
// drift from them. Pure, so the receipt component stays layout. Each figure is independently optional:
// one unusable wire field hides one row, never the receipt.
export function deriveMarginReceiptFigures({
  quote,
  market,
  direction,
}: {
  quote: MarginQuoteResponse
  market: MarginMarket
  direction: MarginDirection | undefined
}): MarginReceiptFigures {
  const usableEntry = usablePriceX18(quote.display.effectivePrice)
  const entryPrice = usableEntry ? scaledE18ToNumber(usableEntry) : undefined
  // Through usablePriceX18: the wire sends '0' where it means "could not price".
  const usableMark = usablePriceX18(quote.display.oraclePrice)
  const markPrice = usableMark ? scaledE18ToNumber(usableMark) : undefined
  const priceImpactBps = marginPriceImpactBps({
    execPriceX18: usableEntry,
    markPriceX18: usableMark,
    swapSide: MarginSwapSide.BUY_COLLATERAL,
    direction: direction ?? MarginDirection.LONG,
  })

  const usableLiq = usablePriceX18(quote.display.liquidationPrice)
  const liquidationPrice = usableLiq ? scaledE18ToNumber(usableLiq) : undefined
  // Against the ORACLE mark, not the fill: liquidation triggers off the oracle.
  const liqDistancePct = quoteLiqDistanceSignedPct({
    liquidationPriceX18: quote.display.liquidationPrice,
    markPriceX18: usableMark,
  })
  const usableHealth = usablePriceX18(quote.display.healthFactor)
  const healthFactor = usableHealth ? scaledE18ToNumber(usableHealth) : undefined

  const borrowing = projectedDebtAmount({ quote })
  const borrowApyPct = quote.display.borrowRate ? scaledE18ToNumber(quote.display.borrowRate) * 100 : undefined
  // A LONG borrows the stable leg (≈USD as-is); a SHORT borrows the volatile leg, valued at the mark —
  // or the fill when no mark is usable, the same fallback the size valuation takes.
  const volatilePrice = markPrice ?? entryPrice
  const debtUsd =
    borrowing === undefined
      ? undefined
      : direction === MarginDirection.SHORT
        ? volatilePrice === undefined
          ? undefined
          : borrowing * volatilePrice
        : borrowing
  const borrowPerDayUsd =
    debtUsd !== undefined && borrowApyPct !== undefined ? (debtUsd * (borrowApyPct / 100)) / DAYS_PER_YEAR : undefined

  const collateralToBuy = quote.legs.at(0)?.bounds.increase?.collateralToBuy
  const collateralBought =
    collateralToBuy === undefined
      ? undefined
      : usableWireAmount({ raw: collateralToBuy, decimals: market.collateral.decimals })

  // An estimate: the quote carries no explicit fee figure, so closing is assumed to pay the same
  // entry-vs-mark spread again. A long has to recover it upward, a short downward.
  const spreadFraction =
    entryPrice !== undefined && markPrice !== undefined ? Math.abs(entryPrice - markPrice) / markPrice : undefined
  const breakEvenPrice =
    entryPrice === undefined || spreadFraction === undefined
      ? undefined
      : direction === MarginDirection.SHORT
        ? entryPrice * (1 - spreadFraction)
        : entryPrice * (1 + spreadFraction)

  const gasFeeUsd = usablePriceX18(quote.gasEstimate?.gasFeeUsd)
  const gasUsd = gasFeeUsd === undefined ? undefined : scaledE18ToNumber(gasFeeUsd)
  const gasEth =
    quote.gasEstimate === undefined ? undefined : usableWireAmount({ raw: quote.gasEstimate.gasFeeWei, decimals: 18 })

  return {
    entryPrice,
    oraclePrice: markPrice,
    priceImpactBps,
    entryImpactPct: priceImpactBps === undefined || priceImpactBps <= 0 ? undefined : -priceImpactBps / BPS_PER_PERCENT,
    liquidationPrice,
    liqDistancePct,
    healthFactor,
    borrowing,
    borrowApyPct,
    borrowPerDayUsd,
    collateralBought,
    breakEvenPrice,
    gasUsd,
    gasEth,
  }
}
