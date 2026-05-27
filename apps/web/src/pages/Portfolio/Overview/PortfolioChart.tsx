import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SegmentedControl,
  SegmentedControlOption,
  Separator,
  styled,
  Text,
  useMedia,
  useSporeColors,
} from 'ui/src'
import type { PortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  CHART_PERIOD_OPTIONS,
  chartPeriodToElementName,
  chartPeriodToLabel,
  chartPeriodToTestIdSuffix,
  chartPeriodToTimeLabel,
} from 'uniswap/src/features/portfolio/chartPeriod'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { PriceChart, PriceChartBody, PriceChartData } from '~/components/Charts/PriceChart'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'
import { chartPeriodToHistoryDuration } from '~/pages/Portfolio/Overview/chartPeriodToHistoryDuration'
import { PortfolioBalanceHeader } from '~/pages/Portfolio/Overview/PortfolioBalanceHeader'

type ChartPercentChange = ReturnType<typeof getPortfolioChartPercentChange>

const ChartContainer = styled(Flex, {
  width: '100%',
})

const CHART_HEIGHT = 300
const UNFUNDED_CHART_SKELETON_HEIGHT = 275

interface PortfolioChartProps {
  isPortfolioZero: boolean
  series: PriceChartData[]
  chartPercentChange: ChartPercentChange
  isLoading: boolean
  isChartEmpty: boolean
  error?: Error | null
  selectedPeriod: ChartPeriod
  setSelectedPeriod: (period: ChartPeriod) => void
  onHoverPeriod?: (period: ChartPeriod) => void
  portfolioTotalBalanceUSD?: number
  tokensValue?: PortfolioTotalValue
  poolsValue?: PortfolioTotalValue
  isTotalValueMatch: boolean
  /** portfolio_pools_balances flag: when removed, make this the default and drop the legacy chart-internal header path. */
  showBalanceHeaderRow?: boolean
}

export function PortfolioChart({
  isPortfolioZero,
  series,
  chartPercentChange,
  isLoading,
  isChartEmpty,
  error,
  portfolioTotalBalanceUSD,
  tokensValue,
  poolsValue,
  selectedPeriod,
  setSelectedPeriod,
  onHoverPeriod,
  isTotalValueMatch,
  showBalanceHeaderRow,
}: PortfolioChartProps): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const colors = useSporeColors()
  const isDemoView = useShowDemoView()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const locale = useCurrentLocale()
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const [hoveredChartData, setHoveredChartData] = useState<PriceChartData | undefined>(undefined)
  const periodOptions = useMemo<Array<SegmentedControlOption<string>>>(() => {
    return CHART_PERIOD_OPTIONS.map((period) => ({
      value: String(period),
      wrapper: <Trace key={`${period}-trace`} logPress element={chartPeriodToElementName(period)} />,
      display: (
        <Flex data-testid={`${TestID.PortfolioChartPeriodPrefix}${chartPeriodToTestIdSuffix(period)}`}>
          <Text variant="buttonLabel4" color={period === selectedPeriod ? undefined : '$neutral2'}>
            {chartPeriodToLabel(t, period)}
          </Text>
        </Flex>
      ),
    }))
  }, [selectedPeriod, t])

  // Determine color based on portfolio balance change
  const chartColor = useMemo(() => {
    if (series.length < 2) {
      return colors.accent1.val
    }
    const firstValue = series[0].close
    const lastValue = series[series.length - 1].close
    if (lastValue > firstValue) {
      return colors.statusSuccess.val
    }
    if (lastValue < firstValue) {
      return colors.statusCritical.val
    }
    return colors.statusSuccess.val
  }, [series, colors])

  const isDisabled = isPortfolioZero || !!error

  // Custom y-axis formatter that removes decimals
  const yAxisFormatter = useMemo(() => {
    return (price: number): string => {
      const rounded = Math.floor(price)
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: appFiatCurrencyInfo.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      return formatter.format(rounded)
    }
  }, [locale, appFiatCurrencyInfo.code])

  const bodyProps = {
    data: series,
    height: CHART_HEIGHT,
    type: PriceChartType.LINE,
    stale: false,
    timePeriod: chartPeriodToHistoryDuration(selectedPeriod),
    overrideColor: chartColor,
    hideYAxis: !isTotalValueMatch,
    yAxisFormatter,
  }

  const shouldShowBalanceHeader = showBalanceHeaderRow && !isPortfolioZero

  useEffect(() => {
    if (!shouldShowBalanceHeader || error || isLoading || isChartEmpty) {
      setHoveredChartData(undefined)
    }
  }, [error, isChartEmpty, isLoading, shouldShowBalanceHeader])

  useEffect(() => {
    setHoveredChartData(undefined)
  }, [selectedPeriod])

  return (
    <Flex gap="$gap12" grow shrink testID={TestID.PortfolioTotalBalance}>
      {shouldShowBalanceHeader && (
        <PortfolioBalanceHeader
          portfolioTotalBalanceUSD={portfolioTotalBalanceUSD}
          tokensValue={tokensValue}
          poolsValue={poolsValue}
          series={series}
          chartPercentChange={chartPercentChange}
          selectedPeriod={selectedPeriod}
          isPortfolioZero={isPortfolioZero}
          isLoading={isLoading}
          hoveredData={hoveredChartData}
        />
      )}
      {error ? (
        <ChartContainer centered grow shrink>
          <ChartSkeleton
            type={ChartType.PRICE}
            height={CHART_HEIGHT}
            errorText={t('portfolio.overview.chart.errorText')}
          />
        </ChartContainer>
      ) : isLoading ? (
        <ChartContainer centered grow shrink>
          <ChartSkeleton type={ChartType.PRICE} height={CHART_HEIGHT} />
        </ChartContainer>
      ) : isPortfolioZero || isChartEmpty ? (
        <Flex
          height={UNFUNDED_CHART_SKELETON_HEIGHT}
          position="relative"
          data-testid={TestID.PortfolioOverviewEmptyBalance}
        >
          {!shouldShowBalanceHeader && (
            <Text variant="heading1" color="$neutral3">
              {convertFiatAmountFormatted(0, NumberType.PortfolioBalance)}
            </Text>
          )}
          <Separator borderBottomWidth={3} borderColor="$surface3" position="absolute" top="60%" left="0" right="0" />
        </Flex>
      ) : (
        <Flex pointerEvents={isTotalValueMatch ? 'auto' : 'none'}>
          {shouldShowBalanceHeader ? (
            <PriceChartBody {...bodyProps} onCrosshairChange={setHoveredChartData} />
          ) : (
            <PriceChart
              {...bodyProps}
              headerTotalValueOverride={portfolioTotalBalanceUSD}
              pricePercentChange={chartPercentChange?.percentChange}
              hidePercentDelta={selectedPeriod === ChartPeriod.MAX}
              additionalHeaderContent={({ isHovering }) =>
                isHovering ? null : (
                  <Text variant="body2" color="$neutral2" ml={-4}>
                    {chartPeriodToTimeLabel(t, selectedPeriod).toLocaleLowerCase()}
                  </Text>
                )
              }
            />
          )}
        </Flex>
      )}
      <Flex
        $md={{ width: '100%' }}
        opacity={isPortfolioZero ? 0.5 : 1}
        pointerEvents={isPortfolioZero || isDemoView ? 'none' : 'auto'}
      >
        <SegmentedControl
          disabled={isDisabled}
          fullWidth={media.md}
          options={periodOptions}
          selectedOption={String(selectedPeriod)}
          onSelectOption={(periodStr: string) => setSelectedPeriod(Number(periodStr) as ChartPeriod)}
          onHoverOption={
            onHoverPeriod ? (periodStr: string) => onHoverPeriod(Number(periodStr) as ChartPeriod) : undefined
          }
        />
      </Flex>
    </Flex>
  )
}
