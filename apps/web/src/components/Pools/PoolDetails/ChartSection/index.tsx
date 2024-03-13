import { Trans, t } from '@lingui/macro'
import { ChainId, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart } from 'components/Charts/ChartModel'
import { LiquidityBarChartModel, useLiquidityBarData } from 'components/Charts/LiquidityChart'
import { LiquidityBarData } from 'components/Charts/LiquidityChart/renderer'
import { ChartSkeleton } from 'components/Charts/LoadingState'
import { PriceChartData, PriceChartDelta, PriceChartModel } from 'components/Charts/PriceChart'
import { refitChartContentAtom } from 'components/Charts/TimeSelector'
import { VolumeChart } from 'components/Charts/VolumeChart'
import { SingleHistogramData } from 'components/Charts/VolumeChart/renderer'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import PillMultiToggle from 'components/Toggle/PillMultiToggle'
import { ChartActionsContainer, DEFAULT_PILL_TIME_SELECTOR_OPTIONS } from 'components/Tokens/TokenDetails/ChartSection'
import { ChartTypeDropdown } from 'components/Tokens/TokenDetails/ChartSection/ChartTypeSelector'
import { ChartQueryResult, DataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import { DISPLAYS, TimePeriodDisplay, getTimePeriodFromDisplay } from 'components/Tokens/TokenTable/TimeSelector'
import { Chain, ProtocolVersion } from 'graphql/data/__generated__/types-and-hooks'
import { PoolData } from 'graphql/data/pools/usePoolData'
import { TimePeriod, gqlToCurrency, supportedChainIdFromGQLChain, toHistoryDuration } from 'graphql/data/util'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import { useAtomValue } from 'jotai/utils'
import { useMemo, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { usePDPPriceChartData, usePDPVolumeChartData } from './hooks'

const PDP_CHART_HEIGHT_PX = 356
const PDP_CHART_SELECTOR_OPTIONS = [ChartType.VOLUME, ChartType.PRICE, ChartType.LIQUIDITY] as const
export type PoolsDetailsChartType = (typeof PDP_CHART_SELECTOR_OPTIONS)[number]

const TimePeriodSelectorContainer = styled.div`
  @media only screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    width: 100%;
  }
`
const ChartTypeSelectorContainer = styled.div`
  display: flex;
  gap: 8px;

  @media only screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    width: 100%;
  }
`

const StyledChart: typeof Chart = styled(Chart)`
  height: ${PDP_CHART_HEIGHT_PX}px;
`

const PDPChartTypeSelector = ({
  chartType,
  onChartTypeChange,
}: {
  chartType: PoolsDetailsChartType
  onChartTypeChange: (c: PoolsDetailsChartType) => void
}) => (
  <ChartTypeSelectorContainer>
    <ChartTypeDropdown
      options={PDP_CHART_SELECTOR_OPTIONS}
      currentChartType={chartType}
      onSelectOption={onChartTypeChange}
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

type TDPChartState = {
  timePeriod: TimePeriod
  setTimePeriod: (timePeriod: TimePeriod) => void
  setChartType: (chartType: PoolsDetailsChartType) => void
  activeQuery: ActiveQuery
  dataQuality?: DataQuality
}

function usePDPChartState(
  poolData: PoolData | undefined,
  tokenA: Token | undefined,
  tokenB: Token | undefined,
  isReversed: boolean,
  chain: Chain,
  protocolVersion: ProtocolVersion
): TDPChartState {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.DAY)
  const [chartType, setChartType] = useState<PoolsDetailsChartType>(ChartType.VOLUME)

  const isV3 = protocolVersion === ProtocolVersion.V3
  const variables = { address: poolData?.address ?? '', chain, duration: toHistoryDuration(timePeriod), isV3 }

  const priceQuery = usePDPPriceChartData(variables, poolData, tokenA, tokenB, isReversed)
  const volumeQuery = usePDPVolumeChartData(variables)

  return useMemo(() => {
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
  const [currencyA, currencyB] = [
    props.poolData?.token0 && gqlToCurrency(props.poolData.token0),
    props.poolData?.token1 && gqlToCurrency(props.poolData.token1),
  ]

  const { setChartType, timePeriod, setTimePeriod, activeQuery } = usePDPChartState(
    props.poolData,
    currencyA?.wrapped,
    currencyB?.wrapped,
    props.isReversed,
    props.chain ?? Chain.Ethereum,
    props.poolData?.protocolVersion ?? ProtocolVersion.V3
  )

  const refitChartContent = useAtomValue(refitChartContentAtom)

  // TODO(WEB-3740): Integrate BE tick query, remove special casing for liquidity chart
  const loading = props.loading || (activeQuery.chartType !== ChartType.LIQUIDITY ? activeQuery?.loading : false)

  const ChartBody = (() => {
    if (!currencyA || !currencyB || !props.poolData || !props.chain) {
      return <ChartSkeleton type={activeQuery.chartType} height={PDP_CHART_HEIGHT_PX} />
    }

    const selectedChartProps = {
      ...props,
      feeTier: Number(props.poolData.feeTier),
      height: PDP_CHART_HEIGHT_PX,
      timePeriod,
      tokenA: currencyA.wrapped,
      tokenB: currencyB.wrapped,
      chainId: supportedChainIdFromGQLChain(props.chain) ?? ChainId.MAINNET,
    }

    // TODO(WEB-3740): Integrate BE tick query, remove special casing for liquidity chart
    if (activeQuery.chartType === ChartType.LIQUIDITY) {
      return <LiquidityChart {...selectedChartProps} />
    }
    if (activeQuery.dataQuality === DataQuality.INVALID || !currencyA || !currencyB) {
      const errorText = loading ? undefined : <Trans>Unable to display historical data for the current pool.</Trans>
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
      return DEFAULT_PILL_TIME_SELECTOR_OPTIONS.filter((option) => option.value !== TimePeriodDisplay.HOUR)
    }
    return DEFAULT_PILL_TIME_SELECTOR_OPTIONS
  }, [activeQuery.chartType])

  return (
    <div data-testid="pdp-chart-container">
      {ChartBody}
      <ChartActionsContainer>
        <PDPChartTypeSelector chartType={activeQuery.chartType} onChartTypeChange={setChartType} />
        {activeQuery.chartType !== ChartType.LIQUIDITY && (
          <TimePeriodSelectorContainer>
            <PillMultiToggle
              options={filteredTimeOptions}
              currentSelected={DISPLAYS[timePeriod]}
              onSelectOption={(option) => {
                const time = getTimePeriodFromDisplay(option as TimePeriodDisplay)
                if (time === timePeriod) {
                  refitChartContent?.()
                } else {
                  setTimePeriod(time)
                }
              }}
            />
          </TimePeriodSelectorContainer>
        )}
      </ChartActionsContainer>
    </div>
  )
}

const PriceDisplayContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  column-gap: 4px;
`

const ChartPriceText = styled(ThemedText.HeadlineMedium)`
  ${EllipsisStyle}
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
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
}: {
  tokenA: Token
  tokenB: Token
  isReversed: boolean
  data: PriceChartData[]
  stale: boolean
}) {
  const { formatCurrencyAmount, formatPrice } = useFormatter()
  const [primaryToken, referenceToken] = isReversed ? [tokenB, tokenA] : [tokenA, tokenB]

  const params = useMemo(() => ({ data, stale, type: PriceChartType.LINE }), [data, stale])

  const stablecoinPrice = useStablecoinPrice(primaryToken)

  const lastPrice = data[data.length - 1]
  return (
    <StyledChart Model={PriceChartModel} params={params}>
      {(crosshairData) => {
        const displayValue = crosshairData ?? lastPrice
        const currencyBAmountRaw = Math.floor(
          (displayValue.value ?? displayValue.close) * 10 ** referenceToken.decimals
        )
        const priceDisplay = (
          <PriceDisplayContainer>
            <ChartPriceText>
              {`1 ${primaryToken.symbol} = ${formatCurrencyAmount({
                amount: CurrencyAmount.fromRawAmount(referenceToken, currencyBAmountRaw),
              })} 
            ${referenceToken.symbol}`}
            </ChartPriceText>
            <ChartPriceText color="neutral2">
              {stablecoinPrice ? '(' + formatPrice({ price: stablecoinPrice }) + ')' : ''}
            </ChartPriceText>
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
    </StyledChart>
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
  const { formatNumber } = useFormatter()
  if (!currentTick) return null

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
      <ThemedText.BodySmall>{t`${tokenADescriptor} liquidity: ${displayValue0}`}</ThemedText.BodySmall>
      <ThemedText.BodySmall>{t`${tokenBDescriptor} liquidity: ${displayValue1}`}</ThemedText.BodySmall>
    </>
  )
}

function LiquidityChart({
  tokenA,
  tokenB,
  feeTier,
  isReversed,
  chainId,
}: {
  tokenA: Token
  tokenB: Token
  feeTier: FeeAmount
  isReversed: boolean
  chainId: ChainId
}) {
  const tokenADescriptor = tokenA.symbol ?? tokenA.name ?? t`Token A`
  const tokenBDescriptor = tokenB.symbol ?? tokenB.name ?? t`Token B`

  const { tickData, activeTick, loading } = useLiquidityBarData({
    tokenA,
    tokenB,
    feeTier,
    isReversed,
    chainId,
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

  if (loading) return <LoadingChart />

  return (
    <StyledChart
      Model={LiquidityBarChartModel}
      params={params}
      TooltipBody={
        // TODO(WEB-3628): investigate potential off-by-one or subgraph issues causing calculated TVL issues on 1 bip pools
        feeTier !== FeeAmount.LOWEST
          ? ({ data }: { data: LiquidityBarData }) => (
              <LiquidityTooltipDisplay
                data={data}
                tokenADescriptor={tokenADescriptor}
                tokenBDescriptor={tokenBDescriptor}
                currentTick={tickData?.activeRangeData?.tick}
              />
            )
          : undefined
      }
    >
      {(crosshair) => {
        const displayPoint = crosshair ?? tickData?.activeRangeData
        const display = (
          <div>
            <FadeInHeading>{`1 ${tokenADescriptor} = ${displayPoint?.price0} ${tokenBDescriptor}`}</FadeInHeading>
            <FadeInHeading>{`1 ${tokenBDescriptor} = ${displayPoint?.price1} ${tokenADescriptor}`}</FadeInHeading>
            {displayPoint && displayPoint.tick === activeTick && (
              <FadeInSubheader color="neutral2" paddingTop="4px">
                <Trans>Active tick range</Trans>
              </FadeInSubheader>
            )}
          </div>
        )
        return <ChartHeader value={display} />
      }}
    </StyledChart>
  )
}
