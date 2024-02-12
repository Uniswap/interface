import TimePeriodSelector from 'components/Charts/TimeSelector'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import { VolumeChart } from 'components/Charts/VolumeChart'
import { ChartContainer } from 'components/Tokens/TokenDetails/ChartSection'
import { LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import { TimePeriod } from 'graphql/data/util'
import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { Z_INDEX } from 'theme/zIndex'

const PDP_CHART_HEIGHT_PX = 380

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

export default function ChartSection({
  chartType,
  priceChartType,
  feeTier,
  loading,
}: {
  chartType: ChartType
  priceChartType?: PriceChartType
  feeTier?: number
  loading: boolean
}) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.DAY)

  if (loading) {
    return <LoadingChart />
  }

  return (
    <ChartContainer isInfoTDPEnabled data-testid="pdp-chart-container">
      <Chart chartType={chartType} priceChartType={priceChartType} timePeriod={timePeriod} feeTier={feeTier} />
      <TimePeriodSelectorContainer>
        <TimePeriodSelector timePeriod={timePeriod} onChangeTimePeriod={setTimePeriod} />
      </TimePeriodSelectorContainer>
    </ChartContainer>
  )
}

const Chart = ({
  chartType,
  timePeriod,
  feeTier,
}: {
  chartType: ChartType
  priceChartType?: PriceChartType
  timePeriod: TimePeriod
  feeTier?: number
}) => {
  const mockVolumes = useMemo(
    () => [
      { value: Math.random() * 10e4, timestamp: 100123131 },
      { value: Math.random() * 10e4, timestamp: 100123531 },
      { value: Math.random() * 10e4, timestamp: 100123731 },
      { value: Math.random() * 10e4, timestamp: 100123931 },
      { value: Math.random() * 10e4, timestamp: 100124931 },
      { value: Math.random() * 10e4, timestamp: 100125931 },
      { value: Math.random() * 10e4, timestamp: 100127931 },
      { value: Math.random() * 10e4, timestamp: 100129931 },
      { value: Math.random() * 10e4, timestamp: 100130031 },
    ],
    // Mock data refresh on timePeriod change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timePeriod]
  )

  switch (chartType) {
    case ChartType.VOLUME:
      return (
        <VolumeChart height={PDP_CHART_HEIGHT_PX} volumes={mockVolumes} feeTier={feeTier} timePeriod={timePeriod} />
      )
    case ChartType.PRICE:
    case ChartType.LIQUIDITY:
    default:
      return <LoadingChart />
  }
}
