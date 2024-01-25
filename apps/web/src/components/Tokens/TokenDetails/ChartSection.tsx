import { ParentSize } from '@visx/responsive'
import { PriceChart } from 'components/Charts/PriceChart'
import { StackedLineChart } from 'components/Charts/StackedLineChart'
import TimePeriodSelector from 'components/Charts/TimeSelector'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import { VolumeChart } from 'components/Charts/VolumeChart'
import { LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import { useInfoTDPEnabled } from 'featureFlags/flags/infoTDP'
import { TokenPriceQuery } from 'graphql/data/TokenPrice'
import { isPricePoint, PricePoint, TimePeriod } from 'graphql/data/util'
import { Suspense, useMemo } from 'react'
import styled from 'styled-components'
import { Z_INDEX } from 'theme/zIndex'

import { PriceChart as OldPriceChart } from '../../Charts/PriceChart/OldPriceChart'

const TDP_CHART_HEIGHT_PX = 380

export const ChartContainer = styled.div<{ isInfoTDPEnabled: boolean }>`
  display: flex;
  flex-direction: column;
  ${({ isInfoTDPEnabled }) => !isInfoTDPEnabled && 'height: 436px;'}
  ${({ isInfoTDPEnabled }) => !isInfoTDPEnabled && 'margin-bottom: : 24px;'}
  align-items: flex-start;
  width: 100%;
  position: relative;
`

const TimePeriodSelectorContainer = styled.div`
  position: absolute;
  top: 4px;
  right: 72px;
  z-index: ${Z_INDEX.active};

  @media only screen and (max-width: ${({ theme }) => theme.breakpoint.lg}px) {
    position: static;
    margin-top: 4px;
  }

  @media only screen and (max-width: ${({ theme }) => theme.breakpoint.xs}px) {
    width: 100%;
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
  chartType,
  priceChartType,
  timePeriod,
  onChangeTimePeriod,
  tokenPriceQuery,
  extractedColor,
}: {
  chartType: ChartType
  priceChartType: PriceChartType
  timePeriod: TimePeriod
  onChangeTimePeriod: (t: TimePeriod) => void
  tokenPriceQuery?: TokenPriceQuery
  extractedColor: string
}) {
  const isInfoTDPEnabled = useInfoTDPEnabled()

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
          extractedColor={extractedColor}
        />
        {isInfoTDPEnabled ? (
          <TimePeriodSelectorContainer>
            <TimePeriodSelector timePeriod={timePeriod} onChangeTimePeriod={onChangeTimePeriod} />
          </TimePeriodSelectorContainer>
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
  extractedColor,
}: {
  chartType: ChartType
  priceChartType: PriceChartType
  timePeriod: TimePeriod
  tokenPriceQuery: TokenPriceQuery
  extractedColor: string
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
      return (
        <VolumeChart volumes={prices} height={TDP_CHART_HEIGHT_PX} color={extractedColor} timePeriod={timePeriod} />
      )
    case ChartType.TVL:
      return <StackedLineChart height={TDP_CHART_HEIGHT_PX} />
    default:
      return null
  }
}
