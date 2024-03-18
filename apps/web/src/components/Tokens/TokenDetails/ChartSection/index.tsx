import { PriceChart, PriceChartData } from 'components/Charts/PriceChart'
import { LineChart, StackedLineData } from 'components/Charts/StackedLineChart'
import { refitChartContentAtom } from 'components/Charts/TimeSelector'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import { VolumeChart } from 'components/Charts/VolumeChart'
import { TimePeriod, toHistoryDuration } from 'graphql/data/util'
import { useMemo, useState } from 'react'
import styled from 'styled-components'

import { Trans } from '@lingui/macro'
import { ChartSkeleton } from 'components/Charts/LoadingState'
import { SingleHistogramData } from 'components/Charts/VolumeChart/renderer'
import PillMultiToggle, { PillMultiToggleOption } from 'components/Toggle/PillMultiToggle'
import {
  DISPLAYS,
  getTimePeriodFromDisplay,
  ORDERED_TIMES,
  TimePeriodDisplay,
} from 'components/Tokens/TokenTable/TimeSelector'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { useAtomValue } from 'jotai/utils'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { AdvancedPriceChartToggle } from './AdvancedPriceChartToggle'
import { ChartTypeDropdown } from './ChartTypeSelector'
import { useTDPPriceChartData, useTDPTVLChartData, useTDPVolumeChartData } from './hooks'
import { ChartQueryResult, DataQuality } from './util'

export const TDP_CHART_HEIGHT_PX = 356
const TDP_CHART_SELECTOR_OPTIONS = [ChartType.PRICE, ChartType.VOLUME, ChartType.TVL] as const
type TokenDetailsChartType = (typeof TDP_CHART_SELECTOR_OPTIONS)[number]

export const DEFAULT_PILL_TIME_SELECTOR_OPTIONS = ORDERED_TIMES.map((time: TimePeriod) => ({
  value: DISPLAYS[time],
})) as PillMultiToggleOption[]

export const ChartActionsContainer = styled.div`
  display: flex;
  flex-direction: row-reverse;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;

  @media only screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    flex-direction: column;
    gap: 16px;
  }
`
const TimePeriodSelectorContainer = styled.div`
  @media only screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    width: 100%;
  }
`

const ChartTypeSelectorContainer = styled.div`
  display: flex;
  gap: 8px;
  @media only screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  }
`

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

const InvalidChartMessage = () => <Trans>Unable to display historical data for the current token.</Trans>

/** Exported to `TDPContext` to fire queries on pageload. `TDPChartState` should be accessed through `useTDPContext` rather than this hook. */
export function useCreateTDPChartState(tokenDBAddress: string | undefined, currencyChainName: Chain): TDPChartState {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.DAY)

  const [chartType, setChartType] = useState<TokenDetailsChartType>(ChartType.PRICE)
  const [priceChartType, setPriceChartType] = useState<PriceChartType>(PriceChartType.LINE)

  const variables = { address: tokenDBAddress, chain: currencyChainName, duration: toHistoryDuration(timePeriod) }

  const priceQuery = useTDPPriceChartData(variables, chartType !== ChartType.PRICE, priceChartType)
  const volumeQuery = useTDPVolumeChartData(variables, chartType !== ChartType.VOLUME)
  const tvlQuery = useTDPTVLChartData(variables, chartType !== ChartType.TVL)

  return useMemo(() => {
    const { disableCandlestickUI } = priceQuery
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

export default function ChartSection() {
  const { activeQuery, timePeriod, priceChartType } = useTDPContext().chartState

  return (
    <div data-cy={`tdp-${activeQuery.chartType}-chart-container`}>
      {(() => {
        if (activeQuery.dataQuality === DataQuality.INVALID) {
          return (
            <ChartSkeleton
              type={activeQuery.chartType}
              height={TDP_CHART_HEIGHT_PX}
              errorText={activeQuery.loading ? undefined : <InvalidChartMessage />}
            />
          )
        }

        const stale = activeQuery.dataQuality === DataQuality.STALE
        switch (activeQuery.chartType) {
          case ChartType.PRICE:
            return (
              <PriceChart data={activeQuery.entries} height={TDP_CHART_HEIGHT_PX} type={priceChartType} stale={stale} />
            )
          case ChartType.VOLUME:
            return (
              <VolumeChart
                data={activeQuery.entries}
                height={TDP_CHART_HEIGHT_PX}
                timePeriod={timePeriod}
                stale={stale}
              />
            )
          case ChartType.TVL:
            return <LineChart data={activeQuery.entries} height={TDP_CHART_HEIGHT_PX} stale={stale} />
        }
      })()}
      <ChartControls />
    </div>
  )
}

function ChartControls() {
  const {
    activeQuery,
    timePeriod,
    setTimePeriod,
    setChartType,
    priceChartType,
    setPriceChartType,
    disableCandlestickUI,
  } = useTDPContext().chartState
  const refitChartContent = useAtomValue(refitChartContentAtom)

  return (
    <ChartActionsContainer>
      <ChartTypeSelectorContainer>
        {activeQuery.chartType === ChartType.PRICE && (
          <AdvancedPriceChartToggle
            currentChartType={priceChartType}
            onChartTypeChange={setPriceChartType}
            disableCandlestickUI={disableCandlestickUI}
          />
        )}
        <ChartTypeDropdown
          options={TDP_CHART_SELECTOR_OPTIONS}
          currentChartType={activeQuery.chartType}
          onSelectOption={(c) => {
            setChartType(c)
            if (c === ChartType.PRICE) setPriceChartType(PriceChartType.LINE)
          }}
        />
      </ChartTypeSelectorContainer>
      <TimePeriodSelectorContainer>
        <PillMultiToggle
          options={DEFAULT_PILL_TIME_SELECTOR_OPTIONS}
          currentSelected={DISPLAYS[timePeriod]}
          onSelectOption={(option) => {
            const time = getTimePeriodFromDisplay(option as TimePeriodDisplay)
            if (time === timePeriod) {
              refitChartContent?.()
            } else {
              setTimePeriod(time)
            }
          }}
        />
      </TimePeriodSelectorContainer>
    </ChartActionsContainer>
  )
}
