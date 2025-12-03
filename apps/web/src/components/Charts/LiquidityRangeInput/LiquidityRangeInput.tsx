/* eslint-disable max-lines */
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { ActiveLiquidityChart } from 'components/Charts/ActiveLiquidityChart/ActiveLiquidityChart'
import { Chart } from 'components/Charts/ChartModel'
import { LPPriceChartModel } from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { useRangeInputSizes } from 'components/Charts/LiquidityRangeInput/constants'
import { useDensityChartData } from 'components/Charts/LiquidityRangeInput/hooks'
import { ChartErrorView } from 'components/Charts/LoadingState'
import { PriceChartData } from 'components/Charts/PriceChart'
import { getCandlestickPriceBounds, getEffectivePrice } from 'components/Charts/PriceChart/utils'
import { PriceChartType } from 'components/Charts/utils'
import { Dropdown } from 'components/Dropdowns/Dropdown'
import { DataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { usePoolPriceChartData } from 'hooks/usePoolPriceChartData'
import { UTCTimestamp } from 'lightweight-charts'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import {
  Button,
  Flex,
  SegmentedControl,
  SegmentedControlOption,
  Shine,
  Text,
  TouchableArea,
  TouchableAreaProps,
  useSporeColors,
} from 'ui/src'
import { Expand } from 'ui/src/components/icons/Expand'
import { HorizontalDensityChart } from 'ui/src/components/icons/HorizontalDensityChart'
import { LoadingPriceCurve } from 'ui/src/components/icons/LoadingPriceCurve'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { SearchMinus } from 'ui/src/components/icons/SearchMinus'
import { SearchPlus } from 'ui/src/components/icons/SearchPlus'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { isMobileWeb } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

const MIN_DATA_POINTS = 5

const ZoomOptionButton = ({ children, ...props }: TouchableAreaProps) => {
  return (
    <TouchableArea
      animation="100ms"
      backgroundColor="$transparent"
      hoverStyle={{ backgroundColor: '$transparent', opacity: 0.8 }}
      pressStyle={{ backgroundColor: '$surface3', opacity: 0.8 }}
      alignItems="center"
      justifyContent="center"
      borderColor="$surface3"
      borderWidth="$spacing1"
      p="$spacing8"
      {...props}
    >
      {children}
    </TouchableArea>
  )
}

/**
 * Chart input for selecting the min/max prices for a liquidity position.
 * Note that the min value can be negative.
 */
export function LiquidityRangeInput({
  quoteCurrency,
  baseCurrency,
  sdkCurrencies,
  priceInverted,
  feeTier,
  tickSpacing,
  protocolVersion,
  poolId,
  poolOrPairLoading,
  hook,
  midPrice: currentPrice,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  disableBrushInteraction = false,
  setFallbackRangePrices,
}: {
  quoteCurrency: Currency
  baseCurrency: Currency
  sdkCurrencies: {
    TOKEN0: Maybe<Currency>
    TOKEN1: Maybe<Currency>
  }
  priceInverted: boolean
  feeTier: number | string
  tickSpacing?: number
  protocolVersion: ProtocolVersion
  hook?: string
  poolId?: string
  poolOrPairLoading?: boolean
  midPrice?: number
  minPrice?: number
  maxPrice?: number
  disableBrushInteraction?: boolean
  setMinPrice: (minPrice?: number) => void
  setMaxPrice: (maxPrice?: number) => void
  setFallbackRangePrices: () => void
}) {
  const chainInfo = getChainInfo(quoteCurrency.chainId)
  const colors = useSporeColors()
  const { t } = useTranslation()

  const [selectedHistoryDuration, setSelectedHistoryDuration] = useState<GraphQLApi.HistoryDuration>(
    GraphQLApi.HistoryDuration.Month,
  )

  const priceData = usePoolPriceChartData({
    // If the Pool doesn't exist, the poolId is undefined and we skip this query.
    variables: {
      addressOrId: poolId,
      chain: chainInfo.backendChain.chain,
      duration: selectedHistoryDuration,
      isV4: protocolVersion === ProtocolVersion.V4,
      isV3: protocolVersion === ProtocolVersion.V3,
      isV2: false,
    },
    priceInverted,
  })

  const currentPriceData: PriceChartData | undefined = useMemo(() => {
    if (!currentPrice) {
      return undefined
    }
    return {
      time: new Date().getTime() as UTCTimestamp,
      value: currentPrice,
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      close: currentPrice,
    }
  }, [currentPrice])

  // Set via a callback from the LiquidityPositionRangeChart, which is important when the price axis is auto-scaled.
  // This is also used to set the bounds of the ActiveLiquidityChart, so it's necessary to keep separate from the zooming state.
  const [boundaryPrices, setBoundaryPrices] = useState<[number, number]>()

  const [zoomFactor, setZoomFactor] = useState(1)

  const { dataMin, dataMax } = useMemo(() => {
    const { min: dataMin, max: dataMax } = getCandlestickPriceBounds(priceData.entries)
    return { dataMin, dataMax }
  }, [priceData.entries])

  const [midPrice, setMidPrice] = useState<number | undefined>(currentPrice)
  const [showDiffIndicators, setShowDiffIndicators] = useState(false)

  useEffect(() => {
    if (priceData.entries.length > 0) {
      setMidPrice(getEffectivePrice({ currentPrice, data: priceData.entries }))
    }
  }, [priceData.entries, currentPrice])

  useEffect(() => {
    if (chartModelRef.current && !boundaryPrices) {
      chartModelRef.current.resetBoundaryPrices()
    }
  }, [boundaryPrices])

  const scrollIncrement = (dataMax - dataMin) / 10

  const handleSnapRangeToView = useEvent(() => {
    if (minPrice !== undefined && maxPrice !== undefined && minPrice >= 0 && maxPrice >= 0) {
      // Center point of the selected range
      const rangeCenter = (minPrice + maxPrice) / 2
      // How wide the selected range is
      const rangeSpan = maxPrice - minPrice
      // How wide the chart is
      const chartSpan = dataMax - dataMin

      if (rangeSpan > 0 && chartSpan > 0) {
        // Chart width / range width
        const newZoomFactor = chartSpan / rangeSpan
        // Center the chart on the selected range
        setMidPrice(rangeCenter)
        setZoomFactor(newZoomFactor)
      } else {
        setZoomFactor(1)
      }
    } else {
      setZoomFactor(1)
    }
  })

  // Sets the min/max prices of the price axis manually, which is used to center the current price and zoom in/out.
  const { minVisiblePrice, maxVisiblePrice } = useMemo(() => {
    if (!midPrice) {
      return {
        minVisiblePrice: dataMin,
        maxVisiblePrice: dataMax,
      }
    }
    const mostRecentPrice = getEffectivePrice({ currentPrice, data: priceData.entries })
    // Calculate the default range based on the current price.
    const maxSpread = Math.max(mostRecentPrice - dataMin, dataMax - mostRecentPrice)
    // Initial unscaled range to fit all values with the current price centered
    const initialRange = 2 * maxSpread
    const newRange = initialRange / zoomFactor

    return {
      minVisiblePrice: midPrice - newRange / 2,
      maxVisiblePrice: midPrice + newRange / 2,
    }
  }, [dataMax, dataMin, midPrice, currentPrice, priceData.entries, zoomFactor])

  const chartModelRef = useRef<LPPriceChartModel>(undefined)

  const containerRef = useRef<HTMLDivElement>(null)
  const sizes = useRangeInputSizes(containerRef.current?.clientWidth)

  const priceChartParams = useMemo(() => {
    const data = [...priceData.entries, currentPriceData].filter(Boolean) as PriceChartData[]
    return {
      data,
      stale: priceData.dataQuality === DataQuality.STALE,
      type: PriceChartType.LINE,
      height: sizes.chartHeight,
      color: colors.accent1.val,
      colors,
      currentPriceLineColor: colors.neutral2.val,
      showXAxis: true,
      minVisiblePrice,
      maxVisiblePrice,
      setBoundaryPrices,
      onChartReady: (chart: LPPriceChartModel) => {
        chartModelRef.current = chart
      },
      disableExtendedTimeScale: !isMobileWeb,
      allowScrollInteractions: false,
      priceScaleMargins: {
        top: 0,
        bottom: 0,
      },
    } as const
  }, [
    priceData.entries,
    priceData.dataQuality,
    sizes.chartHeight,
    colors,
    minVisiblePrice,
    maxVisiblePrice,
    currentPriceData,
  ])

  const { formattedData, isLoading: liquidityDataLoading } = useDensityChartData({
    poolId,
    sdkCurrencies,
    priceInverted,
    version: protocolVersion,
    feeAmount: Number(feeTier),
    tickSpacing,
    hooks: hook ?? ZERO_ADDRESS,
  })

  const sortedFormattedData = useMemo(() => {
    if (!formattedData) {
      return undefined
    }
    const uniqueTicksMap = new Map()
    formattedData.forEach((entry) => {
      uniqueTicksMap.set(entry.tick, entry)
    })

    // Convert Map values back to array and sort
    return Array.from(uniqueTicksMap.values()).sort((a, b) => a.price0 - b.price0)
  }, [formattedData])

  const timePeriodOptions = useMemo(() => {
    const options: Array<SegmentedControlOption<GraphQLApi.HistoryDuration> & { verboseDisplay: JSX.Element }> = [
      [
        GraphQLApi.HistoryDuration.Day,
        t('token.priceExplorer.timeRangeLabel.day'),
        t('token.priceExplorer.timeRangeLabel.day.verbose'),
      ],
      [
        GraphQLApi.HistoryDuration.Week,
        t('token.priceExplorer.timeRangeLabel.week'),
        t('token.priceExplorer.timeRangeLabel.week.verbose'),
      ],
      [
        GraphQLApi.HistoryDuration.Month,
        t('token.priceExplorer.timeRangeLabel.month'),
        t('token.priceExplorer.timeRangeLabel.month.verbose'),
      ],
      [
        GraphQLApi.HistoryDuration.Year,
        t('token.priceExplorer.timeRangeLabel.year'),
        t('token.priceExplorer.timeRangeLabel.year.verbose'),
      ],
      [GraphQLApi.HistoryDuration.Max, t('token.priceExplorer.timeRangeLabel.all')],
    ].map((timePeriod) => ({
      value: timePeriod[0] as GraphQLApi.HistoryDuration,
      display: <Text variant="buttonLabel3">{timePeriod[1]}</Text>,
      verboseDisplay: <Text variant="buttonLabel3">{timePeriod[2] ?? timePeriod[1]}</Text>,
    }))
    return {
      options,
      selected: selectedHistoryDuration,
    }
  }, [selectedHistoryDuration, t])
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false)

  const showChartErrorView =
    (!poolOrPairLoading && !priceData.loading && priceData.entries.length < MIN_DATA_POINTS) ||
    (!liquidityDataLoading && !sortedFormattedData) ||
    (!liquidityDataLoading && sortedFormattedData && sortedFormattedData.length < MIN_DATA_POINTS)

  // biome-ignore lint/correctness/useExhaustiveDependencies: +midPrice
  useEffect(() => {
    const container = containerRef.current
    if (container && !disableBrushInteraction) {
      let lastCall = 0
      const throttleDelayMs = 50

      const listener = (event: WheelEvent) => {
        event.preventDefault()
        event.stopPropagation()

        const now = Date.now()
        if (now - lastCall >= throttleDelayMs) {
          lastCall = now

          if (event.deltaY < 0) {
            setMidPrice((prevMidPrice) => (prevMidPrice ? prevMidPrice + scrollIncrement : undefined))
          } else if (event.deltaY > 0 && minVisiblePrice > 0) {
            setMidPrice((prevMidPrice) => (prevMidPrice ? prevMidPrice - scrollIncrement : undefined))
          }
        }
      }

      container.addEventListener('wheel', listener)

      return () => {
        container.removeEventListener('wheel', listener)
      }
    }
    return undefined
  }, [disableBrushInteraction, midPrice, minVisiblePrice, scrollIncrement])

  // If chart error view is shown on custom range, set min/max price to defaults
  useEffect(() => {
    if (showChartErrorView && !disableBrushInteraction && minPrice === undefined && maxPrice === undefined) {
      setFallbackRangePrices()
    }

    return undefined
  }, [showChartErrorView, disableBrushInteraction, minPrice, maxPrice, setFallbackRangePrices])

  return (
    <Flex
      gap="$gap8"
      overflow="hidden"
      ref={containerRef}
      onMouseEnter={() => {
        setShowDiffIndicators(true)
      }}
      onMouseLeave={() => {
        setShowDiffIndicators(false)
      }}
    >
      <Flex height={sizes.chartHeight + sizes.bottomAxisHeight} width={sizes.chartContainerWidth} overflow="hidden">
        {showChartErrorView && (
          <ChartErrorView>
            <Text variant="body3" color="$neutral2">
              {t('position.setRange.inputsBelow')}
            </Text>
          </ChartErrorView>
        )}
        <Flex
          width={showChartErrorView ? sizes.chartContainerWidth : sizes.loadedPriceChartWidth}
          height={sizes.chartHeight + sizes.bottomAxisHeight}
          overflow="hidden"
          zIndex={1}
        >
          {(priceData.loading || showChartErrorView) && priceData.entries.length === 0 && (
            <Shine height={sizes.chartHeight} disabled={showChartErrorView} zIndex={0}>
              <LoadingPriceCurve
                size={showChartErrorView ? sizes.chartContainerWidth : sizes.loadedPriceChartWidth}
                color="$neutral2"
              />
            </Shine>
          )}
          {showChartErrorView ? null : (
            <Chart
              Model={LPPriceChartModel}
              params={priceChartParams}
              height={sizes.chartHeight + sizes.bottomAxisHeight}
              disableChartTouchPanning={true}
            />
          )}
        </Flex>
        <Flex
          width={sizes.chartContainerWidth}
          height={sizes.chartHeight}
          position="absolute"
          right={0}
          top={0}
          pointerEvents="none"
          zIndex={2}
        >
          {(liquidityDataLoading || priceData.loading) && (
            <Shine
              position="absolute"
              right={sizes.rightAxisWidth}
              top={0}
              overflow="hidden"
              justifyContent="flex-end"
              height={sizes.chartHeight}
              width={sizes.chartHeight}
            >
              <HorizontalDensityChart color="$neutral2" size={sizes.chartHeight} />
            </Shine>
          )}
          {sortedFormattedData &&
            !liquidityDataLoading &&
            !priceData.loading &&
            boundaryPrices &&
            !showChartErrorView && (
              <ActiveLiquidityChart
                data={{
                  series: sortedFormattedData,
                  current: currentPrice ?? priceData.entries[priceData.entries.length - 1]?.value,
                  min: boundaryPrices[0],
                  max: boundaryPrices[1],
                }}
                disableBrushInteraction={disableBrushInteraction}
                showDiffIndicators={showDiffIndicators}
                brushDomain={minPrice && maxPrice ? [minPrice, maxPrice] : undefined}
                dimensions={{
                  width: sizes.chartContainerWidth,
                  height: sizes.chartHeight,
                  contentWidth: sizes.liquidityChartWidth,
                  axisLabelPaneWidth: sizes.rightAxisWidth,
                }}
                onBrushDomainChange={function (domain: [number, number], mode?: string): void {
                  // You can zoom out far enough to set an invalid range, so we prevent that here.
                  if (domain[0] < 0) {
                    return
                  }
                  // While scrolling we receive updates to the range because the yScale changes,
                  // but we can filter them out because they have an undefined "mode".
                  // The initial range suggestion also comes with an undefined "mode", so we allow that here.
                  const rejectAutoRangeSuggestion =
                    minPrice !== undefined && maxPrice !== undefined && minPrice >= 0 && maxPrice >= 0
                  if (!mode && rejectAutoRangeSuggestion) {
                    return
                  }
                  setMinPrice(domain[0])
                  setMaxPrice(domain[1])
                }}
                quoteCurrency={quoteCurrency}
                baseCurrency={baseCurrency}
                isMobile={isMobileWeb}
              />
            )}
        </Flex>
      </Flex>
      <Flex
        row
        alignItems="center"
        gap="$gap8"
        $lg={{ justifyContent: 'space-between' }}
        $sm={{ row: false, alignItems: 'flex-start' }}
      >
        <Flex row alignItems="center" gap="$gap8" $sm={{ row: false, alignItems: 'flex-start' }}>
          {isMobileWeb ? (
            <Dropdown
              containerStyle={{ width: 'auto' }}
              menuLabel={
                <Flex
                  borderRadius="$rounded16"
                  backgroundColor="transparent"
                  row
                  centered
                  p="$padding8"
                  pl="$padding12"
                  borderColor="$surface3"
                  borderWidth="$spacing1"
                  gap="$gap6"
                  {...ClickableTamaguiStyle}
                >
                  {timePeriodOptions.options.find((p) => p.value === timePeriodOptions.selected)?.display}
                  <RotatableChevron direction="down" height={16} width={16} color="$neutral2" />
                </Flex>
              }
              buttonStyle={{
                borderWidth: 0,
                p: 0,
              }}
              dropdownStyle={{ width: 160 }}
              hideChevron
              isOpen={createDropdownOpen}
              adaptToSheet
              toggleOpen={() => {
                setCreateDropdownOpen((prev) => !prev)
              }}
            >
              {timePeriodOptions.options.map((p) => (
                <Flex
                  key={p.value}
                  width="100%"
                  height={32}
                  row
                  alignItems="center"
                  justifyContent="flex-start"
                  p="$padding12"
                  onPress={() => {
                    setSelectedHistoryDuration(p.value)
                    setZoomFactor(1)
                    setBoundaryPrices(undefined)
                  }}
                >
                  {p.verboseDisplay}
                </Flex>
              ))}
            </Dropdown>
          ) : (
            <SegmentedControl
              options={timePeriodOptions.options}
              selectedOption={timePeriodOptions.selected}
              onSelectOption={(option: GraphQLApi.HistoryDuration) => {
                setSelectedHistoryDuration(option)
                setZoomFactor(1)
                setBoundaryPrices(undefined)
              }}
            />
          )}
          <Flex row centered borderRadius="$roundedFull">
            <ZoomOptionButton
              borderTopLeftRadius="$roundedFull"
              borderBottomLeftRadius="$roundedFull"
              onPress={() => {
                setZoomFactor((prevZoomFactor) => prevZoomFactor * 1.2)
              }}
            >
              <SearchPlus size={16} color="$neutral1" />
            </ZoomOptionButton>
            <ZoomOptionButton
              borderRadius="$none"
              borderLeftWidth={0}
              borderRightWidth={0}
              onPress={handleSnapRangeToView}
            >
              <Expand size={16} color="$neutral1" />
            </ZoomOptionButton>
            <ZoomOptionButton
              borderTopRightRadius="$roundedFull"
              borderBottomRightRadius="$roundedFull"
              onPress={() => {
                setZoomFactor((prevZoomFactor) => prevZoomFactor / 1.2)
              }}
            >
              <SearchMinus size={16} color="$neutral1" />
            </ZoomOptionButton>
          </Flex>
        </Flex>
        <Button
          emphasis="tertiary"
          size="small"
          fill={false}
          backgroundColor="$transparent"
          onPress={() => {
            setZoomFactor(1)
            setMinPrice(undefined)
            setMaxPrice(undefined)
            setBoundaryPrices(undefined)
            setMidPrice(getEffectivePrice({ currentPrice, data: priceChartParams.data }))
          }}
          icon={isMobileWeb ? <RotateLeft /> : undefined}
        >
          {isMobileWeb ? null : t('common.button.reset')}
        </Button>
      </Flex>
    </Flex>
  )
}
