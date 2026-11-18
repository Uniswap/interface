import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'
import {
  conversionCaptionEquity,
  liqDistanceSignedPct,
  marginHealthFromLeverage,
  scaledE18ToNumber,
  usablePriceX18,
} from '~/features/margin/utils/marginFormat'
import { useMarginStats24h } from '~/pages/Swap/Margin/chart/useMarginChartData'
import { estimateLiqPrice } from '~/pages/Swap/Margin/chart/useMarginChartOverlays'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { deriveMarginReceiptDetails, type MarginReceiptDetails } from '~/pages/Swap/Margin/marginReceiptDetails'
import { deriveMarginReceiptFigures, type MarginReceiptFigures } from '~/pages/Swap/Margin/marginReceiptFigures'
import { resolveVenueMarket } from '~/pages/Swap/Margin/marginRoutedMarket'

// What the receipt and the Size box show before (or without) a quote: the chart preview's estimate from
// the entered dollars, the leverage and the market's LLTV at the current mark (the chart's, else the
// markets feed's). So a wallet the server won't quote for still reads what the trade would be.
export function estimateMarginReceipt({
  derivedMarginInfo,
  mark,
}: {
  derivedMarginInfo: Pick<DerivedMarginInfo, 'market' | 'direction' | 'leverage' | 'paymentUsdValue'>
  mark: number | undefined
}): MarginReceiptFigures | undefined {
  const { market, leverage, paymentUsdValue } = derivedMarginInfo
  const direction = derivedMarginInfo.direction ?? MarginDirection.LONG
  const equityUsd = paymentUsdValue ? Number(paymentUsdValue.toExact()) : 0
  if (!mark || !(equityUsd > 0)) {
    return undefined
  }
  const isShort = direction === MarginDirection.SHORT
  const liquidationPrice = estimateLiqPrice({ entry: mark, leverage, lltvWad: market.lltvWad, direction })
  const size = (equityUsd * leverage) / mark
  return {
    entryPrice: mark,
    oraclePrice: mark,
    liquidationPrice,
    liqDistancePct:
      liquidationPrice === undefined ? undefined : liqDistanceSignedPct({ liqPrice: liquidationPrice, mark }),
    healthFactor: marginHealthFromLeverage({ leverage, lltvWad: market.lltvWad, direction }),
    // A short owes its whole exposure; a long borrows (L − 1)·E of the ≈$1 quote leg.
    borrowing: isShort ? size : equityUsd * Math.max(0, leverage - 1),
    size,
  }
}

export function useMarginReceiptEstimate(derivedMarginInfo: DerivedMarginInfo): MarginReceiptFigures | undefined {
  const { market, quote } = derivedMarginInfo
  const { getLive } = useMarginMarkets()
  const { markPrice: chartMark } = useMarginStats24h({ market })
  const liveMarkX18 = usablePriceX18(getLive(market.key)?.markPriceX18)
  const mark = chartMark && chartMark > 0 ? chartMark : liveMarkX18 ? scaledE18ToNumber(liveMarkX18) : undefined
  return quote ? undefined : estimateMarginReceipt({ derivedMarginInfo, mark })
}

// The open receipt's figures (the quote's, else the estimate's) and the tooltips' details on them.
export function useMarginReceiptDetails({
  derivedMarginInfo: info,
  routedVenue,
}: {
  derivedMarginInfo: DerivedMarginInfo
  // undefined while a bridged quote's venue is provisional.
  routedVenue: MarginVenue | undefined
}): {
  figures: MarginReceiptFigures
  details: MarginReceiptDetails
  equity: number | undefined
  borrowRatePct: number | undefined
} {
  const { quote, market, direction } = info
  const { getLive, getMarketByTokens } = useMarginMarkets()
  const slippageToleranceBps = useMarginFormStore((s) => s.slippageToleranceBps)
  const estimate = useMarginReceiptEstimate(info)
  const figures = quote ? deriveMarginReceiptFigures({ quote, market, direction }) : (estimate ?? {})
  const isQuoteStale = info.isDebouncing || info.isPlaceholderData
  const usd = Number(info.paymentUsdValue?.toExact() ?? Number.NaN)
  // The deposit in collateral units: as entered, the quote's expected equity, else at the estimate's mark.
  const equity = !info.isPaymentDifferentFromCollateral
    ? Number(info.paymentCurrencyAmount?.toExact() ?? Number.NaN)
    : quote
      ? conversionCaptionEquity({
          equityInRaw: quote.legs[0]?.bounds.increase?.expectedEquityDelta,
          decimals: market.collateral.decimals,
          isPaymentTokenCollateral: false,
          isQuoteStale,
        })
      : direction === MarginDirection.SHORT
        ? usd
        : usd / (figures.oraclePrice ?? Number.NaN)
  const live = getLive(resolveVenueMarket({ market, venue: routedVenue, getMarketByTokens })?.key)
  const feedRateBps = (quote ? live : getLive(market.key))?.borrowApyBps
  // The quote's rate, else the markets feed's for the routed venue (the form's before there is a quote).
  const borrowRatePct = figures.borrowApyPct ?? (feedRateBps === undefined ? undefined : feedRateBps / 100)
  const details = deriveMarginReceiptDetails({
    figures,
    isFillSettled: quote !== undefined && !isQuoteStale,
    // The leverage swap's pool fee at the routed venue, not the pay-in pre-swap's.
    poolFeeBps: live?.feeBps,
    direction,
    equity: Number.isFinite(equity) ? equity : undefined,
    isPaymentCollateral: !info.isPaymentDifferentFromCollateral,
    // The band the quote's floors were cut at (percent on the wire), else the form's.
    slippageBps: quote?.slippageTolerance === undefined ? slippageToleranceBps : quote.slippageTolerance * 100,
    leverage: info.leverage,
    venue: routedVenue ?? market.venue,
    borrowRatePct,
  })
  return { figures, details, equity: Number.isFinite(equity) ? equity : undefined, borrowRatePct }
}
