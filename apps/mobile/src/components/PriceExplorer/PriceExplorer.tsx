import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { useMemo } from 'react'
import { I18nManager } from 'react-native'
import { SharedValue } from 'react-native-reanimated'
import {
  LineChart,
  LineChartProvider,
  TLineChartData,
  TLineChartDataProp,
} from 'react-native-wagmi-charts'
import { Loader } from 'src/components/loading'
import { CURSOR_INNER_SIZE, CURSOR_SIZE } from 'src/components/PriceExplorer/constants'
import { PriceExplorerError } from 'src/components/PriceExplorer/PriceExplorerError'
import { DatetimeText, PriceText, RelativeChangeText } from 'src/components/PriceExplorer/Text'
import { TimeRangeGroup } from 'src/components/PriceExplorer/TimeRangeGroup'
import { useChartDimensions } from 'src/components/PriceExplorer/useChartDimensions'
import { invokeImpact } from 'src/utils/haptic'
import { Flex } from 'ui/src'
import { HistoryDuration } from 'wallet/src/data/__generated__/types-and-hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { CurrencyId } from 'wallet/src/utils/currencyId'
import { TokenSpotData, useTokenPriceHistory } from './usePriceHistory'

type PriceTextProps = {
  loading: boolean
  relativeChange?: SharedValue<number>
}

function PriceTextSection({ loading, relativeChange }: PriceTextProps): JSX.Element {
  return (
    <Flex mx="$spacing12">
      <PriceText loading={loading} />
      <Flex row gap="$spacing4">
        <RelativeChangeText loading={loading} spotRelativeChange={relativeChange} />
        <DatetimeText loading={loading} />
      </Flex>
    </Flex>
  )
}

export type LineChartPriceAndDateTimeTextProps = {
  currencyId: CurrencyId
}

export function PriceExplorer({
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
  const { data, loading, error, refetch, setDuration, selectedDuration } =
    useTokenPriceHistory(currencyId)
  const { convertFiatAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount().amount
  const shouldShowAnimatedDot =
    selectedDuration === HistoryDuration.Day || selectedDuration === HistoryDuration.Hour
  const additionalPadding = shouldShowAnimatedDot ? 40 : 0
  const lastPricePoint = data?.priceHistory ? data.priceHistory.length - 1 : 0

  const convertedPriceHistory = useMemo(
    (): TLineChartData | undefined =>
      data?.priceHistory?.map((point) => {
        return { ...point, value: point.value * conversionRate }
      }),
    [data, conversionRate]
  )
  const convertedSpot = useMemo((): TokenSpotData | undefined => {
    return (
      data?.spot && {
        ...data?.spot,
        value: { value: conversionRate * (data?.spot?.value?.value ?? 0) },
      }
    )
  }, [data, conversionRate])

  if (
    !loading &&
    (!convertedPriceHistory || (!convertedSpot && selectedDuration === HistoryDuration.Day))
  ) {
    // Propagate retry up while refetching, if available
    const refetchAndRetry = (): void => {
      if (refetch) refetch()
      onRetry()
    }
    return <PriceExplorerError showRetry={error !== undefined} onRetry={refetchAndRetry} />
  }

  let content: JSX.Element | null
  if (forcePlaceholder) {
    content = <PriceExplorerPlaceholder loading={forcePlaceholder} />
  } else if (convertedPriceHistory?.length) {
    content = (
      <PriceExplorerChart
        additionalPadding={additionalPadding}
        lastPricePoint={lastPricePoint}
        loading={loading}
        priceHistory={convertedPriceHistory}
        shouldShowAnimatedDot={shouldShowAnimatedDot}
        spot={convertedSpot}
        tokenColor={tokenColor}
      />
    )
  } else {
    content = <PriceExplorerPlaceholder loading={loading} />
  }

  return (
    <Flex overflow="hidden">
      {content}
      <TimeRangeGroup setDuration={setDuration} />
    </Flex>
  )
}

function PriceExplorerPlaceholder({ loading }: { loading: boolean }): JSX.Element {
  return (
    <Flex gap="$spacing8">
      <PriceTextSection loading={loading} />
      <Flex my="$spacing24">
        <Loader.Graph />
      </Flex>
    </Flex>
  )
}

function PriceExplorerChart({
  priceHistory,
  spot,
  loading,
  tokenColor,
  additionalPadding,
  shouldShowAnimatedDot,
  lastPricePoint,
}: {
  priceHistory: TLineChartDataProp
  spot?: TokenSpotData
  loading: boolean
  tokenColor?: string
  additionalPadding: number
  shouldShowAnimatedDot: boolean
  lastPricePoint: number
}): JSX.Element {
  const { chartHeight, chartWidth } = useChartDimensions()
  const isRTL = I18nManager.isRTL

  return (
    <LineChartProvider
      data={priceHistory}
      onCurrentIndexChange={invokeImpact[ImpactFeedbackStyle.Light]}>
      <Flex gap="$spacing8">
        <PriceTextSection loading={loading} relativeChange={spot?.relativeChange} />
        {/* TODO(MOB-2166): remove forced LTR direction + scaleX horizontal flip technique once react-native-wagmi-charts fixes this: https://github.com/coinjar/react-native-wagmi-charts/issues/136 */}
        <Flex direction="ltr" my="$spacing24" style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
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
            <LineChart.CursorLine color={tokenColor} />
            <LineChart.CursorCrosshair
              color={tokenColor}
              outerSize={CURSOR_SIZE}
              size={CURSOR_INNER_SIZE}
              onActivated={invokeImpact[ImpactFeedbackStyle.Light]}
              onEnded={invokeImpact[ImpactFeedbackStyle.Light]}
            />
          </LineChart>
        </Flex>
      </Flex>
    </LineChartProvider>
  )
}
