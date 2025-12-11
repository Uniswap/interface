import { PoolData } from 'appGraphql/data/pools/usePoolData'
import { gqlToCurrency, TimePeriod, toHistoryDuration } from 'appGraphql/data/util'
import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, NativeCurrency, Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { GraphQLApi, parseRestProtocolVersion } from '@universe/api'
import { TickTooltipContent } from 'components/Charts/ActiveLiquidityChart/TickTooltip'
import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart, refitChartContentAtom } from 'components/Charts/ChartModel'
import { LiquidityBarChartModel, useLiquidityBarData } from 'components/Charts/LiquidityChart'
import { LiquidityBarData } from 'components/Charts/LiquidityChart/types'
import { ChartSkeleton } from 'components/Charts/LoadingState'
import { PriceChartData, PriceChartDelta, PriceChartModel } from 'components/Charts/PriceChart'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import { VolumeChart } from 'components/Charts/VolumeChart'
import { SingleHistogramData } from 'components/Charts/VolumeChart/renderer'
import ErrorBoundary from 'components/ErrorBoundary'
import { getTokenOrZeroAddress } from 'components/Liquidity/utils/currency'
import { usePDPVolumeChartData } from 'components/Pools/PoolDetails/ChartSection/hooks'
import { ChartActionsContainer, DEFAULT_PILL_TIME_SELECTOR_OPTIONS } from 'components/Tokens/TokenDetails/ChartSection'
import { ChartTypeToggle } from 'components/Tokens/TokenDetails/ChartSection/ChartTypeToggle'
import { ChartQueryResult, DataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import {
  DISPLAYS,
  getTimePeriodFromDisplay,
  TimePeriodDisplay,
} from 'components/Tokens/TokenTable/VolumeTimeFrameSelector'
import { usePoolPriceChartData } from 'hooks/usePoolPriceChartData'
import { useAtomValue } from 'jotai/utils'
import { deprecatedStyled } from 'lib/styled-components'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { EllipsisStyle } from 'theme/components/styles'
import { Flex, SegmentedControl, Text, useMedia, useSporeColors } from 'ui/src'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

const PDP_CHART_HEIGHT_PX = 356
const PDP_CHART_SELECTOR_OPTIONS = [ChartType.VOLUME, ChartType.PRICE, ChartType.LIQUIDITY] as const
export type PoolsDetailsChartType = (typeof PDP_CHART_SELECTOR_OPTIONS)[number]
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
  activeQuery: ActiveQuery
  dataQuality?: DataQuality
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
  const [chartType, setChartType] = useState<PoolsDetailsChartType>(ChartType.VOLUME)

  const isV2 = protocolVersion === GraphQLApi.ProtocolVersion.V2
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
    // eslint-disable-next-line consistent-return
    const activeQuery = (() => {
      switch (chartType) {
        case ChartType.PRICE:
          return priceQuery
        case ChartType.VOLUME:
          return volumeQuery
        case ChartType.LIQUIDITY:
          return {
            chartType: ChartType.LIQUIDITY as const,
            entries: [],
            loading: false,
            dataQuality: DataQuality.VALID,
          }
      }
    })()

    return {
      timePeriod,
      setTimePeriod,
      setChartType,
      activeQuery,
    }
  }, [chartType, volumeQuery, priceQuery, timePeriod])
}

export default function ChartSection(props: ChartSectionProps) {
  const { defaultChainId } = useEnabledChains()
  const media = useMedia()

  const [currencyA, currencyB] = [
    props.poolData?.token0 && gqlToCurrency(props.poolData.token0),
    props.poolData?.token1 && gqlToCurrency(props.poolData.token1),
  ]

  const { setChartType, timePeriod, setTimePeriod, activeQuery } = usePDPChartState({
    poolData: props.poolData,
    isReversed: props.isReversed,
    chain: props.chain ?? GraphQLApi.Chain.Ethereum,
    protocolVersion: props.poolData?.protocolVersion ?? GraphQLApi.ProtocolVersion.V3,
  })

  const refitChartContent = useAtomValue(refitChartContentAtom)

  // TODO(WEB-3740): Integrate BE tick query, remove special casing for liquidity chart
  const loading = props.loading || (activeQuery.chartType !== ChartType.LIQUIDITY ? activeQuery.loading : false)

  // eslint-disable-next-line consistent-return
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
      return <LiquidityChart {...selectedChartProps} />
    }
    if (activeQuery.dataQuality === DataQuality.INVALID) {
      const errorText = loading ? undefined : <Trans i18nKey="chart.error.pools" />
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
            tokenFormatType={NumberType.TokenNonTx}
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
      const filtered = DEFAULT_PILL_TIME_SELECTOR_OPTIONS.filter((option) => option.value !== TimePeriodDisplay.HOUR)
      if (timePeriod === TimePeriod.HOUR) {
        setTimePeriod(TimePeriod.DAY)
      }
      return {
        options: filtered,
        selected: DISPLAYS[timePeriod],
      }
    }
    return {
      options: DEFAULT_PILL_TIME_SELECTOR_OPTIONS,
      selected: DISPLAYS[timePeriod],
    }
  }, [activeQuery.chartType, timePeriod, setTimePeriod])

  const disabledChartOption =
    props.poolData?.protocolVersion === GraphQLApi.ProtocolVersion.V2 ? ChartType.LIQUIDITY : undefined

  return (
    <Flex data-testid="pdp-chart-container">
      {ChartBody}
      <ChartActionsContainer>
        <Flex $md={{ width: '100%' }}>
          <ChartTypeToggle
            availableOptions={PDP_CHART_SELECTOR_OPTIONS}
            currentChartType={activeQuery.chartType}
            onChartTypeChange={(c: ChartType) => {
              setChartType(c as PoolsDetailsChartType)
            }}
            disabledOption={disabledChartOption}
          />
        </Flex>
        {activeQuery.chartType !== ChartType.LIQUIDITY && (
          <Flex $md={{ width: '100%' }}>
            <SegmentedControl
              fullWidth={media.md}
              options={filteredTimeOptions.options}
              selectedOption={filteredTimeOptions.selected}
              onSelectOption={(option) => {
                const time = getTimePeriodFromDisplay(option as TimePeriodDisplay)
                if (time === timePeriod) {
                  refitChartContent?.()
                } else {
                  setTimePeriod(time)
                }
              }}
            />
          </Flex>
        )}
      </ChartActionsContainer>
    </Flex>
  )
}

const PriceDisplayContainer = deprecatedStyled.div`
  display: flex;
  flex-wrap: wrap;
  column-gap: 4px;
`

const ChartPriceText = deprecatedStyled(ThemedText.HeadlineMedium)`
  ${EllipsisStyle}
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    font-size: 24px !important;
    line-height: 32px !important;
  }
`

function PriceChart({
  tokenA,
  tokenB,
  isReversed,
  data,
  stale,
  tokenFormatType,
  overrideColor,
}: {
  tokenA: Token | NativeCurrency
  tokenB: Token | NativeCurrency
  isReversed: boolean
  data: PriceChartData[]
  stale: boolean
  tokenFormatType?: NumberType
  overrideColor?: string
}) {
  const { convertFiatAmountFormatted, formatCurrencyAmount } = useLocalizationContext()
  const [baseCurrency, quoteCurrency] = isReversed ? [tokenB, tokenA] : [tokenA, tokenB]

  const params = useMemo(
    () => ({ data, stale, type: PriceChartType.LINE, tokenFormatType }),
    [data, stale, tokenFormatType],
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
        const priceDisplay = (
          <PriceDisplayContainer>
            <ChartPriceText>
              {`1 ${baseCurrency.symbol} = ${formatCurrencyAmount({
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                value: tryParseCurrencyAmount((displayValue?.value ?? displayValue.close).toString(), baseCurrency),
              })} 
            ${quoteCurrency.symbol}`}
            </ChartPriceText>
            <ChartPriceText color="neutral2">
              {/* the usd price is only calculated for the most recent data point so hide it when selecting a crosshair */}
              {price && !crosshairData
                ? '(' + convertFiatAmountFormatted(price.toSignificant(), NumberType.FiatTokenPrice) + ')'
                : ''}
            </ChartPriceText>
          </PriceDisplayContainer>
        )
        return (
          <ChartHeader
            value={priceDisplay}
            additionalFields={<PriceChartDelta startingPrice={data[0].close} endingPrice={displayValue.close} />}
            valueFormatterType={NumberType.FiatTokenPrice}
            time={crosshairData?.time}
          />
        )
      }}
    </Chart>
  )
}

function LiquidityChart({
  tokenA,
  tokenB,
  tokenAColor,
  tokenBColor,
  feeTier,
  isReversed,
  chainId,
  version,
  hooks,
  poolId,
}: {
  tokenA: Currency
  tokenB: Currency
  tokenAColor: string
  tokenBColor: string
  feeTier: FeeAmount
  isReversed: boolean
  chainId: UniverseChainId
  version: RestProtocolVersion
  hooks?: string
  poolId?: string
}) {
  const { t } = useTranslation()
  const tokenADescriptor = tokenA.symbol ?? tokenA.name ?? t('common.tokenA')
  const tokenBDescriptor = tokenB.symbol ?? tokenB.name ?? t('common.tokenB')

  const { data: poolData } = useGetPoolsByTokens(
    {
      fee: feeTier,
      chainId,
      protocolVersions: [version],
      token0: getTokenOrZeroAddress(tokenA),
      token1: getTokenOrZeroAddress(tokenB),
      hooks: hooks ?? ZERO_ADDRESS,
    },
    true,
  )

  const sdkCurrencies = useMemo(
    () => ({
      TOKEN0: tokenA,
      TOKEN1: tokenB,
    }),
    [tokenA, tokenB],
  )

  const { tickData, activeTick, loading } = useLiquidityBarData({
    sdkCurrencies,
    feeTier,
    isReversed,
    chainId,
    version,
    hooks,
    poolId,
    tickSpacing: poolData?.pools[0]?.tickSpacing,
  })

  const colors = useSporeColors()
  const params = useMemo(() => {
    return {
      data: tickData?.barData ?? [],
      tokenAColor,
      tokenBColor,
      highlightColor: colors.surface3.val,
      activeTick,
      activeTickProgress: tickData?.activeRangePercentage,
      hideTooltipBorder: true,
    }
  }, [activeTick, tokenAColor, tokenBColor, colors, tickData])

  if (loading) {
    return <LoadingChart />
  }

  return (
    <Chart
      height={PDP_CHART_HEIGHT_PX}
      Model={LiquidityBarChartModel}
      params={params}
      showDottedBackground
      TooltipBody={({ data: crosshairData }: { data: LiquidityBarData }) => (
        // TODO(WEB-3628): investigate potential off-by-one or subgraph issues causing calculated TVL issues on 1 bip pools
        // Also remove Error Boundary when its determined its not needed
        <ErrorBoundary fallback={() => null}>
          {tickData?.activeRangeData && (
            <TickTooltipContent
              baseCurrency={tokenB}
              quoteCurrency={tokenA}
              hoveredTick={crosshairData}
              currentTick={tickData.activeRangeData.tick}
              currentPrice={parseFloat(tickData.activeRangeData.price0)}
              showQuoteCurrencyFirst={false}
            />
          )}
        </ErrorBoundary>
      )}
    >
      {(crosshair) => {
        const displayPoint = crosshair ?? tickData?.activeRangeData
        const display = (
          <Flex gap="$spacing8" $md={{ gap: '$spacing4' }}>
            <Text variant="heading3" animation="125ms" enterStyle={{ opacity: 0 }}>
              {`1 ${tokenADescriptor} = ${displayPoint?.price0} ${tokenBDescriptor}`}
            </Text>
            <Text variant="heading3" animation="125ms" enterStyle={{ opacity: 0 }}>
              {`1 ${tokenBDescriptor} = ${displayPoint?.price1} ${tokenADescriptor}`}
            </Text>
            {displayPoint && displayPoint.tick === activeTick && (
              <Text
                variant="subheading2"
                color="$neutral2"
                animation="125ms"
                enterStyle={{ opacity: 0 }}
                $md={{ variant: 'body3' }}
              >
                <Trans i18nKey="pool.activeRange" />
              </Text>
            )}
          </Flex>
        )
        return <ChartHeader value={display} />
      }}
    </Chart>
  )
}
