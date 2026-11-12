import { useMemo, useState } from 'react'
import { TimePeriod } from '~/data/util'
import type { TokenPriceChartQueryVariables } from '~/hooks/useTokenPriceChartData'
import { ChartType, PriceChartType } from '~/utils/charts'
import { DEFAULT_TOKEN_CHART_TIME_PERIOD } from '~/utils/tokenQueryOptions'

export type TokenDetailsChartType = ChartType.PRICE | ChartType.VOLUME | ChartType.TVL

export type TDPChartQueryVariables = TokenPriceChartQueryVariables

export type TDPChartState = {
  chartType: TokenDetailsChartType
  setChartType: (chartType: TokenDetailsChartType) => void
  timePeriod: TimePeriod
  setTimePeriod: (timePeriod: TimePeriod) => void
  priceChartType: PriceChartType
  setPriceChartType: (priceChartType: PriceChartType) => void
  disableCandlestickUI: boolean
  setDisableCandlestickUI: (disable: boolean) => void
}

/** Price chart type for rendering and toggles when candlestick is not available; keeps `priceChartType` in store. */
export function getDisplayPriceChartType(
  priceChartType: PriceChartType,
  disableCandlestickUI: boolean,
): PriceChartType {
  return disableCandlestickUI ? PriceChartType.LINE : priceChartType
}

/** Chart UI state only; data hooks run in `TDP*ChartPanel` components. Access via `useTDPStore`. */
export function useCreateTDPChartState(): TDPChartState {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(DEFAULT_TOKEN_CHART_TIME_PERIOD)
  const [chartType, setChartType] = useState<TokenDetailsChartType>(ChartType.PRICE)
  const [priceChartType, setPriceChartType] = useState<PriceChartType>(PriceChartType.LINE)
  const [disableCandlestickUI, setDisableCandlestickUI] = useState(false)

  return useMemo(
    (): TDPChartState => ({
      chartType,
      setChartType,
      timePeriod,
      setTimePeriod,
      priceChartType,
      setPriceChartType,
      disableCandlestickUI,
      setDisableCandlestickUI,
    }),
    [chartType, disableCandlestickUI, priceChartType, timePeriod],
  )
}
