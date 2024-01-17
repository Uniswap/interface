import { Trans } from '@lingui/macro'
import { StackedLineChart, StackedLineData } from 'components/Charts/StackedLineChart'
import { getCumulativeVolume, StackedVolumeChart } from 'components/Charts/StackedVolumeChart'
import { StackedBarsData } from 'components/Charts/StackedVolumeChart/renderer'
import TimePeriodSelector from 'components/Charts/TimeSelector'
import Column from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { PriceSource } from 'graphql/data/__generated__/types-and-hooks'
import { TimePeriod } from 'graphql/data/util'
import { useScreenSize } from 'hooks/useScreenSize'
import { HARDCODED_TVL_DATA, HARDCODED_VOLUME_DATA } from 'pages/Explore/charts/mockData'
import { ReactNode, useMemo, useState } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const EXPLORE_CHART_HEIGHT_PX = 368

const TIME_SELECTOR_OPTIONS = [
  { time: TimePeriod.DAY, display: 'D' },
  { time: TimePeriod.WEEK, display: 'W' },
  { time: TimePeriod.MONTH, display: 'M' },
]

const StyledTimePeriodSelector = styled(TimePeriodSelector)`
  & > button {
    padding: 4px 8px;
    margin: 4px 0px;
    font-size: 14px;
  }
`
const ChartsContainer = styled.div`
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 56px;

  /* Clearfix hack allows parent div to adjust to floated children height: https://www.w3schools.com/howto/howto_css_clearfix.asp */
  &::after {
    content: '';
    display: table;
    clear: both;
  }
`
// side-by-side lightweight-charts autosizing throws an error when aligned via grid or flex, so float is used instead.
const FloatContainer = styled.div<{ side: 'left' | 'right' }>`
  float: ${({ side }) => side};
  width: 48%;
  position: relative;
`
const MinimalDisplaysWrapper = styled(Row)`
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  width: 100%;
  gap: 20px;
  padding-bottom: 40px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.xs}px`}) {
    gap: 12px;
  }
`
const MinimalDisplayContainer = styled(Column)`
  gap: 4px;
  width: 100%;
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 20px;
  height: 120px;
  padding: 20px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.xs}px`}) {
    height: 112px;
    padding: 16px;
  }
`

function VolumeChartSection({ data }: { data: StackedBarsData[] }) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.DAY)

  const mockDataForTimePeriod = useMemo(() => {
    // note: timePeriod on the Explore Page represents the GRANULARITY, not the timespan of data shown.
    // i.e. timePeriod == D shows 1month data, timePeriod == W shows 1year data, timePeriod == M shows alltime data
    let numDataPoints = 0
    switch (timePeriod) {
      case TimePeriod.DAY:
        numDataPoints = 30
        break
      case TimePeriod.WEEK:
        numDataPoints = 52
        break
      case TimePeriod.MONTH:
        numDataPoints = 36
        break
    }

    return data.slice(-numDataPoints)
  }, [timePeriod, data])

  return (
    <FloatContainer side="right">
      <RowBetween>
        <ThemedText.SubHeader color="neutral2" marginBottom="4px">
          <Trans>Uniswap volume</Trans>
        </ThemedText.SubHeader>
        <div style={{ position: 'absolute', right: 0 }}>
          <StyledTimePeriodSelector
            options={TIME_SELECTOR_OPTIONS}
            timePeriod={timePeriod}
            onChangeTimePeriod={setTimePeriod}
          />
        </div>
      </RowBetween>
      <StackedVolumeChart height={EXPLORE_CHART_HEIGHT_PX} data={mockDataForTimePeriod} timePeriod={timePeriod} />
    </FloatContainer>
  )
}

function TVLChartSection({ data }: { data: StackedLineData[] }) {
  return (
    <FloatContainer side="left">
      <ThemedText.SubHeader color="neutral2" marginBottom="4px">
        <Trans>Uniswap TVL</Trans>
      </ThemedText.SubHeader>
      <StackedLineChart
        height={EXPLORE_CHART_HEIGHT_PX}
        data={data}
        sources={[PriceSource.SubgraphV2, PriceSource.SubgraphV3]}
      />
    </FloatContainer>
  )
}

function MinimalStatDisplay({ title, value, time }: { title: ReactNode; value: number; time: ReactNode }) {
  const { formatFiatPrice } = useFormatter()

  return (
    <MinimalDisplayContainer>
      <ThemedText.SubHeader color="neutral2">{title}</ThemedText.SubHeader>
      <ThemedText.HeadlineSmall fontSize="24px" lineHeight="32px">
        {formatFiatPrice({ price: value, type: NumberType.FiatTokenStatChartHeader })}
      </ThemedText.HeadlineSmall>
      <ThemedText.Caption color="neutral2">{time}</ThemedText.Caption>
    </MinimalDisplayContainer>
  )
}

export function ExploreChartsSection() {
  const isNarrowDisplay = !useScreenSize()['sm']

  if (isNarrowDisplay) {
    const currentTVL = HARDCODED_TVL_DATA[HARDCODED_TVL_DATA.length - 1].values.reduce((acc, curr) => acc + curr, 0)
    const cumulativeVolume = getCumulativeVolume(HARDCODED_VOLUME_DATA)

    return (
      <MinimalDisplaysWrapper>
        <MinimalStatDisplay title={<Trans>Uniswap TVL</Trans>} value={currentTVL} time={<Trans>All time</Trans>} />
        <MinimalStatDisplay
          title={<Trans>Uniswap volume</Trans>}
          value={cumulativeVolume}
          time={<Trans>Past month</Trans>}
        />
      </MinimalDisplaysWrapper>
    )
  }

  return (
    <ChartsContainer>
      <TVLChartSection data={HARDCODED_TVL_DATA} />
      <VolumeChartSection data={HARDCODED_VOLUME_DATA} />
    </ChartsContainer>
  )
}
