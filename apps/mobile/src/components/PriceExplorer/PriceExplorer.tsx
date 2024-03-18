import { ImpactFeedbackStyle } from 'expo-haptics'
import { memo, useMemo } from 'react'
import { I18nManager } from 'react-native'
import { SharedValue, useDerivedValue } from 'react-native-reanimated'
import { LineChart, LineChartProvider } from 'react-native-wagmi-charts'
import PriceExplorerAnimatedNumber from 'src/components/PriceExplorer/PriceExplorerAnimatedNumber'
import { PriceExplorerError } from 'src/components/PriceExplorer/PriceExplorerError'
import { DatetimeText, RelativeChangeText } from 'src/components/PriceExplorer/Text'
import { TimeRangeGroup } from 'src/components/PriceExplorer/TimeRangeGroup'
import { CURSOR_INNER_SIZE, CURSOR_SIZE } from 'src/components/PriceExplorer/constants'
import { useChartDimensions } from 'src/components/PriceExplorer/useChartDimensions'
import { useLineChartPrice } from 'src/components/PriceExplorer/usePrice'
import { Loader } from 'src/components/loading'
import { invokeImpact } from 'src/utils/haptic'
import { Flex } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { CurrencyId } from 'wallet/src/utils/currencyId'
import { PriceNumberOfDigits, TokenSpotData, useTokenPriceHistory } from './usePriceHistory'

type PriceTextProps = {
  loading: boolean
  relativeChange?: SharedValue<number>
  numberOfDigits: PriceNumberOfDigits
  spotPrice?: SharedValue<number>
}

function PriceTextSection({ loading, numberOfDigits, spotPrice }: PriceTextProps): JSX.Element {
  const price = useLineChartPrice(spotPrice)
  const currency = useAppFiatCurrencyInfo()
  const mx = spacing.spacing12

  return (
    <Flex mx={mx}>
      <PriceExplorerAnimatedNumber
        currency={currency}
        numberOfDigits={numberOfDigits}
        price={price}
      />
      <Flex row gap="$spacing4">
        <RelativeChangeText loading={loading} />
        <DatetimeText loading={loading} />
      </Flex>
    </Flex>
  )
}

export type LineChartPriceAndDateTimeTextProps = {
  currencyId: CurrencyId
}

export const PriceExplorer = memo(function PriceExplorer({
  currencyId,
  tokenColor,
  forcePlaceholder,
  onRetry,
}: {
  currencyId: string
  tokenColor?: string
  forcePlaceholder?: boolean
  onRetry: () => void
}): JSX.Element {
  const { data, loading, error, refetch, setDuration, selectedDuration, numberOfDigits } =
    useTokenPriceHistory(currencyId)

  const { convertFiatAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount().amount
  const shouldShowAnimatedDot =
    selectedDuration === HistoryDuration.Day || selectedDuration === HistoryDuration.Hour
  const additionalPadding = shouldShowAnimatedDot ? 40 : 0

  const { lastPricePoint, convertedPriceHistory } = useMemo(() => {
    const priceHistory = data?.priceHistory?.map((point) => {
      return { ...point, value: point.value * conversionRate }
    })

    const lastPoint = priceHistory ? priceHistory.length - 1 : 0

    return { lastPricePoint: lastPoint, convertedPriceHistory: priceHistory }
  }, [data, conversionRate])

  const convertedSpotValue = useDerivedValue(() => conversionRate * (data?.spot?.value?.value ?? 0))
  const convertedSpot = useMemo((): TokenSpotData | undefined => {
    return (
      data?.spot && {
        ...data?.spot,
        value: convertedSpotValue,
      }
    )
  }, [data, convertedSpotValue])

  if (
    !loading &&
    (!convertedPriceHistory || (!convertedSpot && selectedDuration === HistoryDuration.Day))
  ) {
    // Propagate retry up while refetching, if available
    const refetchAndRetry = (): void => {
      if (refetch) {
        refetch()
      }
      onRetry()
    }
    return <PriceExplorerError showRetry={error !== undefined} onRetry={refetchAndRetry} />
  }

  let content: JSX.Element | null
  if (forcePlaceholder) {
    content = <PriceExplorerPlaceholder />
  } else if (convertedPriceHistory?.length) {
    content = (
      // TODO(MOB-2308): add better loading state
      <Flex opacity={!loading ? 1 : 0.35}>
        <PriceExplorerChart
          additionalPadding={additionalPadding}
          lastPricePoint={lastPricePoint}
          shouldShowAnimatedDot={shouldShowAnimatedDot}
          tokenColor={tokenColor}
        />
      </Flex>
    )
  } else {
    content = <PriceExplorerPlaceholder />
  }

  return (
    <LineChartProvider
      data={convertedPriceHistory ?? []}
      onCurrentIndexChange={invokeImpact[ImpactFeedbackStyle.Light]}>
      <Flex gap="$spacing8" overflow="hidden">
        <PriceTextSection
          loading={loading}
          numberOfDigits={numberOfDigits}
          relativeChange={convertedSpot?.relativeChange}
          spotPrice={convertedSpot?.value}
        />
        {content}
        <TimeRangeGroup setDuration={setDuration} />
      </Flex>
    </LineChartProvider>
  )
})

function PriceExplorerPlaceholder(): JSX.Element {
  return (
    <Flex my="$spacing24">
      <Loader.Graph />
    </Flex>
  )
}

function PriceExplorerChart({
  tokenColor,
  additionalPadding,
  shouldShowAnimatedDot,
  lastPricePoint,
}: {
  tokenColor?: string
  additionalPadding: number
  shouldShowAnimatedDot: boolean
  lastPricePoint: number
}): JSX.Element {
  const { chartHeight, chartWidth } = useChartDimensions()
  const isRTL = I18nManager.isRTL

  return (
    // TODO(MOB-2166): remove forced LTR direction + scaleX horizontal flip technique once react-native-wagmi-charts fixes this: https://github.com/coinjar/react-native-wagmi-charts/issues/136
    <Flex direction="ltr" my="$spacing24" style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
      <LineChart height={chartHeight} width={chartWidth - additionalPadding} yGutter={20}>
        <LineChart.Path color={tokenColor} pathProps={{ isTransitionEnabled: false }}>
          {shouldShowAnimatedDot && (
            <LineChart.Dot
              key={lastPricePoint}
              hasPulse
              // Sometimes, the pulse dot doesn't appear on the end of
              // the chart’s path, but on top of the container instead.
              // A little shift backwards seems to solve this problem.
              at={lastPricePoint - 0.1}
              color={tokenColor}
              inactiveColor="transparent"
              pulseBehaviour="while-inactive"
              pulseDurationMs={2000}
              size={5}
            />
          )}
        </LineChart.Path>
        <LineChart.CursorLine color={tokenColor} minDurationMs={150} />
        <LineChart.CursorCrosshair
          color={tokenColor}
          minDurationMs={150}
          outerSize={CURSOR_SIZE}
          size={CURSOR_INNER_SIZE}
          onActivated={invokeImpact[ImpactFeedbackStyle.Light]}
          onEnded={invokeImpact[ImpactFeedbackStyle.Light]}
        />
      </LineChart>
    </Flex>
  )
}
