import { ParentSize } from '@visx/responsive'
import { PriceChart } from 'components/Charts/PriceChart'
import { StackedLineChart } from 'components/Charts/StackedLineChart'
import TimePeriodSelector, { refitChartContentAtom } from 'components/Charts/TimeSelector'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import { VolumeChart } from 'components/Charts/VolumeChart'
import { LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import { useInfoTDPEnabled } from 'featureFlags/flags/infoTDP'
import { TokenPriceQuery } from 'graphql/data/TokenPrice'
import { isPricePoint, PricePoint, TimePeriod } from 'graphql/data/util'
import { Suspense, useMemo, useState } from 'react'
import styled from 'styled-components'

import PillMultiToggle, { PillMultiToggleOption } from 'components/Toggle/PillMultiToggle'
import {
  DISPLAYS,
  getTimePeriodFromDisplay,
  ORDERED_TIMES,
  TimePeriodDisplay,
} from 'components/Tokens/TokenTable/TimeSelector'
import { useAtomValue } from 'jotai/utils'
import { PriceChart as OldPriceChart } from '../../Charts/PriceChart/OldPriceChart'
import { AdvancedPriceChartToggle } from './ChartTypeSelectors/AdvancedPriceChartToggle'
import { ChartTypeDropdown } from './ChartTypeSelectors/ChartTypeSelector'

const TDP_CHART_HEIGHT_PX = 356
const TDP_CHART_SELECTOR_OPTIONS = [ChartType.PRICE, ChartType.VOLUME, ChartType.TVL]

export const DEFAULT_PILL_TIME_SELECTOR_OPTIONS = ORDERED_TIMES.map((time: TimePeriod) => ({
  value: DISPLAYS[time],
})) as PillMultiToggleOption[]

export const ChartContainer = styled.div<{ isInfoTDPEnabled: boolean }>`
  display: flex;
  flex-direction: column;
  ${({ isInfoTDPEnabled }) => !isInfoTDPEnabled && 'height: 436px;'}
  ${({ isInfoTDPEnabled }) => !isInfoTDPEnabled && 'margin-bottom: 24px;'}
  ${({ isInfoTDPEnabled }) => isInfoTDPEnabled && 'gap: 12px;'}
  align-items: flex-start;
  width: 100%;
  position: relative;
`
export const ChartActionsContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 32px;
  justify-content: space-between;
  align-items: center;

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

export function usePriceHistory(tokenPriceData: TokenPriceQuery | undefined): PricePoint[] | undefined {
  // Appends the current price to the end of the priceHistory array
  const priceHistory = useMemo(() => {
    const market = tokenPriceData?.token?.market
    const priceHistory = market?.priceHistory?.filter(isPricePoint)
    const currentPrice = market?.price?.value
    if (Array.isArray(priceHistory) && currentPrice !== undefined) {
      const timestamp = Date.now() / 1000
      return [...priceHistory, { timestamp, value: currentPrice }]
    }
    return priceHistory
  }, [tokenPriceData])

  return priceHistory
}

export default function ChartSection({
  timePeriod,
  onChangeTimePeriod,
  tokenPriceQuery,
}: {
  timePeriod: TimePeriod
  onChangeTimePeriod: (t: TimePeriod) => void
  tokenPriceQuery?: TokenPriceQuery
}) {
  const isInfoTDPEnabled = useInfoTDPEnabled()

  const refitChartContent = useAtomValue(refitChartContentAtom)

  const [chartType, setChartType] = useState<ChartType>(ChartType.PRICE)
  const [priceChartType, setPriceChartType] = useState<PriceChartType>(PriceChartType.LINE)

  if (!tokenPriceQuery) {
    return <LoadingChart />
  }

  return (
    <Suspense fallback={<LoadingChart />}>
      <ChartContainer isInfoTDPEnabled={isInfoTDPEnabled} data-testid="chart-container">
        <Chart
          chartType={chartType}
          priceChartType={priceChartType}
          timePeriod={timePeriod}
          tokenPriceQuery={tokenPriceQuery}
        />
        {isInfoTDPEnabled ? (
          <ChartActionsContainer>
            <TimePeriodSelectorContainer>
              <PillMultiToggle
                options={DEFAULT_PILL_TIME_SELECTOR_OPTIONS}
                currentSelected={DISPLAYS[timePeriod]}
                onSelectOption={(option) => {
                  const time = getTimePeriodFromDisplay(option as TimePeriodDisplay)
                  if (time === timePeriod) {
                    refitChartContent?.()
                  } else {
                    onChangeTimePeriod(time)
                  }
                }}
              />
            </TimePeriodSelectorContainer>
            <ChartTypeSelectorContainer>
              {chartType === ChartType.PRICE && (
                <AdvancedPriceChartToggle currentChartType={priceChartType} onChartTypeChange={setPriceChartType} />
              )}
              <ChartTypeDropdown
                options={TDP_CHART_SELECTOR_OPTIONS}
                currentChartType={chartType}
                onSelectOption={(c: ChartType) => {
                  setChartType(c)
                  if (c === ChartType.PRICE) setPriceChartType(PriceChartType.LINE)
                }}
              />
            </ChartTypeSelectorContainer>
          </ChartActionsContainer>
        ) : (
          <TimePeriodSelector timePeriod={timePeriod} onChangeTimePeriod={onChangeTimePeriod} />
        )}
      </ChartContainer>
    </Suspense>
  )
}

function Chart({
  chartType,
  priceChartType,
  timePeriod,
  tokenPriceQuery,
}: {
  chartType: ChartType
  priceChartType: PriceChartType
  timePeriod: TimePeriod
  tokenPriceQuery: TokenPriceQuery
}) {
  const prices = usePriceHistory(tokenPriceQuery)

  const isInfoTDPEnabled = useInfoTDPEnabled()
  if (!isInfoTDPEnabled) {
    return (
      <ParentSize>
        {({ width }) => (
          <OldPriceChart prices={prices} width={width} height={TDP_CHART_HEIGHT_PX} timePeriod={timePeriod} />
        )}
      </ParentSize>
    )
  }

  switch (chartType) {
    case ChartType.PRICE:
      return <PriceChart prices={prices} height={TDP_CHART_HEIGHT_PX} type={priceChartType} />
    case ChartType.VOLUME:
      return <VolumeChart volumes={prices} height={TDP_CHART_HEIGHT_PX} timePeriod={timePeriod} />
    case ChartType.TVL:
      return <StackedLineChart height={TDP_CHART_HEIGHT_PX} />
    default:
      return null
  }
}
