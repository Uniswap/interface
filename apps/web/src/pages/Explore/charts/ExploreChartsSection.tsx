import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart, refitChartContentAtom } from 'components/Charts/ChartModel'
import { ChartSkeleton } from 'components/Charts/LoadingState'
import { TVLChartModel } from 'components/Charts/StackedLineChart'
import { formatHistoryDuration } from 'components/Charts/VolumeChart'
import { CustomVolumeChartModel } from 'components/Charts/VolumeChart/CustomVolumeChartModel'
import { StackedHistogramData } from 'components/Charts/VolumeChart/renderer'
import { getCumulativeSum, getCumulativeVolume, getVolumeProtocolInfo } from 'components/Charts/VolumeChart/utils'
import { ChartType } from 'components/Charts/utils'
import { DataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { SupportedInterfaceChainId, chainIdToBackendChain, useChainFromUrlParam } from 'constants/chains'
import { useDailyProtocolTVL, useHistoricalProtocolVolume } from 'graphql/data/protocolStats'
import { TimePeriod, getProtocolColor, getProtocolGradient, getSupportedGraphQlChain } from 'graphql/data/util'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { useAtomValue } from 'jotai/utils'
import { useTheme } from 'lib/styled-components'
import { ReactNode, useMemo, useState } from 'react'
import {
  useDailyProtocolTVL as useRestDailyProtocolTVL,
  useHistoricalProtocolVolume as useRestHistoricalProtocolVolume,
} from 'state/explore/protocolStats'
import { EllipsisTamaguiStyle } from 'theme/components'
import { Flex, SegmentedControl, Text, styled } from 'ui/src'
import { HistoryDuration, PriceSource } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag, useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import { Trans } from 'uniswap/src/i18n'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const EXPLORE_CHART_HEIGHT_PX = 368
const EXPLORE_PRICE_SOURCES = [PriceSource.SubgraphV2, PriceSource.SubgraphV3]

const TIME_SELECTOR_OPTIONS = [{ value: TimePeriod.DAY }, { value: TimePeriod.WEEK }, { value: TimePeriod.MONTH }]

const ChartsContainer = styled(Flex, {
  row: true,
  justifyContent: 'space-between',
  maxWidth: MAX_WIDTH_MEDIA_BREAKPOINT,
  width: '100%',
  ml: 'auto',
  mr: 'auto',
  pb: 56,
})

// a 6% gap is achieved using two 47% width containers, as a parent gap causes an autosizing error with side-by-side lightweight-charts
const SectionContainer = styled(Flex, {
  position: 'relative',
  width: '47%',
  gap: '$gap4',
  ...EllipsisTamaguiStyle,
  $md: {
    backgroundColor: '$surface2',
    borderRadius: '$rounded20',
    height: 120,
    p: '$padding20',
  },
  $xs: {
    height: 112,
    p: '$padding16',
  },
})

const SectionTitle = styled(Text, {
  name: 'SectionTitle',
  fontWeight: '300',
  whiteSpace: 'nowrap',
  color: '$neutral2',
  lineHeight: 24,
})

function VolumeChartSection({ chainId }: { chainId: SupportedInterfaceChainId }) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.DAY)
  const theme = useTheme()
  const isSmallScreen = !useScreenSize()['sm']
  const { value: isMultichainExploreEnabledLoaded, isLoading: isMultichainExploreLoading } = useFeatureFlagWithLoading(
    FeatureFlags.MultichainExplore,
  )
  const isMultichainExploreEnabled = isMultichainExploreEnabledLoaded || isMultichainExploreLoading
  const refitChartContent = useAtomValue(refitChartContentAtom)

  function timeGranularityToHistoryDuration(timePeriod: TimePeriod): HistoryDuration {
    // note: timePeriod on the Explore Page represents the GRANULARITY, not the timespan of data shown.
    // i.e. timePeriod == D shows 1month data, timePeriod == W shows 1year data, timePeriod == M shows past 3Y data
    switch (timePeriod) {
      case TimePeriod.DAY:
      default:
        return HistoryDuration.Month
      case TimePeriod.WEEK:
        return HistoryDuration.Year
      case TimePeriod.MONTH:
        return HistoryDuration.Max
    }
  }

  const {
    entries: gqlEntries,
    loading: gqlLoading,
    dataQuality: gqlDataQuality,
  } = useHistoricalProtocolVolume(
    chainIdToBackendChain({ chainId, withFallback: true }),
    isSmallScreen ? HistoryDuration.Month : timeGranularityToHistoryDuration(timePeriod),
  )
  const {
    entries: restEntries,
    loading: restLoading,
    dataQuality: restDataQuality,
  } = useRestHistoricalProtocolVolume(
    isSmallScreen ? HistoryDuration.Month : timeGranularityToHistoryDuration(timePeriod),
  )
  const isRestExploreEnabled = useFeatureFlag(FeatureFlags.RestExplore)
  const { entries, loading, dataQuality } = isRestExploreEnabled
    ? { entries: restEntries, loading: restLoading, dataQuality: restDataQuality }
    : { entries: gqlEntries, loading: gqlLoading, dataQuality: gqlDataQuality }
  const params = useMemo<{
    data: StackedHistogramData[]
    colors: [string, string]
    useThinCrosshair: boolean
    headerHeight: number
    isMultichainExploreEnabled: boolean
    background: string
  }>(
    () => ({
      data: entries,
      colors: [theme.accent1, theme.accent3],
      headerHeight: isMultichainExploreEnabled ? 0 : 80,
      stale: dataQuality === DataQuality.STALE,
      useThinCrosshair: isMultichainExploreEnabled,
      isMultichainExploreEnabled,
      background: theme.background,
    }),
    [entries, theme.accent1, theme.accent3, theme.background, isMultichainExploreEnabled, dataQuality],
  )

  const cumulativeVolume = useMemo(() => getCumulativeVolume(entries), [entries])
  if (isSmallScreen) {
    return (
      <MinimalStatDisplay
        title={<Trans i18nKey="explore.uniVolume" />}
        value={cumulativeVolume}
        time={<Trans i18nKey="common.pastMonth" />}
      />
    )
  }

  return (
    <SectionContainer>
      <Flex row justifyContent="space-between" alignItems="center" mb="$spacing8">
        <SectionTitle>
          <Trans i18nKey="explore.uniVolume" />
        </SectionTitle>
        <SegmentedControl
          options={TIME_SELECTOR_OPTIONS}
          selectedOption={timePeriod}
          onSelectOption={(option) => {
            if (option === timePeriod) {
              refitChartContent?.()
            } else {
              setTimePeriod(option)
            }
          }}
          size="small"
        />
      </Flex>
      {(() => {
        if (dataQuality === DataQuality.INVALID) {
          const errorText = loading ? undefined : <Trans i18nKey="explore.unableToDisplayHistorical" />
          return (
            <ChartSkeleton hideYAxis type={ChartType.VOLUME} height={EXPLORE_CHART_HEIGHT_PX} errorText={errorText} />
          )
        }
        return (
          <Chart
            // TODO(WEB-4820): Remove key when Chart automatically updates to theme changes
            // Setting a key based on theme forces the chart to re-render when the theme changes
            key={`protocol-volume-chart-${theme.darkMode ? 'dark' : 'light'}`}
            Model={CustomVolumeChartModel<StackedHistogramData>}
            params={params}
            height={EXPLORE_CHART_HEIGHT_PX}
          >
            {(crosshairData) => (
              <ChartHeader
                value={crosshairData ? getCumulativeSum(crosshairData) : getCumulativeVolume(entries)}
                time={crosshairData?.time}
                timePlaceholder={formatHistoryDuration(timeGranularityToHistoryDuration(timePeriod))}
                protocolData={getVolumeProtocolInfo(crosshairData, EXPLORE_PRICE_SOURCES)}
              />
            )}
          </Chart>
        )
      })()}
    </SectionContainer>
  )
}

function TVLChartSection({ chainId }: { chainId: SupportedInterfaceChainId }) {
  const theme = useTheme()
  const isMultichainExploreEnabled = useFeatureFlag(FeatureFlags.MultichainExplore)
  const {
    entries: gqlEntries,
    loading: gqlLoading,
    dataQuality: gqlDataQuality,
  } = useDailyProtocolTVL(chainIdToBackendChain({ chainId }))
  const { entries: restEntries, loading: restLoading, dataQuality: restDataQuality } = useRestDailyProtocolTVL()
  const isRestExploreEnabled = useFeatureFlag(FeatureFlags.RestExplore)
  const { entries, loading, dataQuality } = isRestExploreEnabled
    ? { entries: restEntries, loading: restLoading, dataQuality: restDataQuality }
    : { entries: gqlEntries, loading: gqlLoading, dataQuality: gqlDataQuality }

  const lastEntry = entries[entries.length - 1]
  const params = useMemo(
    () => ({
      data: entries,
      colors: EXPLORE_PRICE_SOURCES?.map((source) => getProtocolColor(source, theme)) ?? [theme.accent1],
      gradients: isMultichainExploreEnabled
        ? EXPLORE_PRICE_SOURCES?.map((source) => getProtocolGradient(source))
        : undefined,
    }),
    [entries, isMultichainExploreEnabled, theme],
  )

  const isSmallScreen = !useScreenSize()['sm']
  if (isSmallScreen) {
    const currentTVL = lastEntry?.values.reduce((acc, curr) => acc + curr, 0)
    return <MinimalStatDisplay title={<Trans i18nKey="common.uniswapTVL" />} value={currentTVL} />
  }

  return (
    <SectionContainer>
      <SectionTitle color="$neutral2" mb="$spacing8">
        <Trans i18nKey="common.uniswapTVL" />
      </SectionTitle>
      {(() => {
        if (dataQuality === DataQuality.INVALID) {
          const errorText = loading ? undefined : <Trans i18nKey="explore.unableToDisplayHistoricalTVL" />
          return <ChartSkeleton hideYAxis type={ChartType.TVL} height={EXPLORE_CHART_HEIGHT_PX} errorText={errorText} />
        }

        return (
          <Chart Model={TVLChartModel} params={params} height={EXPLORE_CHART_HEIGHT_PX}>
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
          </Chart>
        )
      })()}
    </SectionContainer>
  )
}

function MinimalStatDisplay({ title, value, time }: { title: ReactNode; value: number; time?: ReactNode }) {
  const { formatFiatPrice } = useFormatter()

  return (
    <SectionContainer>
      <SectionTitle>{title}</SectionTitle>
      <Text variant="heading3">{formatFiatPrice({ price: value, type: NumberType.ChartFiatValue })}</Text>
      {time && (
        <Text variant="body4" fontWeight="200" color="$neutral2">
          {time}
        </Text>
      )}
    </SectionContainer>
  )
}

export function ExploreChartsSection() {
  const chain = getSupportedGraphQlChain(useChainFromUrlParam(), { fallbackToEthereum: true })

  return (
    <ChartsContainer>
      <TVLChartSection chainId={chain.id} />
      <VolumeChartSection chainId={chain.id} />
    </ChartsContainer>
  )
}
