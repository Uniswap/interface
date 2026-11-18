import type { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { getLowVarianceAxisDecimals } from 'uniswap/src/components/charts/utils'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'
import { ChartHeader } from '~/components/Charts/ChartHeader'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { PriceChartDelta } from '~/components/Charts/PriceChart/PriceChartDelta'
import { getCandlestickPriceBounds } from '~/components/Charts/PriceChart/utils'
import { tryParseCurrencyAmount } from '~/lib/utils/tryParseCurrencyAmount'
import { ChartPriceText, PriceDisplayContainer } from '~/pages/PoolDetails/components/ChartSection/ChartPriceDisplay'
import { formatPriceWithSubscript } from '~/utils/formatPriceWithSubscript'
import { unwrappedToken } from '~/utils/unwrappedToken'

/**
 * The price axis precision for a series: stablecoin pools sit in a range too tight for the magnitude-based
 * formatter to resolve, so it's derived from the visible range to keep gridlines (and the header) distinct.
 */
export function useAxisFractionDigits(data: PriceChartData[]): number | undefined {
  return useMemo(() => {
    const { min, max } = getCandlestickPriceBounds(data)
    return getLowVarianceAxisDecimals(min, max)
  }, [data])
}

/**
 * The pool price chart's header: "1 A = x B", its USD value, and the change over the series. With
 * `crosshairData` it reads that point instead, without the USD value, which is only known for the latest.
 */
export function PdpPriceChartHeader({
  tokenA,
  tokenB,
  isReversed,
  data,
  crosshairData,
  fractionDigits,
}: {
  tokenA: Currency
  tokenB: Currency
  isReversed: boolean
  data: PriceChartData[]
  crosshairData?: PriceChartData
  fractionDigits?: number
}): JSX.Element {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const locale = useCurrentLocale()
  const [baseCurrency, quoteCurrency] = isReversed ? [tokenB, tokenA] : [tokenA, tokenB]
  const baseSymbol = unwrappedToken(baseCurrency).symbol ?? baseCurrency.symbol
  const quoteSymbol = unwrappedToken(quoteCurrency).symbol ?? quoteCurrency.symbol
  const lastPrice = data[data.length - 1]
  // The header re-renders on every crosshair move; keep the amount stable so useUSDCValue's memo holds.
  const lastPriceAmount = useMemo(
    () => tryParseCurrencyAmount(lastPrice.value.toString(), quoteCurrency),
    [lastPrice.value, quoteCurrency],
  )
  const price = useUSDCValue(lastPriceAmount)
  const displayValue = crosshairData ?? lastPrice

  const priceDisplay = (
    <PriceDisplayContainer>
      <ChartPriceText>
        {`1 ${baseSymbol} = ${formatPriceWithSubscript({
          price: displayValue.close,
          locale,
          formatNumberOrString,
          fractionDigits,
        })} ${quoteSymbol}`}
      </ChartPriceText>
      <ChartPriceText color="$neutral2">
        {price && !crosshairData
          ? '(' + convertFiatAmountFormatted(price.toSignificant(), NumberType.FiatTokenPrice) + ')'
          : ''}
      </ChartPriceText>
      <PriceChartDelta startingPrice={data[0].close} endingPrice={displayValue.close} />
    </PriceDisplayContainer>
  )
  return <ChartHeader value={priceDisplay} valueFormatterType={NumberType.FiatTokenPrice} time={crosshairData?.time} />
}
