import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { ActiveLiquidityChart } from 'components/Charts/ActiveLiquidityChart/ActiveLiquidityChart'
import { Chart } from 'components/Charts/ChartModel'
import { LPPriceChartModel } from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { useRangeInputSizes } from 'components/Charts/LiquidityRangeInput/constants'
import { useDensityChartData } from 'components/Charts/LiquidityRangeInput/hooks'
import { ChartErrorView } from 'components/Charts/LoadingState'
import { getCandlestickPriceBounds } from 'components/Charts/PriceChart/utils'
import { PriceChartType } from 'components/Charts/utils'
import { DropdownSelector } from 'components/DropdownSelector'
import { DataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { ZERO_ADDRESS } from 'constants/misc'
import { usePoolPriceChartData } from 'hooks/usePoolPriceChartData'
import {
  getCurrencyAddressWithWrap,
  getCurrencyWithWrap,
  getSortedCurrenciesTupleWithWrap,
} from 'pages/Pool/Positions/create/utils'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components'
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
import { HorizontalDensityChart } from 'ui/src/components/icons/HorizontalDensityChart'
import { LoadingPriceCurve } from 'ui/src/components/icons/LoadingPriceCurve'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { SearchMinus } from 'ui/src/components/icons/SearchMinus'
import { SearchPlus } from 'ui/src/components/icons/SearchPlus'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { isMobileWeb } from 'utilities/src/platform'

const MIN_DATA_POINTS = 5

const PlusMinusButton = ({ children, ...props }: TouchableAreaProps) => {
  return (
    <TouchableArea
      {...props}
      animation="100ms"
      backgroundColor="$transparent"
      hoverStyle={{ backgroundColor: '$transparent', opacity: 0.8 }}
      pressStyle={{ backgroundColor: '$surface3', opacity: 0.8 }}
      alignItems="center"
      justifyContent="center"
      borderColor="$surface3"
      borderWidth="$spacing1"
      p="$spacing8"
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
  currency0,
  currency1,
  feeTier,
  tickSpacing,
  protocolVersion,
  poolId,
  hook,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  disableBrushInteraction = false,
  setFallbackRangePrices,
}: {
  currency0: Currency
  currency1: Currency
  feeTier: number | string
  tickSpacing?: number
  protocolVersion: ProtocolVersion
  hook?: string
  poolId: string
  minPrice?: number
  maxPrice?: number
  disableBrushInteraction?: boolean
  setMinPrice: (minPrice?: number) => void
  setMaxPrice: (maxPrice?: number) => void
  setFallbackRangePrices: () => void
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
  // This is also used to set the bounds of the ActiveLiquidityChart, so it's necessary to keep separate from the zooming state.
  const [boundaryPrices, setBoundaryPrices] = useState<[number, number]>()

  const [zoomFactor, setZoomFactor] = useState(1)

  const { dataMin, dataMax } = useMemo(() => {
    const { min: dataMin, max: dataMax } = getCandlestickPriceBounds(priceData.entries)
    return { dataMin, dataMax }
  }, [priceData.entries])

  const [midPrice, setMidPrice] = useState<number>()
  const [showDiffIndicators, setShowDiffIndicators] = useState(false)

  useEffect(() => {
    if (priceData.entries.length > 0) {
      setMidPrice(priceData.entries[priceData.entries.length - 1]?.value)
    }
  }, [priceData.entries])

  const scrollIncrement = (dataMax - dataMin) / 10

  // Sets the min/max prices of the price axis manually, which is used to center the current price and zoom in/out.
  const { minVisiblePrice, maxVisiblePrice } = useMemo(() => {
    if (!midPrice) {
      return {
        minVisiblePrice: dataMin,
        maxVisiblePrice: dataMax,
      }
    }
    const mostRecentPrice = priceData.entries[priceData.entries.length - 1]?.value
    // Calculate the default range based on the current price.
    const maxSpread = Math.max(mostRecentPrice - dataMin, dataMax - mostRecentPrice)
    // Initial unscaled range to fit all values with the current price centered
    const initialRange = 2 * maxSpread
    const newRange = initialRange / zoomFactor

    return {
      minVisiblePrice: midPrice - newRange / 2,
      maxVisiblePrice: midPrice + newRange / 2,
    }
  }, [dataMax, dataMin, midPrice, priceData.entries, zoomFactor])

  const containerRef = useRef<HTMLDivElement>(null)
  const sizes = useRangeInputSizes(containerRef.current?.clientWidth)

  const priceChartParams = useMemo(() => {
    return {
      data: priceData.entries,
      stale: priceData.dataQuality === DataQuality.STALE,
      type: PriceChartType.LINE,
      height: sizes.chartHeight,
      color: colors.accent1.val,
      currentPriceLineColor: colors.neutral2.val,
      showXAxis: true,
      minVisiblePrice,
      maxVisiblePrice,
      setBoundaryPrices,
      isReversed,
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
    colors.accent1.val,
    colors.neutral2.val,
    minVisiblePrice,
    maxVisiblePrice,
    isReversed,
  ])

  const { formattedData, isLoading: liquidityDataLoading } = useDensityChartData({
    poolId,
    currencyA: sortedCurrencies[0],
    currencyB: sortedCurrencies[1],
    invertPrices: !isReversed,
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
    const options: Array<SegmentedControlOption<HistoryDuration> & { verboseDisplay: JSX.Element }> = [
      [
        HistoryDuration.Day,
        t('token.priceExplorer.timeRangeLabel.day'),
        t('token.priceExplorer.timeRangeLabel.day.verbose'),
      ],
      [
        HistoryDuration.Week,
        t('token.priceExplorer.timeRangeLabel.week'),
        t('token.priceExplorer.timeRangeLabel.week.verbose'),
      ],
      [
        HistoryDuration.Month,
        t('token.priceExplorer.timeRangeLabel.month'),
        t('token.priceExplorer.timeRangeLabel.month.verbose'),
      ],
      [
        HistoryDuration.Year,
        t('token.priceExplorer.timeRangeLabel.year'),
        t('token.priceExplorer.timeRangeLabel.year.verbose'),
      ],
      [HistoryDuration.Max, t('token.priceExplorer.timeRangeLabel.all')],
    ].map((timePeriod) => ({
      value: timePeriod[0] as HistoryDuration,
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
    (!priceData.loading && priceData.entries.length < MIN_DATA_POINTS) ||
    (!liquidityDataLoading && !sortedFormattedData) ||
    (!liquidityDataLoading && sortedFormattedData && sortedFormattedData.length < MIN_DATA_POINTS)

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
          {(priceData.loading || showChartErrorView) && (!priceData.entries || priceData.entries.length === 0) && (
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
                  current: priceData.entries[priceData.entries.length - 1]?.value,
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
                currency0={currency0}
                currency1={currency1}
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
            <DropdownSelector
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
            </DropdownSelector>
          ) : (
            <SegmentedControl
              options={timePeriodOptions.options}
              selectedOption={timePeriodOptions.selected}
              onSelectOption={(option: HistoryDuration) => {
                setSelectedHistoryDuration(option)
                setZoomFactor(1)
                setBoundaryPrices(undefined)
              }}
            />
          )}
          <Flex row centered borderRadius="$roundedFull">
            <PlusMinusButton
              borderTopLeftRadius="$roundedFull"
              borderBottomLeftRadius="$roundedFull"
              onPress={() => {
                setZoomFactor((prevZoomFactor) => prevZoomFactor * 1.2)
              }}
            >
              <SearchPlus size={16} color="$neutral1" />
            </PlusMinusButton>
            <PlusMinusButton
              borderTopRightRadius="$roundedFull"
              borderBottomRightRadius="$roundedFull"
              onPress={() => {
                setZoomFactor((prevZoomFactor) => prevZoomFactor / 1.2)
              }}
            >
              <SearchMinus size={16} color="$neutral1" />
            </PlusMinusButton>
          </Flex>
        </Flex>
        <Button
          emphasis="tertiary"
          size="small"
          fill={false}
          backgroundColor="$transparent"
          onPress={() => {
            setSelectedHistoryDuration(HistoryDuration.Month)
            setZoomFactor(1)
            setMinPrice(undefined)
            setMaxPrice(undefined)
            setMidPrice(priceData.entries[priceData.entries.length - 1]?.value)
          }}
          icon={isMobileWeb ? <RotateLeft /> : undefined}
        >
          {isMobileWeb ? null : t('common.button.reset')}
        </Button>
      </Flex>
    </Flex>
  )
}
