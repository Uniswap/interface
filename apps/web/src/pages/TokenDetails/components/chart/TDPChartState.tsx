import { GraphQLApi } from '@universe/api'
import { useMemo, useState } from 'react'
import { TimePeriod, toHistoryDuration } from '~/appGraphql/data/util'
import { PriceChartData } from '~/components/Charts/PriceChart'
import { StackedLineData } from '~/components/Charts/StackedLineChart'
import { ChartQueryResult, ChartType, PriceChartType } from '~/components/Charts/utils'
import { SingleHistogramData } from '~/components/Charts/VolumeChart/utils'
import {
  useTDPPriceChartData,
  useTDPTVLChartData,
  useTDPVolumeChartData,
} from '~/pages/TokenDetails/components/chart/hooks'

type TokenDetailsChartType = ChartType.PRICE | ChartType.VOLUME | ChartType.TVL

/** Represents a variety of query result shapes, discriminated via additional `chartType` field. */
type ActiveQuery =
  | ChartQueryResult<PriceChartData, ChartType.PRICE>
  | ChartQueryResult<SingleHistogramData, ChartType.VOLUME>
  | ChartQueryResult<StackedLineData, ChartType.TVL>

export type TDPChartState = {
  /** Time controls for TDP Charts */
  timePeriod: TimePeriod
  setTimePeriod: (timePeriod: TimePeriod) => void
  /** Selectors for TDP Charts */
  setChartType: (chartType: TokenDetailsChartType) => void
  priceChartType: PriceChartType
  setPriceChartType: (priceChartType: PriceChartType) => void
  activeQuery: ActiveQuery
  /** Special-case: flag to disable candlestick toggle on tokens with invalid OHLC data  */
  disableCandlestickUI: boolean
}

/** Exported to `TDPContext` to fire queries on pageload. `TDPChartState` should be accessed through `useTDPContext` rather than this hook. */
export function useCreateTDPChartState(
  tokenDBAddress: string | undefined,
  currencyChainName: GraphQLApi.Chain,
): TDPChartState {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.DAY)

  const [chartType, setChartType] = useState<TokenDetailsChartType>(ChartType.PRICE)
  const [priceChartType, setPriceChartType] = useState<PriceChartType>(PriceChartType.LINE)

  const variables = { address: tokenDBAddress, chain: currencyChainName, duration: toHistoryDuration(timePeriod) }

  const priceQuery = useTDPPriceChartData({ variables, skip: chartType !== ChartType.PRICE, priceChartType })
  const volumeQuery = useTDPVolumeChartData(variables, chartType !== ChartType.VOLUME)
  const tvlQuery = useTDPTVLChartData(variables, chartType !== ChartType.TVL)

  return useMemo(() => {
    const { disableCandlestickUI } = priceQuery
    // eslint-disable-next-line consistent-return
    const activeQuery = (() => {
      switch (chartType) {
        case ChartType.PRICE:
          return priceQuery
        case ChartType.VOLUME:
          return volumeQuery
        case ChartType.TVL:
          return tvlQuery
      }
    })()

    return {
      timePeriod,
      setTimePeriod,
      setChartType,
      priceChartType: disableCandlestickUI ? PriceChartType.LINE : priceChartType,
      setPriceChartType,
      activeQuery,
      disableCandlestickUI,
    }
  }, [chartType, priceQuery, volumeQuery, tvlQuery, timePeriod, priceChartType])
}
