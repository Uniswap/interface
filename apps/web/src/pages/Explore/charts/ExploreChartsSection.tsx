import { Trans } from '@lingui/macro'
import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart } from 'components/Charts/ChartModel'
import { StackedLineData, TVLChartModel } from 'components/Charts/StackedLineChart'
import {
  getCumulativeVolume,
  getVolumeProtocolInfo,
  StackedVolumeChartModel,
} from 'components/Charts/StackedVolumeChart'
import { StackedBarsData } from 'components/Charts/StackedVolumeChart/renderer'
import { getCumulativeSum } from 'components/Charts/StackedVolumeChart/stacked-bar-series'
import TimePeriodSelector from 'components/Charts/TimeSelector'
import { getTimePeriodDisplay } from 'components/Charts/VolumeChart'
import Column from 'components/Column'
import { RowBetween } from 'components/Row'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { PriceSource } from 'graphql/data/__generated__/types-and-hooks'
import { getProtocolColor, TimePeriod } from 'graphql/data/util'
import { useScreenSize } from 'hooks/useScreenSize'
import { HARDCODED_TVL_DATA, HARDCODED_VOLUME_DATA } from 'pages/Explore/charts/mockData'
import { ReactNode, useMemo, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const EXPLORE_CHART_HEIGHT_PX = 368
const EXPLORE_PRICE_SOURCES = [PriceSource.SubgraphV2, PriceSource.SubgraphV3]

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
const ChartsContainer = styled(RowBetween)`
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 56px;
`
// a 6% gap is achieved using two 47% width containers, as a parent gap causes an autosizing error with side-by-side lightweight-charts
const SectionContainer = styled(Column)`
  position: relative;
  width: 47%;
  gap: 4px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    background-color: ${({ theme }) => theme.surface2};
    border-radius: 20px;
    height: 120px;
    padding: 20px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.xs}px`}) {
    height: 112px;
    padding: 16px;
  }
`
const SectionTitle = styled(ThemedText.SubHeader)`
  color: ${({ theme }) => theme.neutral2};
  white-space: nowrap;
`
const StyledChart = styled(Chart)`
  height: ${EXPLORE_CHART_HEIGHT_PX}px;
` /* cast preserves generic Chart props that the `styled` return type looses: */ as typeof Chart

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

  const theme = useTheme()

  const params = useMemo<{ data: StackedBarsData[]; colors: [string, string] }>(
    () => ({ data: mockDataForTimePeriod, colors: [theme.accent1, theme.accent3] }),
    [mockDataForTimePeriod, theme]
  )
  const cumulativeVolume = useMemo(() => getCumulativeVolume(mockDataForTimePeriod), [mockDataForTimePeriod])

  const isSmallScreen = !useScreenSize()['sm']
  if (isSmallScreen) {
    return (
      <MinimalStatDisplay
        title={<Trans>Uniswap volume</Trans>}
        value={cumulativeVolume}
        time={<Trans>Past month</Trans>}
      />
    )
  }

  return (
    <SectionContainer>
      <RowBetween>
        <SectionTitle>
          <Trans>Uniswap volume</Trans>
        </SectionTitle>
        <div style={{ position: 'absolute', right: 0 }}>
          <StyledTimePeriodSelector
            options={TIME_SELECTOR_OPTIONS}
            timePeriod={timePeriod}
            onChangeTimePeriod={setTimePeriod}
          />
        </div>
      </RowBetween>
      <StyledChart Model={StackedVolumeChartModel} params={params}>
        {(crosshairData) => (
          <ChartHeader
            value={crosshairData ? getCumulativeSum(crosshairData) : getCumulativeVolume(mockDataForTimePeriod)}
            time={crosshairData?.time}
            timePlaceholder={getTimePeriodDisplay(timePeriod)}
            protocolData={getVolumeProtocolInfo(crosshairData, EXPLORE_PRICE_SOURCES)}
          />
        )}
      </StyledChart>
    </SectionContainer>
  )
}

function TVLChartSection({ data }: { data: StackedLineData[] }) {
  const theme = useTheme()
  const params = useMemo(
    () => ({
      data,
      colors: EXPLORE_PRICE_SOURCES?.map((source) => getProtocolColor(source, theme)) ?? [theme.accent1],
    }),
    [data, theme]
  )

  const lastEntry = data[data.length - 1]
  const isSmallScreen = !useScreenSize()['sm']
  if (isSmallScreen) {
    const currentTVL = lastEntry?.values.reduce((acc, curr) => acc + curr, 0)
    return <MinimalStatDisplay title={<Trans>Uniswap TVL</Trans>} value={currentTVL} time={<Trans>All time</Trans>} />
  }

  return (
    <SectionContainer>
      <SectionTitle>
        <Trans>Uniswap TVL</Trans>
      </SectionTitle>
      <StyledChart Model={TVLChartModel} params={params}>
        {(crosshairData) => (
          <ChartHeader
            value={(crosshairData ?? lastEntry)?.values.reduce((v, sum) => (sum += v), 0)}
            time={crosshairData?.time}
            protocolData={EXPLORE_PRICE_SOURCES?.map((source, index) => ({
              protocol: source,
              value: crosshairData?.values[index],
            }))}
          />
        )}
      </StyledChart>
    </SectionContainer>
  )
}

function MinimalStatDisplay({ title, value, time }: { title: ReactNode; value: number; time: ReactNode }) {
  const { formatFiatPrice } = useFormatter()

  return (
    <SectionContainer>
      <SectionTitle color="neutral2">{title}</SectionTitle>
      <ThemedText.HeadlineSmall fontSize="24px" lineHeight="32px">
        {formatFiatPrice({ price: value, type: NumberType.FiatTokenStatChartHeader })}
      </ThemedText.HeadlineSmall>
      <ThemedText.Caption color="neutral2">{time}</ThemedText.Caption>
    </SectionContainer>
  )
}

export function ExploreChartsSection() {
  return (
    <ChartsContainer>
      <TVLChartSection data={HARDCODED_TVL_DATA} />
      <VolumeChartSection data={HARDCODED_VOLUME_DATA} />
    </ChartsContainer>
  )
}
