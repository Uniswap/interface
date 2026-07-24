import { ChartPeriod, WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Coachmark, Flex, Text, useMedia } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { isLowVarianceRange } from 'uniswap/src/components/charts/utils'
import type { PortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { chartPeriodToTimeLabel } from 'uniswap/src/features/portfolio/chartPeriod'
import { BalanceUnavailableIndicator } from 'uniswap/src/features/portfolio/PortfolioBalance/BalanceUnavailableIndicator'
import { usePoolsBalanceCoachmarkVisibility } from 'uniswap/src/features/portfolio/PortfolioBalance/usePoolsBalanceCoachmarkVisibility'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { useHeaderDateFormatter } from '~/components/Charts/hooks/useHeaderDateFormatter'
import { PriceChartData } from '~/components/Charts/PriceChart'
import { PriceChartDelta } from '~/components/Charts/PriceChart/PriceChartDelta'
import { getCandlestickPriceBounds } from '~/components/Charts/PriceChart/utils'
import { useResolvedAddresses } from '~/pages/Portfolio/hooks/useResolvedAddresses'
import { BalanceBreakdownPopover } from '~/pages/Portfolio/Overview/BalanceBreakdownPopover/BalanceBreakdownPopover'
import { chartPeriodToHistoryDuration } from '~/pages/Portfolio/Overview/chartPeriodToHistoryDuration'
import { PortfolioChartCategory } from '~/pages/Portfolio/Overview/hooks/usePortfolioChartSeries'

type ChartPercentChange = ReturnType<typeof getPortfolioChartPercentChange>

interface PortfolioBalanceHeaderProps {
  portfolioTotalBalanceUSD: number | undefined
  tokensValue?: PortfolioTotalValue
  poolsValue?: PortfolioTotalValue
  earnValue?: PortfolioTotalValue
  /** Opt-in categories the backend omitted, so the displayed total is a partial sum. */
  unavailableCategories?: WalletBalanceCategory[]
  series: PriceChartData[]
  chartPercentChange: ChartPercentChange
  /** Period percent change per category, shown on the breakdown popover rows at rest. */
  tokensPercentChange: number | undefined
  poolsPercentChange: number | undefined
  earnPercentChange: number | undefined
  selectedPeriod: ChartPeriod
  selectedCategory: PortfolioChartCategory
  isPortfolioZero: boolean
  isLoading: boolean
  hoveredData?: PriceChartData
}

export function PortfolioBalanceHeader({
  portfolioTotalBalanceUSD,
  tokensValue,
  poolsValue,
  earnValue,
  unavailableCategories,
  series,
  chartPercentChange,
  tokensPercentChange,
  poolsPercentChange,
  earnPercentChange,
  selectedPeriod,
  selectedCategory,
  isPortfolioZero,
  isLoading,
  hoveredData,
}: PortfolioBalanceHeaderProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const formatHeaderDate = useHeaderDateFormatter()
  const { evmAddress, svmAddress, isExternalWallet } = useResolvedAddresses()
  // Only track / show against the viewer's own wallet — skip for read-only external views.
  const { shouldShow: shouldShowCoachmark, dismiss: dismissCoachmark } = usePoolsBalanceCoachmarkVisibility({
    evmAddress: isExternalWallet ? undefined : evmAddress,
    svmAddress: isExternalWallet ? undefined : svmAddress,
  })
  const media = useMedia()
  const coachmarkPlacement = media.md ? 'bottom-start' : 'right'
  // On mweb (bottom-start) shift the popover 8px up so it covers the subheader (PriceChartDelta) below.
  const coachmarkOffset = media.md ? { mainAxis: 8 } : undefined

  const latestChartData = series.length ? series[series.length - 1] : undefined
  const displayedChartData = hoveredData ?? latestChartData
  const zeroPortfolioBalance = isPortfolioZero ? 0 : undefined
  const isTotalCategory = selectedCategory === PortfolioChartCategory.Total
  const hasUnavailableCategory = (unavailableCategories?.length ?? 0) > 0
  // With a category omitted the backend drops the aggregate total, so fall back to the sum of the
  // categories that did resolve. `undefined` means the server omitted the field; `0` is a valid zero.
  const availableBalanceSum = useMemo(() => {
    const definedBalances = [tokensValue, poolsValue, earnValue]
      .map((value) => value?.balanceUSD)
      .filter((balanceUSD): balanceUSD is number => balanceUSD !== undefined)
    return definedBalances.length > 0 ? definedBalances.reduce((sum, balanceUSD) => sum + balanceUSD, 0) : undefined
  }, [tokensValue, poolsValue, earnValue])
  const fallbackBalanceUSD = hasUnavailableCategory ? availableBalanceSum : undefined
  const categoryBalanceUSD = useMemo(() => {
    switch (selectedCategory) {
      case PortfolioChartCategory.Tokens:
        return tokensValue?.balanceUSD
      case PortfolioChartCategory.Pools:
        return poolsValue?.balanceUSD
      case PortfolioChartCategory.Earn:
        return earnValue?.balanceUSD
      case PortfolioChartCategory.Total:
      default:
        return fallbackBalanceUSD ?? portfolioTotalBalanceUSD
    }
  }, [selectedCategory, tokensValue, poolsValue, earnValue, fallbackBalanceUSD, portfolioTotalBalanceUSD])
  const balance = hoveredData?.value ?? categoryBalanceUSD ?? latestChartData?.close ?? zeroPortfolioBalance
  const isHovering = !!hoveredData
  const showDelta = !isLoading && !isPortfolioZero && series.length >= 2 && !!displayedChartData
  const shouldTreatAsStablecoin = useMemo(() => {
    const { min, max } = getCandlestickPriceBounds(series)
    return isLowVarianceRange({ min, max, duration: chartPeriodToHistoryDuration(selectedPeriod) })
  }, [selectedPeriod, series])

  return (
    <Flex gap="$gap8" pb="$spacing4" testID={TestID.PortfolioBalanceHeader}>
      <Flex row alignItems="center" gap="$spacing8">
        <BalanceBreakdownPopover
          tokens={tokensValue}
          pools={poolsValue}
          earn={earnValue}
          tokensPercentChange={tokensPercentChange}
          poolsPercentChange={poolsPercentChange}
          earnPercentChange={earnPercentChange}
          disabled={!isTotalCategory}
        >
          <Coachmark
            open={shouldShowCoachmark}
            onDismiss={dismissCoachmark}
            placement={coachmarkPlacement}
            offset={coachmarkOffset}
            // Intentionally low so the pill scrolls behind the sticky page header.
            zIndex={zIndexes.default}
            text={t('portfolio.poolsBalance.coachmark.body')}
            testID={TestID.PoolsBalanceCoachmark}
          >
            <AnimatedNumber
              value={convertFiatAmountFormatted(balance, NumberType.PortfolioBalance)}
              numericValue={balance}
              loading={isLoading}
              textVariant="$heading2"
              color={isPortfolioZero ? '$neutral3' : '$neutral1'}
              disableAnimations={isHovering}
            />
          </Coachmark>
        </BalanceBreakdownPopover>
        {isTotalCategory && hasUnavailableCategory && unavailableCategories && (
          <BalanceUnavailableIndicator categories={unavailableCategories} />
        )}
      </Flex>
      {showDelta && (
        <Flex row gap="$gap8" alignItems="center">
          <PriceChartDelta
            startingPrice={series[0].close}
            endingPrice={displayedChartData.close}
            shouldIncludeFiatDelta
            shouldTreatAsStablecoin={shouldTreatAsStablecoin}
            pricePercentChange={chartPercentChange?.percentChange}
            isHovering={isHovering}
            colorText={isHovering}
            hidePercent={selectedPeriod === ChartPeriod.MAX}
          />
          {isHovering ? (
            <Text variant="subheading2" display="flex" alignItems="center" color="$neutral2">
              {formatHeaderDate(hoveredData.time)}
            </Text>
          ) : (
            <Text variant="body2" color="$neutral2" ml={-4}>
              {chartPeriodToTimeLabel(t, selectedPeriod).toLocaleLowerCase()}
            </Text>
          )}
        </Flex>
      )}
    </Flex>
  )
}
