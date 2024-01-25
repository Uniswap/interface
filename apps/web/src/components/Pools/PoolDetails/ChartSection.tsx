import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart } from 'components/Charts/ChartModel'
import { mockCandlestickData, PriceChartDelta, PriceChartModel } from 'components/Charts/PriceChart'
import TimePeriodSelector from 'components/Charts/TimeSelector'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import { VolumeChart } from 'components/Charts/VolumeChart'
import { ChartContainer, usePriceHistory } from 'components/Tokens/TokenDetails/ChartSection'
import { LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import { useTokenPriceQuery } from 'graphql/data/__generated__/types-and-hooks'
import { TimePeriod, toContractInput, toHistoryDuration } from 'graphql/data/util'
import { Token } from 'graphql/thegraph/__generated__/types-and-hooks'
import { useCurrency } from 'hooks/Tokens'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const PDP_CHART_HEIGHT_PX = 380
export const PDP_CHART_SELECTOR_OPTIONS = [ChartType.PRICE, ChartType.VOLUME, ChartType.LIQUIDITY] as const
export type PoolsDetailsChartType = (typeof PDP_CHART_SELECTOR_OPTIONS)[number]

const TimePeriodSelectorContainer = styled.div`
  position: absolute;
  top: 4px;
  right: 72px;
  z-index: ${Z_INDEX.active};
  @media only screen and (max-width: ${({ theme }) => theme.breakpoint.lg}px) {
    position: static;
    margin-top: 4px;
  }
  @media only screen and (max-width: ${({ theme }) => theme.breakpoint.xs}px) {
    width: 100%;
  }
`

interface ChartSectionProps {
  token0?: Token
  token1?: Token
  chartType: PoolsDetailsChartType
  priceChartType: PriceChartType
  feeTier?: number
  loading: boolean
}

const CHART_TYPE_COMPONENT_MAP: { [key in PoolsDetailsChartType]: React.FC<SelectedChartProps> } = {
  [ChartType.PRICE]: PriceChart,
  [ChartType.VOLUME]: VolumeChart,
  [ChartType.LIQUIDITY]: LoadingChart,
}

export default function ChartSection(props: ChartSectionProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.DAY)
  const [currencyA, currencyB] = [useCurrency(props.token0?.id), useCurrency(props.token1?.id)]

  const mockVolumes = useMemo(
    () => [...Array(20).keys()].map((i) => ({ value: Math.random() * 10e4 + 500, timestamp: 100123131 + i * 1000 })),
    // Mock data refresh on timePeriod change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timePeriod]
  )

  if (props.loading || !currencyA || !currencyB) {
    return <LoadingChart />
  }

  const SelectedChart = CHART_TYPE_COMPONENT_MAP[props.chartType]
  const selectedChartProps = {
    ...props,
    height: PDP_CHART_HEIGHT_PX,
    timePeriod,
    currencyA,
    currencyB,
    volumes: mockVolumes,
  }

  return (
    <ChartContainer isInfoTDPEnabled data-testid="pdp-chart-container">
      <SelectedChart {...selectedChartProps} />
      <TimePeriodSelectorContainer>
        <TimePeriodSelector timePeriod={timePeriod} onChangeTimePeriod={setTimePeriod} />
      </TimePeriodSelectorContainer>
    </ChartContainer>
  )
}

interface SelectedChartProps extends ChartSectionProps {
  currencyA: Currency
  currencyB: Currency
  timePeriod: TimePeriod
  height: number
}

function PriceChart({ currencyA, currencyB, timePeriod, height, priceChartType }: SelectedChartProps) {
  const { formatCurrencyAmount, formatPrice } = useFormatter()
  // TODO(info): Update to use subgraph data
  const priceQuery = useTokenPriceQuery({
    variables: { ...toContractInput(currencyA), duration: toHistoryDuration(timePeriod) },
  })
  const prices = usePriceHistory(priceQuery.data)

  const mockedPrices = useMemo(() => mockCandlestickData(prices), [prices])
  const params = useMemo(() => ({ data: mockedPrices, type: priceChartType }), [mockedPrices, priceChartType])

  const stablecoinPrice = useStablecoinPrice(currencyA)

  if (!mockedPrices.length || !currencyA || !currencyB) {
    return <LoadingChart />
  }

  const lastPrice = mockedPrices[mockedPrices.length - 1]
  return (
    <Chart Model={PriceChartModel} params={params} height={height}>
      {(crosshairData) => {
        const displayValue = crosshairData ?? lastPrice
        const currencyBAmountRaw = Math.floor((displayValue.value ?? displayValue.close) * 10 ** currencyB.decimals)
        const priceDisplay = (
          <ThemedText.HeadlineMedium>
            {`1 ${currencyA.symbol} = ${formatCurrencyAmount({
              amount: CurrencyAmount.fromRawAmount(currencyB, currencyBAmountRaw),
            })} 
            ${currencyB.symbol} ${stablecoinPrice ? '(' + formatPrice({ price: stablecoinPrice }) + ')' : ''}`}
          </ThemedText.HeadlineMedium>
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
    </Chart>
  )
}
