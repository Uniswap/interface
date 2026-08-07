import { GraphQLApi } from '@universe/api'
import { isAndroid } from '@universe/environment'
import { LinearGradient } from 'expo-linear-gradient'
import React, { memo, PropsWithChildren, ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { I18nManager, StyleSheet } from 'react-native'
import { SharedValue, useAnimatedReaction, useDerivedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { DotGrid } from 'src/components/charts/DotGrid'
import { PriceChartProvider, usePriceChart } from 'src/components/charts/PriceChartContext'
import { SparklineChart } from 'src/components/charts/SparklineChart'
import { Loader } from 'src/components/loading/loaders'
import { historyDurationToLabel, TIME_RANGES } from 'src/components/PriceExplorer/constants'
import PriceExplorerAnimatedNumber from 'src/components/PriceExplorer/PriceExplorerAnimatedNumber'
import { PriceExplorerError } from 'src/components/PriceExplorer/PriceExplorerError'
import { DatetimeText, RelativeChangeText } from 'src/components/PriceExplorer/Text'
import { useChartDimensions } from 'src/components/PriceExplorer/useChartDimensions'
import { useLineChartPrice } from 'src/components/PriceExplorer/usePrice'
import { PriceNumberOfDigits, TokenSpotData, useTokenPriceHistory } from 'src/components/PriceExplorer/usePriceHistory'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { useFeatureFlaggedProjectTokens } from 'src/components/TokenDetails/useFeatureFlaggedProjectTokens'
import { useTokenDetailsPreferProjectMarketData } from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
import { useIsScreenNavigationReady } from 'src/utils/useIsScreenNavigationReady'
import { Flex, SegmentedControl, Text, useSporeColors } from 'ui/src'
import { useLayoutAnimationOnChange } from 'ui/src/animations'
import GraphCurve from 'ui/src/assets/backgrounds/graph-curve.svg'
import { opacify, spacing } from 'ui/src/theme'
import { isLowVarianceRange } from 'uniswap/src/components/charts/utils'
import { useTokenBasicProjectPartsFragment } from 'uniswap/src/data/graphql/fragments'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { isMultichainProjectTokens } from 'uniswap/src/features/dataApi/tokenProjects/utils/isMultichainProjectTokens'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { logger } from 'utilities/src/logger/logger'

const DEFAULT_Y_PADDING = 20
const LOW_VARIANCE_Y_PADDING = 100

type PriceTextProps = {
  loading: boolean
  relativeChange?: SharedValue<number | undefined>
  numberOfDigits: PriceNumberOfDigits
  spotPrice?: SharedValue<number>
  startingPrice?: number
  shouldTreatAsStablecoin?: boolean
}

const PriceTextSection = memo(function PriceTextSection({
  loading,
  numberOfDigits,
  relativeChange,
  spotPrice,
  startingPrice,
  shouldTreatAsStablecoin,
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
        <RelativeChangeText
          loading={loading || !isAnimatedNumberReady}
          spotRelativeChange={relativeChange}
          startingPrice={startingPrice}
          shouldTreatAsStablecoin={shouldTreatAsStablecoin}
        />
      </Flex>
      <DatetimeText loading={loading || !isAnimatedNumberReady} />
    </Flex>
  )
})

function TimeRangeTraceWrapper({
  children,
  elementName,
}: PropsWithChildren<{ elementName: ElementName }>): ReactElement {
  return (
    <Trace logPress element={elementName}>
      {children}
    </Trace>
  )
}

export const PriceExplorer = memo(function PriceExplorerInner(): JSX.Element {
  const { isTestnetModeEnabled } = useEnabledChains()
  const { chartHeight, chartWidth } = useChartDimensions()

  if (isTestnetModeEnabled) {
    return <GraphCurve height={chartHeight} width={chartWidth} opacity={0.25} />
  }

  return <PriceExplorerContent />
})

const PriceExplorerContent = memo(function PriceExplorerContentInner(): JSX.Element {
  const { t } = useTranslation()
  const { currencyId, tokenColor, navigation, initialIsMultichainAsset } = useTokenDetailsContext()
  const isScreenNavigationReady = useIsScreenNavigationReady({ navigation })
  const preferProjectMarketData = useTokenDetailsPreferProjectMarketData()

  // Default to the aggregate endpoints until project.tokens loads — better than assuming single-chain.
  const project = useTokenBasicProjectPartsFragment({ currencyId }).data.project
  const featureFlaggedProjectTokens = useFeatureFlaggedProjectTokens(project?.tokens)
  const projectTokensLoaded = project?.tokens !== undefined
  const shouldQueryMultichainAggregate =
    initialIsMultichainAsset || !projectTokensLoaded || isMultichainProjectTokens(featureFlaggedProjectTokens)

  const { data, loading, error, refetch, setDuration, selectedDuration, numberOfDigits } = useTokenPriceHistory({
    currencyId,
    initialDuration: GraphQLApi.HistoryDuration.Day,
    preferProjectMarketData,
    isMultichainAggregateView: shouldQueryMultichainAggregate,
    skip: !isScreenNavigationReady,
  })

  // Log the number of points in the data
  useEffect(() => {
    if (data?.priceHistory) {
      if (data.priceHistory.length < 10) {
        logger.warn('PriceExplorer.tsx', 'PriceExplorerInner', 'Missing token details data points', {
          currencyId,
          duration: selectedDuration,
          dataLength: data.priceHistory.length,
        })
      }
      logger.info('PriceExplorer.tsx', 'PriceExplorerInner', 'Token details data length', {
        currencyId,
        duration: selectedDuration,
        dataLength: data.priceHistory.length,
      })
    }
  }, [data?.priceHistory, selectedDuration, currencyId])

  const { convertFiatAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount(1).amount
  const shouldShowAnimatedDot =
    selectedDuration === GraphQLApi.HistoryDuration.Day || selectedDuration === GraphQLApi.HistoryDuration.Hour

  const convertedPriceHistory = useMemo(
    () =>
      data?.priceHistory?.map((point) => {
        return { ...point, value: point.value * conversionRate }
      }) ?? [],
    [data, conversionRate],
  )

  useLayoutAnimationOnChange(convertedPriceHistory.length)

  const convertedSpotValue = useDerivedValue(() => conversionRate * (data?.spot?.value.value ?? 0))
  const convertedSpot = useMemo((): TokenSpotData | undefined => {
    return (
      data?.spot && {
        ...data.spot,
        value: convertedSpotValue,
      }
    )
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [data])

  // Zoom out y-axis for low variance assets
  const shouldZoomOut = useMemo(() => {
    if (convertedPriceHistory.length === 0) {
      return false
    }

    const values = convertedPriceHistory.map((point) => point.value)
    const min = Math.min(...values)
    const max = Math.max(...values)

    return isLowVarianceRange({ min, max, duration: selectedDuration })
  }, [convertedPriceHistory, selectedDuration])

  const chartYGutter = shouldZoomOut ? LOW_VARIANCE_Y_PADDING : DEFAULT_Y_PADDING

  const segmentedControlOptions = useMemo(() => {
    return TIME_RANGES.map(([duration, elementName]) => {
      const label = historyDurationToLabel(t, duration)

      return {
        value: duration,
        wrapper: <TimeRangeTraceWrapper key={`${duration}-trace`} elementName={elementName} />,
        display: (
          <Text
            adjustsFontSizeToFit
            allowFontScaling={false}
            // iOS keeps the full-size line box/baseline when adjustsFontSizeToFit shrinks glyphs, pushing
            // them off-center; unset lineHeight so the pill's flex centering holds at any scale
            lineHeight="unset"
            minimumFontScale={0.7}
            numberOfLines={1}
            textAlign="center"
            testID={`token-details-chart-time-range-button-${duration}`}
            variant="buttonLabel2"
          >
            {label}
          </Text>
        ),
      }
    })
  }, [t])

  if (!loading && !convertedSpot && selectedDuration === GraphQLApi.HistoryDuration.Day) {
    return <PriceExplorerError showRetry={error} onRetry={refetch} />
  }

  // Get the starting price for fiat delta calculation
  const startingPrice = convertedPriceHistory[0]?.value

  return (
    <PriceChartProvider data={convertedPriceHistory}>
      <Flex gap="$spacing8" overflow="hidden">
        <PriceTextSection
          loading={loading}
          numberOfDigits={numberOfDigits}
          relativeChange={convertedSpot?.relativeChange}
          spotPrice={convertedSpot?.value}
          startingPrice={startingPrice}
          shouldTreatAsStablecoin={shouldZoomOut}
        />

        <Flex animation="quick" enterStyle={{ opacity: isAndroid ? 0 : 1 }}>
          {convertedPriceHistory.length ? (
            <PriceExplorerChart
              shouldShowAnimatedDot={shouldShowAnimatedDot}
              tokenColor={tokenColor ?? undefined}
              yGutter={chartYGutter}
            />
          ) : (
            <Flex my="$spacing24">
              <Loader.Graph />
            </Flex>
          )}

          <Flex px="$spacing8">
            <SegmentedControl
              fullWidth
              variableOptionWidths
              outlined={false}
              options={segmentedControlOptions}
              selectedOption={selectedDuration}
              onSelectOption={setDuration}
            />
          </Flex>
        </Flex>
      </Flex>
    </PriceChartProvider>
  )
})

const CHART_LEFT_GRADIENT_WIDTH = 40

const PriceExplorerChart = memo(function PriceExplorerChart({
  tokenColor,
  shouldShowAnimatedDot,
  yGutter,
}: {
  tokenColor?: string
  shouldShowAnimatedDot: boolean
  yGutter: number
}): JSX.Element {
  const { chartHeight, chartWidth } = useChartDimensions()
  const isRTL = I18nManager.isRTL
  const colors = useSporeColors()
  const { hapticFeedback } = useHapticFeedback()
  const { data, currentIndex, isActive } = usePriceChart()

  useAnimatedReaction(
    () => currentIndex.value,
    (current, previous) => {
      if (current !== previous && current >= 0 && isActive.value) {
        scheduleOnRN(hapticFeedback.light)
      }
    },
    [hapticFeedback.light],
  )

  useAnimatedReaction(
    () => isActive.value,
    (current, previous) => {
      if (previous !== null && current !== previous) {
        scheduleOnRN(hapticFeedback.light)
      }
    },
    [hapticFeedback.light],
  )

  return (
    <Flex height={chartHeight} my="$spacing24" overflow="hidden" testID={TestID.PriceExplorerChart}>
      <DotGrid width={chartWidth} height={chartHeight} />
      <Flex direction="ltr" style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
        <SparklineChart
          interactive
          data={data}
          width={chartWidth}
          height={chartHeight}
          color={tokenColor ?? colors.accent1.val}
          yGutter={yGutter}
          showDot={shouldShowAnimatedDot}
          dotStrokeColor={colors.surface1.val}
          scrubIndex={currentIndex}
          scrubActive={isActive}
        />
      </Flex>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.surface1.val, opacify(0, colors.surface1.val)]}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0 }}
        style={styles.leftGradient}
      />
    </Flex>
  )
})

const styles = StyleSheet.create({
  leftGradient: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: CHART_LEFT_GRADIENT_WIDTH,
  },
})
