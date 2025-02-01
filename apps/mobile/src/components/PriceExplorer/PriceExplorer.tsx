import React, { PropsWithChildren, ReactElement, memo, useCallback, useEffect, useMemo, useState } from 'react'
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
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { Loader } from 'src/components/loading/loaders'
import { useHapticFeedback } from 'src/utils/haptics/useHapticFeedback'
import { useIsScreenNavigationReady } from 'src/utils/useIsScreenNavigationReady'
import { Flex, SegmentedControl, Text } from 'ui/src'
import GraphCurve from 'ui/src/assets/backgrounds/graph-curve.svg'
import { spacing } from 'ui/src/theme'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementNameType } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyId } from 'uniswap/src/types/currency'
import { isE2EMode } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'
import { isAndroid } from 'utilities/src/platform'

type PriceTextProps = {
  loading: boolean
  relativeChange?: SharedValue<number>
  numberOfDigits: PriceNumberOfDigits
  spotPrice?: SharedValue<number>
}

const PriceTextSection = memo(function PriceTextSection({
  loading,
  numberOfDigits,
  spotPrice,
}: PriceTextProps): JSX.Element {
  const price = useLineChartPrice(spotPrice)
  const currency = useAppFiatCurrencyInfo()

  const [isAnimatedNumberReady, setIsAnimatedNumberReady] = useState(false)
  const onAnimatedNumberReady = useCallback(() => setIsAnimatedNumberReady(true), [])

  return (
    // The `minHeight` is needed to avoid a layout shift on Android when hiding the skeleton.
    <Flex mx={spacing.spacing12} minHeight={80}>
      <PriceExplorerAnimatedNumber
        currency={currency}
        numberOfDigits={numberOfDigits}
        price={price}
        onAnimatedNumberReady={onAnimatedNumberReady}
      />
      <Flex row gap="$spacing4">
        {/*
        We want both the animated number skeleton and the relative change skeleton to hide at the exact same time.
        When multiple skeletons hide in different order, it gives the feeling of things being slower than they actually are.
        */}
        <RelativeChangeText loading={loading || !isAnimatedNumberReady} />
        <DatetimeText loading={loading || !isAnimatedNumberReady} />
      </Flex>
    </Flex>
  )
})

function TimeRangeTraceWrapper({
  children,
  elementName,
}: PropsWithChildren<{ elementName: ElementNameType }>): ReactElement {
  return (
    <Trace logPress element={elementName}>
      {children}
    </Trace>
  )
}

export type LineChartPriceAndDateTimeTextProps = {
  currencyId: CurrencyId
}

export const PriceExplorer = memo(function _PriceExplorer(): JSX.Element {
  const { isTestnetModeEnabled } = useEnabledChains()
  const { chartHeight, chartWidth } = useChartDimensions()

  if (isTestnetModeEnabled) {
    return <GraphCurve height={chartHeight} width={chartWidth} opacity={0.25} />
  }

  return <PriceExplorerInner />
})

export const PriceExplorerInner = memo(function _PriceExplorerInner(): JSX.Element {
  const { currencyId, tokenColor, navigation } = useTokenDetailsContext()
  const isScreenNavigationReady = useIsScreenNavigationReady({ navigation })

  const { data, loading, error, refetch, setDuration, selectedDuration, numberOfDigits } = useTokenPriceHistory(
    currencyId,
    HistoryDuration.Day,
    !isScreenNavigationReady,
  )

  // Log the number of points in the data
  useEffect(() => {
    if (data?.priceHistory) {
      if (data.priceHistory.length < 10) {
        logger.warn('PriceExplorer.tsx', 'PriceExplorerInner', 'Missing token details data points', {
          currencyId,
          duration: selectedDuration,
          dataLength: data?.priceHistory?.length,
        })
      }
      logger.info('PriceExplorer.tsx', 'PriceExplorerInner', 'Token details data length', {
        currencyId,
        duration: selectedDuration,
        dataLength: data?.priceHistory?.length,
      })
    }
  }, [data?.priceHistory, selectedDuration, currencyId])

  const { hapticFeedback } = useHapticFeedback()

  const { convertFiatAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount(1).amount
  const shouldShowAnimatedDot =
    (selectedDuration === HistoryDuration.Day || selectedDuration === HistoryDuration.Hour) && !isE2EMode
  const additionalPadding = shouldShowAnimatedDot ? 40 : 0

  const { lastPricePoint, convertedPriceHistory } = useMemo(() => {
    const priceHistory =
      data?.priceHistory?.map((point) => {
        return { ...point, value: point.value * conversionRate }
      }) ?? []

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

  const segmentedControlOptions = useMemo(() => {
    return TIME_RANGES.map(([duration, label, elementName]) => ({
      value: duration,
      wrapper: <TimeRangeTraceWrapper key={`${duration}-trace`} elementName={elementName} />,
      display: (
        <Text allowFontScaling={false} testID={`token-details-chart-time-range-button-${label}`} variant="buttonLabel2">
          {label}
        </Text>
      ),
    }))
  }, [])

  if (!loading && (!convertedPriceHistory || (!convertedSpot && selectedDuration === HistoryDuration.Day))) {
    return <PriceExplorerError showRetry={error !== undefined} onRetry={refetch} />
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

        <Flex animation="quick" enterStyle={{ opacity: isAndroid ? 0 : 1 }}>
          {convertedPriceHistory?.length ? (
            <PriceExplorerChart
              additionalPadding={additionalPadding}
              lastPricePoint={lastPricePoint}
              shouldShowAnimatedDot={shouldShowAnimatedDot}
              tokenColor={tokenColor ?? undefined}
            />
          ) : (
            <Flex my="$spacing24">
              <Loader.Graph />
            </Flex>
          )}

          <Flex px="$spacing8">
            <SegmentedControl
              fullWidth
              outlined={false}
              options={segmentedControlOptions}
              selectedOption={selectedDuration}
              onSelectOption={setDuration}
            />
          </Flex>
        </Flex>
      </Flex>
    </LineChartProvider>
  )
})

const PriceExplorerChart = memo(function PriceExplorerChart({
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
})
