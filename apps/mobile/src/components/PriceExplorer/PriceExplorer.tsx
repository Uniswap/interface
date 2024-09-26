import { PropsWithChildren, ReactElement, memo, useMemo } from 'react'
import { I18nManager } from 'react-native'
import { SharedValue, useDerivedValue } from 'react-native-reanimated'
import { LineChart, LineChartProvider } from 'react-native-wagmi-charts'
import PriceExplorerAnimatedNumber from 'src/components/PriceExplorer/PriceExplorerAnimatedNumber'
import { PriceExplorerError } from 'src/components/PriceExplorer/PriceExplorerError'
import { DatetimeText, RelativeChangeText } from 'src/components/PriceExplorer/Text'
import { CURSOR_INNER_SIZE, CURSOR_SIZE, TIME_RANGES } from 'src/components/PriceExplorer/constants'
import { useChartDimensions } from 'src/components/PriceExplorer/useChartDimensions'
import { useLineChartPrice } from 'src/components/PriceExplorer/usePrice'
import { PriceNumberOfDigits, TokenSpotData, useTokenPriceHistory } from 'src/components/PriceExplorer/usePriceHistory'
import { Loader } from 'src/components/loading/loaders'
import { Flex, SegmentedControl, Text, useHapticFeedback } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementNameType } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyId } from 'uniswap/src/types/currency'
import { isDetoxBuild } from 'utilities/src/environment/constants'

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
      <PriceExplorerAnimatedNumber currency={currency} numberOfDigits={numberOfDigits} price={price} />
      <Flex row gap="$spacing4">
        <RelativeChangeText loading={loading} />
        <DatetimeText loading={loading} />
      </Flex>
    </Flex>
  )
}

const TimeRangeTraceWrapper = ({
  children,
  elementName,
}: PropsWithChildren<{ elementName: ElementNameType }>): ReactElement => (
  <Trace logPress element={elementName}>
    {children}
  </Trace>
)

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
  const { hapticFeedback } = useHapticFeedback()

  const { convertFiatAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount(1).amount
  const shouldShowAnimatedDot =
    (selectedDuration === HistoryDuration.Day || selectedDuration === HistoryDuration.Hour) && !isDetoxBuild
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

  if (!loading && (!convertedPriceHistory || (!convertedSpot && selectedDuration === HistoryDuration.Day))) {
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
    <LineChartProvider data={convertedPriceHistory ?? []} onCurrentIndexChange={hapticFeedback.light}>
      <Flex gap="$spacing8" overflow="hidden">
        <PriceTextSection
          loading={loading}
          numberOfDigits={numberOfDigits}
          relativeChange={convertedSpot?.relativeChange}
          spotPrice={convertedSpot?.value}
        />
        {content}
        <Flex px="$spacing8">
          <SegmentedControl
            fullWidth
            outlined={false}
            options={TIME_RANGES.map(([duration, label, elementName]) => ({
              value: duration,
              wrapper: <TimeRangeTraceWrapper key={`${duration}-trace`} elementName={elementName} />,
              display: (
                <Text
                  allowFontScaling={false}
                  testID={`token-details-chart-time-range-button-${label}`}
                  variant="buttonLabel2"
                >
                  {label}
                </Text>
              ),
            }))}
            selectedOption={selectedDuration}
            onSelectOption={setDuration}
          />
        </Flex>
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
  const { hapticFeedback } = useHapticFeedback()

  return (
    // TODO(MOB-2166): remove forced LTR direction + scaleX horizontal flip technique once react-native-wagmi-charts fixes this: https://github.com/coinjar/react-native-wagmi-charts/issues/136
    <Flex
      direction="ltr"
      my="$spacing24"
      style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
      testID={TestID.PriceExplorerChart}
    >
      <LineChart height={chartHeight} width={chartWidth - additionalPadding} yGutter={20}>
        <LineChart.Path color={tokenColor} pathProps={{ isTransitionEnabled: false }}>
          {shouldShowAnimatedDot && (
            <LineChart.Dot
              key={lastPricePoint}
              hasPulse
              at={lastPricePoint}
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
          onActivated={hapticFeedback.light}
          onEnded={hapticFeedback.light}
        />
      </LineChart>
    </Flex>
  )
}
