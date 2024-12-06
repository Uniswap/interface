// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { ActiveLiquidityChart2 } from 'components/Charts/ActiveLiquidityChart/ActiveLiquidityChart2'
import { Chart, DEFAULT_BOTTOM_PRICE_SCALE_MARGIN, DEFAULT_TOP_PRICE_SCALE_MARGIN } from 'components/Charts/ChartModel'
import { LPPriceChartModel } from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { ChartErrorView } from 'components/Charts/LoadingState'
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
  // Sets the min/max prices of the price axis manually, which is used to zoom in/out.
  const [priceScaleMargins, setPriceScaleMargins] = useState({
    top: DEFAULT_TOP_PRICE_SCALE_MARGIN,
    bottom: DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
  })

  const maxZoomOut = priceScaleMargins.bottom + priceScaleMargins.top >= 0.9
  const maxZoomIn = priceScaleMargins.bottom + priceScaleMargins.top <= 0.1

  const priceChartParams = useMemo(() => {
    return {
      data: priceData.entries,
      stale: priceData.dataQuality === DataQuality.STALE,
      type: PriceChartType.LINE,
      height: 164,
      color: colors.accent1.val,
      currentPriceLineColor: colors.neutral2.val,
      showXAxis: true,
      priceScaleMargins,
      setBoundaryPrices,
      isReversed,
    } as const
  }, [colors.accent1.val, colors.neutral2.val, isReversed, priceData.dataQuality, priceData.entries, priceScaleMargins])

  const { formattedData, isLoading: liquidityDataLoading } = useDensityChartData({
    currencyA: sortedCurrencies[0],
    currencyB: sortedCurrencies[1],
    feeAmount: Number(feeTier),
    invertPrices: !isReversed,
  })

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
    (!priceData.loading && priceData.entries.length === 0) || (!liquidityDataLoading && !formattedData)

  return (
    <Flex gap="$gap8" overflow="hidden">
      <Flex height={CHART_HEIGHT + BOTTOM_AXIS_HEIGHT} width={CHART_CONTAINER_WIDTH}>
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
          {(priceData.loading || showChartErrorView) && (
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
          {formattedData && !liquidityDataLoading && !priceData.loading && boundaryPrices && (
            <ActiveLiquidityChart2
              data={{
                series: formattedData,
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
            setPriceScaleMargins({
              top: DEFAULT_TOP_PRICE_SCALE_MARGIN,
              bottom: DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
            })
            setBoundaryPrices(undefined)
          }}
        />
        <Flex row centered borderRadius="$roundedFull">
          <Button
            disabled={maxZoomIn}
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
              const newTop = priceScaleMargins.top * 0.8
              const newBottom = priceScaleMargins.bottom * 0.8
              if (newTop + newBottom <= 0.1) {
                setPriceScaleMargins({
                  top: 0.04,
                  bottom: 0.06,
                })
                return
              }
              setPriceScaleMargins({
                top: newTop,
                bottom: newBottom,
              })
            }}
          >
            <SearchPlus size={16} color="$neutral1" />
          </Button>
          <Button
            disabled={maxZoomOut}
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
              const newTop = priceScaleMargins.top * 1.2
              const newBottom = priceScaleMargins.bottom * 1.2
              if (newTop + newBottom >= 0.9) {
                setPriceScaleMargins({
                  top: 0.4,
                  bottom: 0.5,
                })
                return
              }
              setPriceScaleMargins({
                top: newTop,
                bottom: newBottom,
              })
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
            setPriceScaleMargins({
              top: DEFAULT_TOP_PRICE_SCALE_MARGIN,
              bottom: DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
            })
            setBoundaryPrices(undefined)
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
