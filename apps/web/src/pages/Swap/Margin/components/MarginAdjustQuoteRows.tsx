import type { MarginActivePosition, MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { MarginBorrowingRow } from '~/pages/Swap/Margin/components/MarginAdjustBeforeAfterRows'
import { MarginPriceImpactRow } from '~/pages/Swap/Margin/components/MarginPriceImpactRow'
import { marginAdjustSwapSide, marginPriceImpactBps } from '~/pages/Swap/Margin/marginPriceImpact'

// Quote-derived rows for the adjust show-more section, shared by the add, withdraw, change-leverage
// and adjust-position modals — all four render exactly this set. The position supplies what the
// projected-only quote cannot: the oracle mark, and the debt this action is measured against.
export function MarginAdjustQuoteRows({
  quote,
  position,
  direction,
  debtDecimals,
  debtDisplaySymbol,
  logos,
  markIsStale,
}: {
  quote: MarginQuoteResponse
  position: MarginActivePosition
  direction: MarginDirection
  debtDecimals: number
  debtDisplaySymbol: string
  logos?: { url?: string; symbol: string }
  // Freshness of the position's mark, from the modal that owns the data reads — the impact figure is
  // fill-vs-MARK, and that mark is polled apart from the quote it is divided into.
  markIsStale: boolean
}): JSX.Element {
  const impactBps = marginPriceImpactBps({
    execPriceX18: quote.display.effectivePrice,
    markPriceX18: position.oraclePrice,
    swapSide: marginAdjustSwapSide(quote.legs.at(0)?.bounds),
    direction,
  })
  return (
    <>
      <MarginBorrowingRow
        quote={quote}
        position={position}
        debtDecimals={debtDecimals}
        debtDisplaySymbol={debtDisplaySymbol}
        logos={logos}
      />
      <MarginPriceImpactRow impactBps={impactBps} markIsStale={markIsStale} />
    </>
  )
}
