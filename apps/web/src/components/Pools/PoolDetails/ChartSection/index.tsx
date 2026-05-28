/* eslint-disable import/no-unused-modules */
import {
  // ProtocolVersion as ProtocolVersionInt,
  ProtocolVersion as RestProtocolVersion,
} from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, NativeCurrency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { PoolData } from 'appGraphql/data/pools/usePoolData'
import { RingChartTimePeriod, gqlToCurrency, toRingHistoryDuration, unwrapFewToken } from 'appGraphql/data/util'
import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart, refitChartContentAtom } from 'components/Charts/ChartModel'
import { LiquidityBarChartModel, useLiquidityBarData } from 'components/Charts/LiquidityChart'
import { LiquidityBarData } from 'components/Charts/LiquidityChart/renderer'
import { ChartSkeleton } from 'components/Charts/LoadingState'
import { PriceChartData, PriceChartDelta, PriceChartModel } from 'components/Charts/PriceChart'
import { VolumeChart } from 'components/Charts/VolumeChart'
import { SingleHistogramData } from 'components/Charts/VolumeChart/renderer'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import ErrorBoundary from 'components/ErrorBoundary'
import { parseProtocolVersion } from 'components/Liquidity/utils'
import { useRingPDPPriceChartData, useRingPDPVolumeChartData } from 'components/Pools/PoolDetails/ChartSection/hooks'
import {
  ChartActionsContainer,
  DEFAULT_CHART_PILL_TIME_SELECTOR_OPTIONS,
} from 'components/Tokens/TokenDetails/ChartSection'
import { ChartTypeDropdown } from 'components/Tokens/TokenDetails/ChartSection/ChartTypeSelector'
import { ChartQueryResult, DataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import {
  DISPLAYS,
  RING_CHART_DISPLAYS,
  RingChartTimePeriodDisplay,
  getRingTimePeriodFromDisplay,
} from 'components/Tokens/TokenTable/VolumeTimeFrameSelector'
import { PDPRingChartQueryVars } from 'hooks/usePoolPriceChartData'
import { useAtomValue } from 'jotai/utils'
import styled, { useTheme } from 'lib/styled-components'
import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { EllipsisStyle } from 'theme/components/styles'
import { textFadeIn } from 'theme/styles'
import { Flex, SegmentedControl, useMedia } from 'ui/src'
import { Token as RingToken } from 'uniswap/src/data/graphql/ringswap-data-api/__generated__/types-and-hooks'
import { Chain, ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const PDP_CHART_HEIGHT_PX = 356
const PDP_CHART_SELECTOR_OPTIONS = [ChartType.VOLUME, ChartType.PRICE, ChartType.LIQUIDITY] as const
export type PoolsDetailsChartType = (typeof PDP_CHART_SELECTOR_OPTIONS)[number]

const ChartTypeSelectorContainer = styled.div`
  display: flex;
  gap: 8px;

  @media only screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    width: 100%;
  }
`

const PDPChartTypeSelector = ({
  chartType,
  onChartTypeChange,
  disabledOption,
}: {
  chartType: PoolsDetailsChartType
  onChartTypeChange: (c: PoolsDetailsChartType) => void
  disabledOption?: PoolsDetailsChartType
}) => (
  <ChartTypeSelectorContainer>
    <ChartTypeDropdown
      options={PDP_CHART_SELECTOR_OPTIONS}
      currentChartType={chartType}
      onSelectOption={onChartTypeChange}
      disabledOption={disabledOption}
    />
  </ChartTypeSelectorContainer>
)

interface ChartSectionProps {
  poolData?: PoolData
  loading: boolean
  isReversed: boolean
  chain?: Chain
}

/** Represents a variety of query result shapes, discriminated via additional `chartType` field. */
type ActiveQuery =
  | ChartQueryResult<PriceChartData, ChartType.PRICE>
  | ChartQueryResult<SingleHistogramData, ChartType.VOLUME>
  | ChartQueryResult<undefined, ChartType.LIQUIDITY>

// type TDPChartState = {
//   timePeriod: TimePeriod
//   setTimePeriod: (timePeriod: TimePeriod) => void
//   setChartType: (chartType: PoolsDetailsChartType) => void
//   activeQuery: ActiveQuery
//   dataQuality?: DataQuality
// }

type RingTDPChartState = {
  timePeriod: RingChartTimePeriod
  setTimePeriod: (timePeriod: RingChartTimePeriod) => void
  setChartType: (chartType: PoolsDetailsChartType) => void
  activeQuery: ActiveQuery
  dataQuality?: DataQuality
}

function usePDPChartState(
  poolData: PoolData | undefined,
  tokenA: RingToken,
  tokenB: RingToken,
  isReversed: boolean,
  chain: Chain,
  protocolVersion: ProtocolVersion,
): RingTDPChartState {
  const [timePeriod, setTimePeriod] = useState<RingChartTimePeriod>(RingChartTimePeriod.WEEK)
  const [chartType, setChartType] = useState<PoolsDetailsChartType>(ChartType.VOLUME)

  const isV2 = protocolVersion === ProtocolVersion.V2 || protocolVersion === ProtocolVersion.Fewv2
  const isV3 = protocolVersion === ProtocolVersion.V3
  const isV4 = protocolVersion === ProtocolVersion.V4
  const variables = {
    addressOrId: poolData?.idOrAddress ?? '',
    chain,
    duration: toRingHistoryDuration(timePeriod),
    isV4,
    isV3,
    isV2,
  }

  // let protocolStr = ProtocolVersionInt.UNSPECIFIED
  // if (protocolVersion === ProtocolVersion.Fewv2) {
  //   protocolStr = ProtocolVersionInt.Fewv2
  // } else if (protocolVersion === ProtocolVersion.V3) {
  //   protocolStr = ProtocolVersionInt.V3
  // } else if (protocolVersion === ProtocolVersion.V4) {
  //   protocolStr = ProtocolVersionInt.V4
  // } else if (protocolVersion === ProtocolVersion.V2) {
  //   protocolStr = ProtocolVersionInt.V2
  // } else {
  //   protocolStr = ProtocolVersionInt.UNSPECIFIED
  // }
  // const priceQuery = usePDPPriceChartData(variables, poolData, isReversed ? tokenB : tokenA, protocolStr)
  // const volumeQuery = usePDPVolumeChartData(variables)
  const priceQuery = useRingPDPPriceChartData(
    variables as unknown as PDPRingChartQueryVars,
    isReversed ? tokenB?.address ?? '' : tokenA?.address ?? '',
  )
  const volumeQuery = useRingPDPVolumeChartData(variables as unknown as PDPRingChartQueryVars)

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
  const isV4Protocol = props.poolData?.protocolVersion === ProtocolVersion.V4

  const [currencyA, currencyB] = [
    props.poolData?.token0 && gqlToCurrency(props.poolData.token0),
    props.poolData?.token1 && gqlToCurrency(props.poolData.token1),
  ]

  const { setChartType, timePeriod, setTimePeriod, activeQuery } = usePDPChartState(
    props.poolData,
    (props.poolData?.token0 ?? currencyA) as unknown as RingToken,
    (props.poolData?.token1 ?? currencyB) as unknown as RingToken,
    props.isReversed,
    props.chain ?? Chain.Ethereum,
    props.poolData?.protocolVersion ?? ProtocolVersion.V3,
  )

  const refitChartContent = useAtomValue(refitChartContentAtom)

  // TODO(WEB-3740): Integrate BE tick query, remove special casing for liquidity chart
  const loading = props.loading || (activeQuery.chartType !== ChartType.LIQUIDITY ? activeQuery?.loading : false)

  // eslint-disable-next-line consistent-return
  const ChartBody = (() => {
    if (!currencyA || !currencyB || !props.poolData || !props.chain) {
      return <ChartSkeleton type={activeQuery.chartType} height={PDP_CHART_HEIGHT_PX} />
    }

    const selectedChartProps = {
      ...props,
      feeTier: Number(props.poolData.feeTier),
      height: PDP_CHART_HEIGHT_PX,
      timePeriod,
      tokenA: props.poolData?.token0 as any,
      tokenB: props.poolData?.token1 as any,
      chainId: fromGraphQLChain(props.chain) ?? defaultChainId,
      poolId: props.poolData.idOrAddress,
      hooks: props.poolData.hookAddress,
      version: parseProtocolVersion(props.poolData.protocolVersion) ?? RestProtocolVersion.V3,
      tickSpacing: props.poolData.tickSpacing,
    }

    // TODO(WEB-3740): Integrate BE tick query, remove special casing for liquidity chart
    // Pass currencyA/B to LiquidityChart to avoid wrapping native tokens for v4 pools
    if (activeQuery.chartType === ChartType.LIQUIDITY) {
      return <LiquidityChart {...selectedChartProps} currencyA={currencyA} currencyB={currencyB} />
    }
    if (activeQuery.dataQuality === DataQuality.INVALID || !currencyA || !currencyB) {
      const errorText = loading ? undefined : <Trans i18nKey="chart.error.pools" />
      return <ChartSkeleton type={activeQuery.chartType} height={PDP_CHART_HEIGHT_PX} errorText={errorText} />
    }

    const stale = activeQuery.dataQuality === DataQuality.STALE

    switch (activeQuery.chartType) {
      case ChartType.PRICE:
        return <PriceChart {...selectedChartProps} data={activeQuery.entries} stale={stale} />
      case ChartType.VOLUME:
        return <VolumeChart {...selectedChartProps} data={activeQuery.entries} stale={stale} />
    }
  })()

  // BE does not support hourly price data for pools
  const filteredTimeOptions = useMemo(() => {
    if (activeQuery.chartType === ChartType.PRICE) {
      const filtered = DEFAULT_CHART_PILL_TIME_SELECTOR_OPTIONS
      return {
        options: filtered,
        selected: RING_CHART_DISPLAYS[timePeriod],
      }
    }
    return {
      options: DEFAULT_CHART_PILL_TIME_SELECTOR_OPTIONS,
      selected: DISPLAYS[timePeriod],
    }
  }, [activeQuery.chartType, timePeriod])

  const disabledChartOption =
    props.poolData?.protocolVersion === ProtocolVersion.V2 ||
    props.poolData?.protocolVersion === ProtocolVersion.Fewv2 ||
    isV4Protocol
      ? ChartType.LIQUIDITY
      : undefined

  return (
    <Flex data-testid="pdp-chart-container">
      {ChartBody}
      <ChartActionsContainer>
        <PDPChartTypeSelector
          chartType={activeQuery.chartType}
          onChartTypeChange={setChartType}
          disabledOption={disabledChartOption}
        />
        {activeQuery.chartType !== ChartType.LIQUIDITY && (
          <Flex $md={{ width: '100%' }}>
            <SegmentedControl
              fullWidth={media.md}
              options={filteredTimeOptions.options}
              selectedOption={filteredTimeOptions.selected}
              onSelectOption={(option) => {
                const time = getRingTimePeriodFromDisplay(option as RingChartTimePeriodDisplay)
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

const PriceDisplayContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  column-gap: 4px;
`

const ChartPriceText = styled(ThemedText.HeadlineMedium)`
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
  chainId,
}: {
  tokenA: RingToken | NativeCurrency
  tokenB: RingToken | NativeCurrency
  isReversed: boolean
  data: PriceChartData[]
  stale: boolean
  chainId: UniverseChainId
}) {
  const { formatCurrencyAmount, formatPrice } = useFormatter()
  const [primaryToken, referenceToken] = isReversed ? [tokenB, tokenA] : [tokenA, tokenB]
  const unwrapReferenceToken = unwrapFewToken(chainId, referenceToken)
  const unwrapPrimaryToken = unwrapFewToken(chainId, primaryToken)
  const params = useMemo(() => ({ data, stale, type: PriceChartType.LINE }), [data, stale])

  const { price } = useUSDCPrice(referenceToken as Currency)

  const lastPrice = data[data.length - 1]
  return (
    <Chart height={PDP_CHART_HEIGHT_PX} Model={PriceChartModel} params={params}>
      {(crosshairData) => {
        const displayValue = crosshairData ?? lastPrice
        const currencyBAmountRaw = Math.floor(
          (displayValue.value ?? displayValue.close) * 10 ** referenceToken.decimals,
        )
        const priceDisplay = (
          <PriceDisplayContainer>
            <ChartPriceText>
              {`1 ${unwrapReferenceToken?.symbol} = ${formatCurrencyAmount({
                amount: CurrencyAmount.fromRawAmount(referenceToken as Currency, currencyBAmountRaw),
              })} 
            ${unwrapPrimaryToken?.symbol}`}
            </ChartPriceText>
            <ChartPriceText color="neutral2">{price ? '(' + formatPrice({ price }) + ')' : ''}</ChartPriceText>
          </PriceDisplayContainer>
        )
        return (
          <ChartHeader
            value={priceDisplay}
            additionalFields={<PriceChartDelta startingPrice={data[0]} endingPrice={displayValue} />}
            valueFormatterType={NumberType.FiatTokenPrice}
            time={crosshairData?.time}
          />
        )
      }}
    </Chart>
  )
}

const FadeInHeading = styled(ThemedText.H1Medium)`
  ${textFadeIn};
  line-height: 32px;
`
const FadeInSubheader = styled(ThemedText.SubHeader)`
  ${textFadeIn}
`

function LiquidityTooltipDisplay({
  data,
  tokenADescriptor,
  tokenBDescriptor,
  currentTick,
}: {
  data: LiquidityBarData
  tokenADescriptor: string
  tokenBDescriptor: string
  currentTick?: number
}) {
  const { t } = useTranslation()
  const { formatNumber } = useFormatter()
  if (!currentTick) {
    return null
  }

  const displayValue0 =
    data.tick >= currentTick
      ? formatNumber({
          input: data.amount0Locked,
          type: NumberType.TokenQuantityStats,
        })
      : 0
  const displayValue1 =
    data.tick <= currentTick
      ? formatNumber({
          input: data.amount1Locked,
          type: NumberType.TokenQuantityStats,
        })
      : 0

  return (
    <>
      <ThemedText.BodySmall>
        {t('liquidityPool.chart.tooltip.amount', { token: tokenADescriptor, amount: displayValue0 })}
      </ThemedText.BodySmall>
      <ThemedText.BodySmall>
        {t('liquidityPool.chart.tooltip.amount', { token: tokenBDescriptor, amount: displayValue1 })}
      </ThemedText.BodySmall>
    </>
  )
}

function LiquidityChart({
  currencyA,
  currencyB,
  feeTier,
  isReversed,
  chainId,
  version,
  tickSpacing,
  hooks,
  poolId,
}: {
  currencyA: Currency
  currencyB: Currency
  feeTier: FeeAmount
  isReversed: boolean
  chainId: UniverseChainId
  version: RestProtocolVersion
  tickSpacing?: number
  hooks?: string
  poolId?: string
}) {
  const { t } = useTranslation()
  const tokenADescriptor = currencyA.symbol ?? currencyA.name ?? t('common.tokenA')
  const tokenBDescriptor = currencyB.symbol ?? currencyB.name ?? t('common.tokenB')

  const { tickData, activeTick, loading } = useLiquidityBarData({
    currencyA,
    currencyB,
    feeTier,
    isReversed,
    chainId,
    version,
    tickSpacing,
    hooks,
    poolId,
  })

  const theme = useTheme()
  const params = useMemo(() => {
    return {
      data: tickData?.barData ?? [],
      tokenAColor: isReversed ? theme.token1 : theme.token0,
      tokenBColor: isReversed ? theme.token0 : theme.token1,
      highlightColor: theme.surface3,
      activeTick,
      activeTickProgress: tickData?.activeRangePercentage,
    }
  }, [activeTick, isReversed, theme, tickData])

  if (loading) {
    return <LoadingChart />
  }

  return (
    <Chart
      height={PDP_CHART_HEIGHT_PX}
      Model={LiquidityBarChartModel}
      params={params}
      TooltipBody={({ data }: { data: LiquidityBarData }) => (
        // TODO(WEB-3628): investigate potential off-by-one or subgraph issues causing calculated TVL issues on 1 bip pools
        // Also remove Error Boundary when its determined its not needed
        <ErrorBoundary fallback={() => null}>
          <LiquidityTooltipDisplay
            data={data}
            tokenADescriptor={tokenADescriptor}
            tokenBDescriptor={tokenBDescriptor}
            currentTick={tickData?.activeRangeData?.tick}
          />
        </ErrorBoundary>
      )}
    >
      {(crosshair) => {
        const displayPoint = crosshair ?? tickData?.activeRangeData
        const display = (
          <>
            <FadeInHeading>{`1 ${tokenADescriptor} = ${displayPoint?.price0} ${tokenBDescriptor}`}</FadeInHeading>
            <FadeInHeading>{`1 ${tokenBDescriptor} = ${displayPoint?.price1} ${tokenADescriptor}`}</FadeInHeading>
            {displayPoint && displayPoint.tick === activeTick && (
              <FadeInSubheader color="neutral2" paddingTop="4px">
                <Trans i18nKey="pool.activeRange" />
              </FadeInSubheader>
            )}
          </>
        )
        return <ChartHeader value={display} />
      }}
    </Chart>
  )
}
