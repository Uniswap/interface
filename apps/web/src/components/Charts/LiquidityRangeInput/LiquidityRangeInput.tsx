// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { ActiveLiquidityChart2 } from 'components/Charts/ActiveLiquidityChart/ActiveLiquidityChart2'
import { Chart } from 'components/Charts/ChartModel'
import { LPPriceChartModel } from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { ChartErrorView } from 'components/Charts/LoadingState'
import { getCandlestickPriceBounds } from 'components/Charts/PriceChart/utils'
import { PriceChartType } from 'components/Charts/utils'
import { useDensityChartData } from 'components/LiquidityChartRangeInput/hooks'
import { DataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { usePoolPriceChartData } from 'hooks/usePoolPriceChartData'
import {
  getCurrencyAddressWithWrap,
  getCurrencyWithWrap,
  getSortedCurrenciesTupleWithWrap,
} from 'pages/Pool/Positions/create/utils'
import { useMemo, useState } from 'react'
import { Button, Flex, SegmentedControl, SegmentedControlOption, Shine, Text, useSporeColors } from 'ui/src'
import { HorizontalDensityChart } from 'ui/src/components/icons/HorizontalDensityChart'
import { LoadingPriceCurve } from 'ui/src/components/icons/LoadingPriceCurve'
import { SearchMinus } from 'ui/src/components/icons/SearchMinus'
import { SearchPlus } from 'ui/src/components/icons/SearchPlus'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useTranslation } from 'uniswap/src/i18n'

const RIGHT_AXIS_WIDTH = 64
const CHART_CONTAINER_WIDTH = 452 + RIGHT_AXIS_WIDTH
const LIQUIDITY_CHART_WIDTH = 68
const INTER_CHART_PADDING = 12
const CHART_HEIGHT = 164
const BOTTOM_AXIS_HEIGHT = 46
const loadedPriceChartWidth = CHART_CONTAINER_WIDTH - LIQUIDITY_CHART_WIDTH - INTER_CHART_PADDING - RIGHT_AXIS_WIDTH

/**
 * Chart input for selecting the min/max prices for a liquidity position.
 * Note that the min value can be negative.
 */
export function LiquidityRangeInput({
  currency0,
  currency1,
  feeTier,
  tickSpacing,
  protocolVersion,
  poolId,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  disableBrushInteraction = false,
}: {
  currency0: Currency
  currency1: Currency
  feeTier: number | string
  tickSpacing?: number
  protocolVersion: ProtocolVersion
  poolId: string
  minPrice?: number
  maxPrice?: number
  disableBrushInteraction?: boolean
  setMinPrice: (minPrice?: number) => void
  setMaxPrice: (maxPrice?: number) => void
}) {
  const chainInfo = getChainInfo(currency0.chainId)
  const colors = useSporeColors()
  const { t } = useTranslation()

  const sortedCurrencies = getSortedCurrenciesTupleWithWrap(currency0, currency1, protocolVersion)
  const currency1MaybeWrapped = getCurrencyWithWrap(currency1, protocolVersion)
  const isReversed = currency1MaybeWrapped?.equals(sortedCurrencies[0]) ?? false

  const [selectedHistoryDuration, setSelectedHistoryDuration] = useState<HistoryDuration>(HistoryDuration.Month)

  const priceData = usePoolPriceChartData(
    // If the Pool doesn't exist, the poolId is undefined and we skip this query.
    {
      addressOrId: poolId,
      chain: chainInfo.backendChain.chain,
      duration: selectedHistoryDuration,
      isV4: protocolVersion === ProtocolVersion.V4,
      isV3: protocolVersion === ProtocolVersion.V3,
      isV2: false,
    },
    currency0,
    currency1,
    protocolVersion,
    getCurrencyAddressWithWrap(sortedCurrencies[0], protocolVersion),
  )

  // Set via a callback from the LiquidityPositionRangeChart, which is important when the price axis is auto-scaled.
  // This is also used to set the bounds of the ActiveLiquiditChart, so it's necessary to keep separate from the zooming state.
  const [boundaryPrices, setBoundaryPrices] = useState<[number, number]>()

  const [zoomFactor, setZoomFactor] = useState(1)

  const { dataMin, dataMax } = useMemo(() => {
    const { min: dataMin, max: dataMax } = getCandlestickPriceBounds(priceData.entries)
    return { dataMin, dataMax }
  }, [priceData.entries])

  // Sets the min/max prices of the price axis manually, which is used to center the current price and zoom in/out.
  const { minVisiblePrice, maxVisiblePrice } = useMemo(() => {
    const currentPrice = priceData.entries[priceData.entries.length - 1]?.value
    // Calculate the default range based on the current price.
    const maxSpread = Math.max(currentPrice - dataMin, dataMax - currentPrice)
    // Initial unscaled range to fit all values with the current price centered
    const initialRange = 2 * maxSpread
    const newRange = initialRange / zoomFactor

    return {
      minVisiblePrice: currentPrice - newRange / 2,
      maxVisiblePrice: currentPrice + newRange / 2,
    }
  }, [dataMax, dataMin, priceData.entries, zoomFactor])

  const priceChartParams = useMemo(() => {
    return {
      data: priceData.entries,
      stale: priceData.dataQuality === DataQuality.STALE,
      type: PriceChartType.LINE,
      height: CHART_HEIGHT,
      color: colors.accent1.val,
      currentPriceLineColor: colors.neutral2.val,
      showXAxis: true,
      minVisiblePrice,
      maxVisiblePrice,
      setBoundaryPrices,
      isReversed,
      disableExtendedTimeScale: true,
      priceScaleMargins: {
        top: 0,
        bottom: 0,
      },
    } as const
  }, [
    colors.accent1.val,
    colors.neutral2.val,
    isReversed,
    priceData.dataQuality,
    priceData.entries,
    maxVisiblePrice,
    minVisiblePrice,
  ])

  const { formattedData, isLoading: liquidityDataLoading } = useDensityChartData({
    poolId,
    currencyA: sortedCurrencies[0],
    currencyB: sortedCurrencies[1],
    invertPrices: !isReversed,
    version: protocolVersion,
    feeAmount: Number(feeTier),
    tickSpacing,
  })

  const sortedFormattedData = useMemo(() => {
    return formattedData?.sort((a, b) => a.price0 - b.price0)
  }, [formattedData])

  const timePeriodOptions = useMemo(() => {
    const options: SegmentedControlOption<HistoryDuration>[] = [
      [HistoryDuration.Day, t('token.priceExplorer.timeRangeLabel.day')],
      [HistoryDuration.Week, t('token.priceExplorer.timeRangeLabel.week')],
      [HistoryDuration.Month, t('token.priceExplorer.timeRangeLabel.month')],
      [HistoryDuration.Year, t('token.priceExplorer.timeRangeLabel.year')],
      [HistoryDuration.Max, t('token.priceExplorer.timeRangeLabel.all')],
    ].map((timePeriod) => ({
      value: timePeriod[0] as HistoryDuration,
      display: <Text variant="buttonLabel3">{timePeriod[1]}</Text>,
    }))
    return {
      options,
      selected: selectedHistoryDuration,
    }
  }, [selectedHistoryDuration, t])

  const showChartErrorView =
    (!priceData.loading && priceData.entries.length === 0) || (!liquidityDataLoading && !sortedFormattedData)

  return (
    <Flex gap="$gap8" overflow="hidden">
      <Flex height={CHART_HEIGHT + BOTTOM_AXIS_HEIGHT} width={CHART_CONTAINER_WIDTH} overflow="hidden">
        {showChartErrorView && (
          <ChartErrorView>
            <Text variant="body3" color="$neutral2">
              {t('position.setRange.inputsBelow')}
            </Text>
          </ChartErrorView>
        )}
        <Flex
          width={showChartErrorView ? CHART_CONTAINER_WIDTH : loadedPriceChartWidth}
          height={CHART_HEIGHT + BOTTOM_AXIS_HEIGHT}
          overflow="hidden"
        >
          {(priceData.loading || showChartErrorView) && (!priceData.entries || priceData.entries.length === 0) && (
            <Shine height={CHART_HEIGHT} disabled={showChartErrorView} zIndex={0}>
              <LoadingPriceCurve
                size={showChartErrorView ? CHART_CONTAINER_WIDTH : loadedPriceChartWidth}
                color="$neutral2"
              />
            </Shine>
          )}
          <Chart Model={LPPriceChartModel} params={priceChartParams} height={CHART_HEIGHT + BOTTOM_AXIS_HEIGHT} />
        </Flex>
        <Flex width={CHART_CONTAINER_WIDTH} height={CHART_HEIGHT} position="absolute" right={0} top={0}>
          {(liquidityDataLoading || priceData.loading) && (
            <Shine
              position="absolute"
              right={0}
              top={0}
              overflow="hidden"
              justifyContent="flex-end"
              height={CHART_HEIGHT}
              width={CHART_HEIGHT}
            >
              <HorizontalDensityChart color="$neutral2" size={CHART_HEIGHT} />
            </Shine>
          )}
          {sortedFormattedData && !liquidityDataLoading && !priceData.loading && boundaryPrices && (
            <ActiveLiquidityChart2
              data={{
                series: sortedFormattedData,
                current: priceData.entries[priceData.entries.length - 1]?.value,
                min: boundaryPrices[0],
                max: boundaryPrices[1],
              }}
              disableBrushInteraction={disableBrushInteraction}
              brushDomain={minPrice && maxPrice ? [minPrice, maxPrice] : undefined}
              dimensions={{
                width: CHART_CONTAINER_WIDTH,
                height: CHART_HEIGHT,
                contentWidth: LIQUIDITY_CHART_WIDTH,
                axisLabelPaneWidth: RIGHT_AXIS_WIDTH,
              }}
              onBrushDomainChange={function (domain: [number, number]): void {
                if (domain[0] < 0) {
                  return
                } else {
                  setMinPrice(domain[0])
                  setMaxPrice(domain[1])
                }
              }}
              currency0={currency0}
              currency1={currency1}
            />
          )}
        </Flex>
      </Flex>
      <Flex row alignItems="center" gap="$gap8">
        <SegmentedControl
          options={timePeriodOptions.options}
          selectedOption={timePeriodOptions.selected}
          onSelectOption={(option: HistoryDuration) => {
            setSelectedHistoryDuration(option)
            setZoomFactor(1)
            setBoundaryPrices(undefined)
          }}
        />
        <Flex row centered borderRadius="$roundedFull">
          <Button
            animation="100ms"
            backgroundColor="$transparent"
            hoverStyle={{ backgroundColor: '$transparent', opacity: 0.8 }}
            pressStyle={{ backgroundColor: '$surface3', opacity: 0.8 }}
            alignItems="center"
            justifyContent="center"
            borderColor="$surface3"
            borderWidth={1}
            borderTopLeftRadius="$roundedFull"
            borderBottomLeftRadius="$roundedFull"
            p="$spacing8"
            onPress={() => {
              setZoomFactor((prevZoomFactor) => prevZoomFactor * 1.2)
            }}
          >
            <SearchPlus size={16} color="$neutral1" />
          </Button>
          <Button
            animation="100ms"
            backgroundColor="$transparent"
            hoverStyle={{ backgroundColor: '$transparent', opacity: 0.8 }}
            pressStyle={{ backgroundColor: '$surface3', opacity: 0.8 }}
            alignItems="center"
            justifyContent="center"
            borderColor="$surface3"
            borderWidth={1}
            borderTopRightRadius="$roundedFull"
            borderBottomRightRadius="$roundedFull"
            p="$spacing8"
            onPress={() => {
              setZoomFactor((prevZoomFactor) => prevZoomFactor / 1.2)
            }}
          >
            <SearchMinus size={16} color="$neutral1" />
          </Button>
        </Flex>
        <Button
          height={32}
          backgroundColor="$transparent"
          borderColor="$surface3"
          borderWidth={1}
          hoverStyle={{ backgroundColor: '$transparent', opacity: 0.8 }}
          pressStyle={{ backgroundColor: '$surface3', opacity: 0.8 }}
          onPress={() => {
            setSelectedHistoryDuration(HistoryDuration.Month)
            setZoomFactor(1)
            setMinPrice(undefined)
            setMaxPrice(undefined)
          }}
        >
          <Text variant="buttonLabel3">{t('common.button.reset')}</Text>
        </Button>
      </Flex>
    </Flex>
  )
}
