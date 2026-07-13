import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { GraphQLApi, parseRestProtocolVersion } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useAtomValue } from 'jotai/utils'
import { createParser, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, SegmentedControl, useMedia } from 'ui/src'
import { getLowVarianceAxisDecimals } from 'uniswap/src/components/charts/utils'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'
import { PoolData } from '~/appGraphql/data/pools/usePoolData'
import { gqlToCurrency, TimePeriod, toHistoryDuration } from '~/appGraphql/data/util'
import { ChartHeader } from '~/components/Charts/ChartHeader'
import { Chart, refitChartContentAtom } from '~/components/Charts/ChartModel'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { PriceChartData, PriceChartModel } from '~/components/Charts/PriceChart'
import { PriceChartDelta } from '~/components/Charts/PriceChart/PriceChartDelta'
import { getCandlestickPriceBounds } from '~/components/Charts/PriceChart/utils'
import { ChartQueryResult, ChartType, DataQuality, PriceChartType } from '~/components/Charts/utils'
import { VolumeChart } from '~/components/Charts/VolumeChart'
import { SingleHistogramData } from '~/components/Charts/VolumeChart/utils'
import { ChartActionsContainer } from '~/features/Explore/chart/ChartActionsContainer'
import { ChartTypeToggle } from '~/features/Explore/chart/ChartTypeToggle'
import { getPillTimeSelectorOptions, ORDERED_TIMES } from '~/features/Explore/timeLabels'
import { ZoomButtons } from '~/features/Liquidity/charts/D3LiquidityChartShared/components/ZoomButtons'
import { usePoolPriceChartData } from '~/features/Liquidity/charts/usePoolPriceChartData'
import { tryParseCurrencyAmount } from '~/lib/utils/tryParseCurrencyAmount'
import { ChartPriceText, PriceDisplayContainer } from '~/pages/PoolDetails/components/ChartSection/ChartPriceDisplay'
import {
  D3LiquidityPoolChart,
  D3LiquidityPoolChartZoomActions,
} from '~/pages/PoolDetails/components/ChartSection/D3LiquidityPoolChart'
import { DepthChart } from '~/pages/PoolDetails/components/ChartSection/DepthChart'
import { usePDPVolumeChartData } from '~/pages/PoolDetails/components/ChartSection/hooks'
import { formatPriceWithSubscript } from '~/pages/PoolDetails/components/formatPriceWithSubscript'
import { unwrappedToken } from '~/utils/unwrappedToken'

const PDP_CHART_HEIGHT_PX = 356
const PDP_CHART_SELECTOR_OPTIONS = [ChartType.VOLUME, ChartType.PRICE, ChartType.LIQUIDITY, ChartType.DEPTH] as const

export type PoolsDetailsChartType = (typeof PDP_CHART_SELECTOR_OPTIONS)[number]

const CHART_URL_VALUE_TO_TYPE: Record<string, PoolsDetailsChartType> = {
  volume: ChartType.VOLUME,
  price: ChartType.PRICE,
  liquidity: ChartType.LIQUIDITY,
  depth: ChartType.DEPTH,
}
const CHART_TYPE_TO_URL_VALUE: Record<PoolsDetailsChartType, string> = {
  [ChartType.VOLUME]: 'volume',
  [ChartType.PRICE]: 'price',
  [ChartType.LIQUIDITY]: 'liquidity',
  [ChartType.DEPTH]: 'depth',
}
const parseAsPDPChartType = createParser({
  parse: (query: string) => CHART_URL_VALUE_TO_TYPE[query.toLowerCase()] ?? null,
  serialize: (value: PoolsDetailsChartType) => CHART_TYPE_TO_URL_VALUE[value],
})
  .withDefault(ChartType.VOLUME)
  .withOptions({ clearOnDefault: true })
interface ChartSectionProps {
  poolData?: PoolData
  loading: boolean
  isReversed: boolean
  chain?: GraphQLApi.Chain
  tokenAColor: string
  tokenBColor: string
}

/** Represents a variety of query result shapes, discriminated via additional `chartType` field. */
type ActiveQuery =
  | ChartQueryResult<PriceChartData, ChartType.PRICE>
  | ChartQueryResult<SingleHistogramData, ChartType.VOLUME>
  | ChartQueryResult<undefined, ChartType.LIQUIDITY>

type TDPChartState = {
  timePeriod: TimePeriod
  setTimePeriod: (timePeriod: TimePeriod) => void
  setChartType: (chartType: PoolsDetailsChartType) => void
  selectedChartType: PoolsDetailsChartType
  activeQuery: ActiveQuery
  dataQuality?: DataQuality
  priceEntries?: PriceChartData[]
}

function usePDPChartState({
  poolData,
  isReversed,
  chain,
  protocolVersion,
}: {
  poolData: PoolData | undefined
  isReversed: boolean
  chain: GraphQLApi.Chain
  protocolVersion: GraphQLApi.ProtocolVersion
}): TDPChartState {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.DAY)
  const [selectedChartType, setChartType] = useQueryState('chart', parseAsPDPChartType)

  const isV2 = protocolVersion === GraphQLApi.ProtocolVersion.V2

  // DEPTH is not supported for v2 pools — normalize to VOLUME if the URL holds ?chart=depth.
  const normalizedChartType = isV2 && selectedChartType === ChartType.DEPTH ? ChartType.VOLUME : selectedChartType
  // DEPTH is a different visualization of the same data as LIQUIDITY — share data fetching.
  const chartType = normalizedChartType === ChartType.DEPTH ? ChartType.LIQUIDITY : normalizedChartType
  const isV3 = protocolVersion === GraphQLApi.ProtocolVersion.V3
  const isV4 = protocolVersion === GraphQLApi.ProtocolVersion.V4
  const variables = {
    addressOrId: poolData?.idOrAddress ?? '',
    chain,
    duration: toHistoryDuration(timePeriod),
    isV4,
    isV3,
    isV2,
  }

  const priceQuery = usePoolPriceChartData({ variables, priceInverted: isReversed })
  const volumeQuery = usePDPVolumeChartData({ variables })

  return useMemo(() => {
    const activeQuery =
      chartType === ChartType.PRICE
        ? priceQuery
        : chartType === ChartType.VOLUME
          ? volumeQuery
          : {
              chartType: ChartType.LIQUIDITY as const,
              entries: [],
              loading: false,
              dataQuality: DataQuality.VALID,
            }

    return {
      timePeriod,
      setTimePeriod,
      setChartType,
      selectedChartType: normalizedChartType,
      activeQuery,
      priceEntries: priceQuery.entries,
    }
  }, [chartType, normalizedChartType, volumeQuery, priceQuery, timePeriod, setChartType])
}

export function ChartSection(props: ChartSectionProps) {
  const { defaultChainId } = useEnabledChains()
  const media = useMedia()
  const { t } = useTranslation()
  const isLiquidityDepthChartEnabled = useFeatureFlag(FeatureFlags.LpPdpDepthChart)
  const [zoomActions, setZoomActions] = useState<D3LiquidityPoolChartZoomActions | null>(null)

  const [currencyA, currencyB] = [
    props.poolData?.token0 && gqlToCurrency(props.poolData.token0),
    props.poolData?.token1 && gqlToCurrency(props.poolData.token1),
  ]

  const { setChartType, timePeriod, setTimePeriod, activeQuery, selectedChartType, priceEntries } = usePDPChartState({
    poolData: props.poolData,
    isReversed: props.isReversed,
    chain: props.chain ?? GraphQLApi.Chain.Ethereum,
    protocolVersion: props.poolData?.protocolVersion ?? GraphQLApi.ProtocolVersion.V3,
  })

  const refitChartContent = useAtomValue(refitChartContentAtom)

  // TODO(WEB-3740): Integrate BE tick query, remove special casing for liquidity chart
  const loading = props.loading || (activeQuery.chartType !== ChartType.LIQUIDITY ? activeQuery.loading : false)

  // oxlint-disable-next-line typescript/consistent-return
  const ChartBody = (() => {
    if (!currencyA || !currencyB || !props.poolData || !props.chain) {
      return <ChartSkeleton type={activeQuery.chartType} height={PDP_CHART_HEIGHT_PX} />
    }

    const selectedChartProps = {
      ...props,
      feeTier: Number(props.poolData.feeTier?.feeAmount),
      height: PDP_CHART_HEIGHT_PX,
      timePeriod,
      tokenA: currencyA,
      tokenB: currencyB,
      tokenAColor: props.tokenAColor,
      tokenBColor: props.tokenBColor,
      chainId: fromGraphQLChain(props.chain) ?? defaultChainId,
      poolId: props.poolData.idOrAddress,
      hooks: props.poolData.hookAddress,
      version: parseRestProtocolVersion(props.poolData.protocolVersion) ?? RestProtocolVersion.V3,
    }

    // TODO(WEB-3740): Integrate BE tick query, remove special casing for liquidity chart
    if (activeQuery.chartType === ChartType.LIQUIDITY) {
      if (selectedChartType === ChartType.DEPTH) {
        return <DepthChart {...selectedChartProps} onZoomActionsReady={setZoomActions} priceEntries={priceEntries} />
      }
      return <D3LiquidityPoolChart {...selectedChartProps} onZoomActionsReady={setZoomActions} />
    }
    if (activeQuery.dataQuality === DataQuality.INVALID) {
      const errorText = loading ? undefined : t('chart.error.pools')
      return <ChartSkeleton type={activeQuery.chartType} height={PDP_CHART_HEIGHT_PX} errorText={errorText} />
    }

    const stale = activeQuery.dataQuality === DataQuality.STALE

    switch (activeQuery.chartType) {
      case ChartType.PRICE:
        return (
          <PriceChart
            {...selectedChartProps}
            data={activeQuery.entries}
            stale={stale}
            overrideColor={props.isReversed ? props.tokenBColor : props.tokenAColor}
          />
        )
      case ChartType.VOLUME:
        return <VolumeChart {...selectedChartProps} data={activeQuery.entries} stale={stale} />
    }
  })()

  // BE does not support hourly price data for pools
  const filteredTimeOptions = useMemo(() => {
    if (activeQuery.chartType === ChartType.PRICE) {
      if (timePeriod === TimePeriod.HOUR) {
        setTimePeriod(TimePeriod.DAY)
      }
      return {
        options: getPillTimeSelectorOptions(
          t,
          ORDERED_TIMES.filter((period) => period !== TimePeriod.HOUR),
        ),
        selected: timePeriod,
      }
    }
    return {
      options: getPillTimeSelectorOptions(t),
      selected: timePeriod,
    }
  }, [activeQuery.chartType, timePeriod, setTimePeriod, t])

  const isV2Pool = props.poolData?.protocolVersion === GraphQLApi.ProtocolVersion.V2

  const disabledChartOption = isV2Pool ? [ChartType.LIQUIDITY, ChartType.DEPTH] : undefined

  const availableChartOptions = useMemo(
    () =>
      isLiquidityDepthChartEnabled
        ? PDP_CHART_SELECTOR_OPTIONS
        : PDP_CHART_SELECTOR_OPTIONS.filter((o) => o !== ChartType.DEPTH),
    [isLiquidityDepthChartEnabled],
  )

  // When the depth flag is off but the URL still holds ?chart=depth, reflect it as liquidity in the toggle.
  const displayChartType = isLiquidityDepthChartEnabled ? selectedChartType : activeQuery.chartType

  return (
    <Flex data-testid="pdp-chart-container">
      <Flex height="$spacing48" justifyContent="center" mb="$spacing24">
        <ChartTypeToggle
          variant="text"
          availableOptions={availableChartOptions}
          currentChartType={displayChartType}
          onChartTypeChange={(c: ChartType) => {
            if (c !== ChartType.LIQUIDITY) {
              setZoomActions(null)
            }
            setChartType(c as PoolsDetailsChartType)
          }}
          disabledOption={disabledChartOption}
        />
      </Flex>
      {ChartBody}
      {activeQuery.chartType === ChartType.LIQUIDITY ? (
        zoomActions ? (
          <ChartActionsContainer>
            <ZoomButtons
              onZoomIn={zoomActions.zoomIn}
              onZoomOut={zoomActions.zoomOut}
              onReset={zoomActions.resetView}
            />
          </ChartActionsContainer>
        ) : null
      ) : (
        <ChartActionsContainer>
          <Flex $md={{ width: '100%' }}>
            <SegmentedControl
              fullWidth={media.md}
              options={filteredTimeOptions.options}
              selectedOption={filteredTimeOptions.selected}
              onSelectOption={(option: TimePeriod) => {
                if (option === timePeriod) {
                  refitChartContent?.()
                } else {
                  setTimePeriod(option)
                }
              }}
            />
          </Flex>
        </ChartActionsContainer>
      )}
    </Flex>
  )
}

function PriceChart({
  tokenA,
  tokenB,
  isReversed,
  data,
  stale,
  overrideColor,
}: {
  tokenA: Token | NativeCurrency
  tokenB: Token | NativeCurrency
  isReversed: boolean
  data: PriceChartData[]
  stale: boolean
  overrideColor?: string
}) {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const locale = useCurrentLocale()
  const [baseCurrency, quoteCurrency] = isReversed ? [tokenB, tokenA] : [tokenA, tokenB]
  const baseSymbol = unwrappedToken(baseCurrency).symbol ?? baseCurrency.symbol
  const quoteSymbol = unwrappedToken(quoteCurrency).symbol ?? quoteCurrency.symbol

  // Stablecoin pools sit in a price range too tight for the magnitude-based formatter to resolve,
  // so derive the precision from the visible range to keep gridlines (and the header) distinct.
  const axisFractionDigits = useMemo(() => {
    const { min, max } = getCandlestickPriceBounds(data)
    return getLowVarianceAxisDecimals(min, max)
  }, [data])

  const yAxisFormatter = useMemo(
    () => (price: number) =>
      formatPriceWithSubscript({ price, locale, formatNumberOrString, fractionDigits: axisFractionDigits }),
    [locale, formatNumberOrString, axisFractionDigits],
  )

  const params = useMemo(
    () => ({ data, stale, type: PriceChartType.LINE, yAxisFormatter }),
    [data, stale, yAxisFormatter],
  )

  const lastPrice = data[data.length - 1]
  const price = useUSDCValue(tryParseCurrencyAmount(lastPrice.value.toString(), quoteCurrency))
  return (
    <Chart
      height={PDP_CHART_HEIGHT_PX}
      Model={PriceChartModel}
      params={params}
      showDottedBackground
      showLeftFadeOverlay
      overrideColor={overrideColor}
    >
      {(crosshairData) => {
        const displayValue = crosshairData ?? lastPrice
        // `usePoolPriceChartData` populates only the candlestick fields (open/high/low/close)
        // even though the TS type also exposes `value`. Always read `close` here — it's the
        // field with the actual price.
        const priceDisplay = (
          <PriceDisplayContainer>
            <ChartPriceText>
              {`1 ${baseSymbol} = ${formatPriceWithSubscript({
                price: displayValue.close,
                locale,
                formatNumberOrString,
                fractionDigits: axisFractionDigits,
              })} ${quoteSymbol}`}
            </ChartPriceText>
            <ChartPriceText color="neutral2">
              {/* the usd price is only calculated for the most recent data point so hide it when selecting a crosshair */}
              {price && !crosshairData
                ? '(' + convertFiatAmountFormatted(price.toSignificant(), NumberType.FiatTokenPrice) + ')'
                : ''}
            </ChartPriceText>
            <PriceChartDelta startingPrice={data[0].close} endingPrice={displayValue.close} />
          </PriceDisplayContainer>
        )
        return (
          <ChartHeader value={priceDisplay} valueFormatterType={NumberType.FiatTokenPrice} time={crosshairData?.time} />
        )
      }}
    </Chart>
  )
}
