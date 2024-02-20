import { QueryResult } from '@apollo/client'
import { Trans, t } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart } from 'components/Charts/ChartModel'
import { LiquidityBarChartModel, useLiquidityBarData } from 'components/Charts/LiquidityChart'
import { LiquidityBarData } from 'components/Charts/LiquidityChart/renderer'
import { PriceChartDelta, PriceChartModel, mockCandlestickData } from 'components/Charts/PriceChart'
import { refitChartContentAtom } from 'components/Charts/TimeSelector'
import { VolumeChart } from 'components/Charts/VolumeChart'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import PillMultiToggle from 'components/Toggle/PillMultiToggle'
import {
  ChartActionsContainer,
  ChartContainer,
  DEFAULT_PILL_TIME_SELECTOR_OPTIONS,
  usePriceHistory,
} from 'components/Tokens/TokenDetails/ChartSection'
import { ChartTypeDropdown } from 'components/Tokens/TokenDetails/ChartTypeSelectors/ChartTypeSelector'
import { LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import { DISPLAYS, TimePeriodDisplay, getTimePeriodFromDisplay } from 'components/Tokens/TokenTable/TimeSelector'
import {
  Chain,
  Exact,
  HistoryDuration,
  TokenHistoricalVolumesQuery,
  useTokenPriceQuery,
} from 'graphql/data/__generated__/types-and-hooks'
import { TimePeriod, toContractInput, toHistoryDuration } from 'graphql/data/util'
import { PoolData } from 'graphql/thegraph/PoolData'
import { useCurrency } from 'hooks/Tokens'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import { useAtomValue } from 'jotai/utils'
import { useMemo, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'
import { NumberType, useFormatter } from 'utils/formatNumbers'

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
}

const CHART_TYPE_COMPONENT_MAP: { [key in PoolsDetailsChartType]: React.FC<SelectedChartProps> } = {
  [ChartType.VOLUME]: VolumeChart,
  [ChartType.PRICE]: PriceChart,
  [ChartType.LIQUIDITY]: LiquidityChart,
}

export default function ChartSection(props: ChartSectionProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.DAY)
  const [currencyA, currencyB] = [useCurrency(props.poolData?.token0?.id), useCurrency(props.poolData?.token1?.id)]

  const [chartType, setChartType] = useState<PoolsDetailsChartType>(ChartType.VOLUME)

  const refitChartContent = useAtomValue(refitChartContentAtom)

  const mockVolumes = useMemo(
    () => [...Array(20).keys()].map((i) => ({ value: Math.random() * 10e4 + 500, timestamp: 100123131 + i * 1000 })),
    // Mock data refresh on timePeriod change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timePeriod]
  )
  const mockVolumeQueryResult = {
    data: { token: { market: { historicalVolume: mockVolumes } } },
    loading: false,
    error: undefined,
  } as any

  if (props.loading || !props.poolData || !currencyA || !currencyB) {
    return <LoadingChart />
  }

  const SelectedChart = CHART_TYPE_COMPONENT_MAP[chartType]
  const selectedChartProps = {
    ...props,
    feeTier: Number(props.poolData.feeTier),
    height: PDP_CHART_HEIGHT_PX,
    timePeriod,
    tokenA: currencyA.wrapped,
    tokenB: currencyB.wrapped,
    volumeQueryResult: mockVolumeQueryResult,
  }

  return (
    <ChartContainer isInfoTDPEnabled data-testid="pdp-chart-container">
      <SelectedChart {...selectedChartProps} />
      <ChartActionsContainer>
        <PDPChartTypeSelector chartType={chartType} onChartTypeChange={setChartType} />
        {chartType !== ChartType.LIQUIDITY && (
          <TimePeriodSelectorContainer>
            <PillMultiToggle
              options={DEFAULT_PILL_TIME_SELECTOR_OPTIONS}
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
    </ChartContainer>
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

interface SelectedChartProps extends ChartSectionProps {
  tokenA: Token
  tokenB: Token
  feeTier: FeeAmount
  timePeriod: TimePeriod
  height: number
  volumeQueryResult: QueryResult<
    TokenHistoricalVolumesQuery,
    Exact<{
      chain: Chain
      address?: string
      duration: HistoryDuration
    }>
  >
}

function PriceChart({ tokenA, tokenB, timePeriod }: SelectedChartProps) {
  const { formatCurrencyAmount, formatPrice } = useFormatter()
  // TODO(info): Update to use subgraph data
  const priceQuery = useTokenPriceQuery({
    variables: { ...toContractInput(tokenA), duration: toHistoryDuration(timePeriod) },
  })
  const prices = usePriceHistory(priceQuery.data)

  const mockedPrices = useMemo(() => mockCandlestickData(prices), [prices])
  const params = useMemo(() => ({ data: mockedPrices, type: PriceChartType.LINE }), [mockedPrices])

  const stablecoinPrice = useStablecoinPrice(tokenA)

  if (!mockedPrices.length || !tokenA || !tokenB) {
    return <LoadingChart />
  }

  const lastPrice = mockedPrices[mockedPrices.length - 1]
  return (
    <StyledChart Model={PriceChartModel} params={params}>
      {(crosshairData) => {
        const displayValue = crosshairData ?? lastPrice
        const currencyBAmountRaw = Math.floor((displayValue.value ?? displayValue.close) * 10 ** tokenB.decimals)
        const priceDisplay = (
          <PriceDisplayContainer>
            <ChartPriceText>
              {`1 ${tokenA.symbol} = ${formatCurrencyAmount({
                amount: CurrencyAmount.fromRawAmount(tokenB, currencyBAmountRaw),
              })} 
            ${tokenB.symbol}`}
            </ChartPriceText>
            <ChartPriceText color="neutral2">
              {stablecoinPrice ? '(' + formatPrice({ price: stablecoinPrice }) + ')' : ''}
            </ChartPriceText>
          </PriceDisplayContainer>
        )
        return (
          <ChartHeader
            value={priceDisplay}
            additionalFields={<PriceChartDelta startingPrice={mockedPrices[0]} endingPrice={displayValue} />}
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

export const ChartHoverTooltipWrapper = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.surface1};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.surface3};
  padding: 8px;
`

function LiquidityTooltipDisplay({
  data,
  tokenADescriptor,
  tokenBDescriptor,
  format: { formatNumber },
  currentTick,
}: {
  data: LiquidityBarData
  tokenADescriptor: string
  tokenBDescriptor: string
  /* This tooltip will be rendered in a different Root without access to top level providers: formatter must be passed in. */
  format: ReturnType<typeof useFormatter>
  currentTick?: number
}) {
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
    <ChartHoverTooltipWrapper>
      <ThemedText.BodySmall>{t`${tokenADescriptor} locked: ${displayValue0}`}</ThemedText.BodySmall>
      <ThemedText.BodySmall>{t`${tokenBDescriptor} locked: ${displayValue1}`}</ThemedText.BodySmall>
    </ChartHoverTooltipWrapper>
  )
}

function LiquidityChart({ tokenA, tokenB, feeTier, isReversed }: SelectedChartProps) {
  const format = useFormatter()
  const tokenADescriptor = tokenA.symbol ?? tokenA.name ?? t`Token A`
  const tokenBDescriptor = tokenB.symbol ?? tokenB.name ?? t`Token B`

  const { tickData, activeTick, loading } = useLiquidityBarData({
    tokenA,
    tokenB,
    feeTier,
    isReversed,
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
      TooltipBody: ({ data }: { data: LiquidityBarData }) => (
        <LiquidityTooltipDisplay
          data={data}
          format={format}
          tokenADescriptor={tokenADescriptor}
          tokenBDescriptor={tokenBDescriptor}
          currentTick={tickData?.activeRangeData?.tick}
        />
      ),
      // TODO(WEB-3628): investigate potential off-by-one or subgraph issues causing calculated TVL issues on 1 bip pools
      showTooltip: feeTier !== FeeAmount.LOWEST,
    }
  }, [activeTick, feeTier, format, isReversed, theme, tickData, tokenADescriptor, tokenBDescriptor])

  if (loading) return <LoadingChart />

  return (
    <StyledChart Model={LiquidityBarChartModel} params={params}>
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
