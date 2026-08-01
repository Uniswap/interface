import { ChartPeriod, WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
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
import { useChartAnimatedColor } from '~/components/Charts/hooks/useChartAnimatedColor'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { PriceChart, PriceChartBody, PriceChartData } from '~/components/Charts/PriceChart'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'
import { ChartScrubBreakdown } from '~/pages/Portfolio/Overview/BalanceBreakdownPopover/ChartScrubBreakdown'
import { chartPeriodToHistoryDuration } from '~/pages/Portfolio/Overview/chartPeriodToHistoryDuration'
import { PortfolioChartCategory } from '~/pages/Portfolio/Overview/hooks/usePortfolioChartSeries'
import { PortfolioBalanceHeader } from '~/pages/Portfolio/Overview/PortfolioBalanceHeader'
import { PortfolioChartCategorySelector } from '~/pages/Portfolio/Overview/PortfolioChartCategorySelector'

type ChartPercentChange = ReturnType<typeof getPortfolioChartPercentChange>

const ChartContainer = styled(Flex, {
  width: '100%',
})

const CHART_HEIGHT = 300
const UNFUNDED_CHART_SKELETON_HEIGHT = 275

/**
 * Picks the chart line color from the net change between the series start and a reference value.
 * `reference` is the hovered point's value while scrubbing, or the last point at rest.
 */
function portfolioChartColor({
  colors,
  series,
  reference,
}: {
  colors: ReturnType<typeof useSporeColors>
  series: PriceChartData[]
  reference: number | undefined
}): string {
  if (series.length < 2) {
    return colors.accent1.val
  }
  const firstValue = series[0].close
  const referenceValue = reference ?? series[series.length - 1].close
  if (referenceValue < firstValue) {
    return colors.statusCritical.val
  }
  return colors.statusSuccess.val
}

interface PortfolioChartProps {
  isPortfolioZero: boolean
  series: PriceChartData[]
  /** Per-category series (shared timestamps) for the scrub breakdown overlay. */
  tokensSeries: PriceChartData[]
  poolsSeries: PriceChartData[]
  earnSeries: PriceChartData[]
  chartPercentChange: ChartPercentChange
  /** Period percent change per category, for the breakdown popover rows at rest. */
  tokensPercentChange: number | undefined
  poolsPercentChange: number | undefined
  earnPercentChange: number | undefined
  isLoading: boolean
  isChartEmpty: boolean
  error?: Error | null
  selectedPeriod: ChartPeriod
  setSelectedPeriod: (period: ChartPeriod) => void
  onHoverPeriod?: (period: ChartPeriod) => void
  portfolioTotalBalanceUSD?: number
  tokensValue?: PortfolioTotalValue
  poolsValue?: PortfolioTotalValue
  earnValue?: PortfolioTotalValue
  /** Opt-in categories the backend omitted, so the total is a partial sum shown with a warning. */
  unavailableCategories?: WalletBalanceCategory[]
  isTotalValueMatch: boolean
  /** portfolio_pools_balances flag: when removed, make this the default and drop the legacy chart-internal header path. */
  showBalanceHeaderRow?: boolean
  selectedCategory: PortfolioChartCategory
  setSelectedCategory: (category: PortfolioChartCategory) => void
  /** Non-total categories with data, in fixed display order — what the selector lists. */
  availableCategories: PortfolioChartCategory[]
  /** Gates the category selector; true only when at least two categories have data. */
  hasCategoryBreakdown: boolean
}

export function PortfolioChart({
  isPortfolioZero,
  series,
  tokensSeries,
  poolsSeries,
  earnSeries,
  chartPercentChange,
  tokensPercentChange,
  poolsPercentChange,
  earnPercentChange,
  isLoading,
  isChartEmpty,
  error,
  portfolioTotalBalanceUSD,
  tokensValue,
  poolsValue,
  earnValue,
  unavailableCategories,
  selectedPeriod,
  setSelectedPeriod,
  onHoverPeriod,
  isTotalValueMatch,
  showBalanceHeaderRow,
  selectedCategory,
  setSelectedCategory,
  availableCategories,
  hasCategoryBreakdown,
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

  // Static color from the period's net change (first vs last); used by the legacy chart path.
  const chartColor = useMemo(() => portfolioChartColor({ colors, series, reference: undefined }), [series, colors])
  // Scrub-aware target: while scrubbing, color by the hovered point vs the period start.
  const scrubAwareColorTarget = useMemo(
    () => portfolioChartColor({ colors, series, reference: hoveredChartData?.close }),
    [series, colors, hoveredChartData],
  )
  const animatedChartColor = useChartAnimatedColor(scrubAwareColorTarget)

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
    // New flag path animates toward the scrub-aware color; legacy path keeps the static color.
    overrideColor: showBalanceHeaderRow ? animatedChartColor : chartColor,
    hideYAxis: !isTotalValueMatch,
    yAxisFormatter,
  }

  const shouldShowBalanceHeader = showBalanceHeaderRow && !isPortfolioZero

  // Kept visible on error (grayed out below) so the controls row layout is stable; only hidden when there's no breakdown.
  const showCategorySelector = shouldShowBalanceHeader && hasCategoryBreakdown && !isLoading && !isChartEmpty

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
          earnValue={earnValue}
          unavailableCategories={unavailableCategories}
          series={series}
          chartPercentChange={chartPercentChange}
          tokensPercentChange={tokensPercentChange}
          poolsPercentChange={poolsPercentChange}
          earnPercentChange={earnPercentChange}
          selectedPeriod={selectedPeriod}
          selectedCategory={selectedCategory}
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
            errorTitle={t('portfolio.overview.chart.errorTitle')}
            errorText={t('portfolio.overview.chart.errorText')}
            errorColor={colors.surface3.val}
            errorBackgroundColor={colors.surface3Solid.val}
            errorBorderColor="transparent"
            // The balance header already renders the value from the separate wallet-balances call.
            hidePriceIndicators={shouldShowBalanceHeader}
          />
        </ChartContainer>
      ) : isLoading ? (
        <ChartContainer centered grow shrink>
          <ChartSkeleton type={ChartType.PRICE} height={CHART_HEIGHT} hidePriceIndicators={shouldShowBalanceHeader} />
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
            <PriceChartBody {...bodyProps} onCrosshairChange={setHoveredChartData}>
              {(crosshairData, hover) =>
                selectedCategory === PortfolioChartCategory.Total && hasCategoryBreakdown && crosshairData && hover ? (
                  <ChartScrubBreakdown
                    coordinates={hover}
                    time={crosshairData.time}
                    tokensSeries={tokensSeries}
                    earnSeries={earnSeries}
                    poolsSeries={poolsSeries}
                  />
                ) : null
              }
            </PriceChartBody>
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
        row
        alignItems="center"
        justifyContent="space-between"
        gap="$spacing8"
        $md={{ flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Flex
          $md={{ width: '100%' }}
          opacity={error ? 0.4 : isPortfolioZero ? 0.5 : 1}
          pointerEvents={error || isPortfolioZero || isDemoView ? 'none' : 'auto'}
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
        {showCategorySelector && (
          <Flex opacity={error ? 0.4 : 1} pointerEvents={error ? 'none' : 'auto'}>
            <PortfolioChartCategorySelector
              value={selectedCategory}
              availableCategories={availableCategories}
              onChange={setSelectedCategory}
            />
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
