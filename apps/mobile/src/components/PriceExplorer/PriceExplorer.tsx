import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { useMemo } from 'react'
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
import { useFiatConversion } from 'wallet/src/utils/currency'
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
  const conversionRate = useFiatConversion(1).amount
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
        loading={loading}
        priceHistory={convertedPriceHistory}
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
}: {
  priceHistory: TLineChartDataProp
  spot?: TokenSpotData
  loading: boolean
  tokenColor?: string
}): JSX.Element {
  const { chartHeight, chartWidth } = useChartDimensions()

  return (
    <LineChartProvider
      data={priceHistory}
      onCurrentIndexChange={invokeImpact[ImpactFeedbackStyle.Light]}>
      <Flex gap="$spacing8">
        <PriceTextSection loading={loading} relativeChange={spot?.relativeChange} />
        <Flex my="$spacing24">
          <LineChart height={chartHeight} width={chartWidth}>
            <LineChart.Path color={tokenColor} pathProps={{ isTransitionEnabled: false }} />
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
