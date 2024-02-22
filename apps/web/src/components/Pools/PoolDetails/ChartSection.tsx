import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart } from 'components/Charts/ChartModel'
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
import { useTokenPriceQuery } from 'graphql/data/__generated__/types-and-hooks'
import { TimePeriod, toContractInput, toHistoryDuration } from 'graphql/data/util'
import { Token } from 'graphql/thegraph/__generated__/types-and-hooks'
import { useCurrency } from 'hooks/Tokens'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import { useAtomValue } from 'jotai/utils'
import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const PDP_CHART_HEIGHT_PX = 356
const PDP_CHART_SELECTOR_OPTIONS = [ChartType.PRICE, ChartType.VOLUME, ChartType.LIQUIDITY] as const
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
  token0?: Token
  token1?: Token
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

  const [chartType, setChartType] = useState<PoolsDetailsChartType>(ChartType.PRICE)

  const refitChartContent = useAtomValue(refitChartContentAtom)

  const mockVolumes = useMemo(
    () => [...Array(20).keys()].map((i) => ({ value: Math.random() * 10e4 + 500, timestamp: 100123131 + i * 1000 })),
    // Mock data refresh on timePeriod change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timePeriod]
  )

  if (props.loading || !currencyA || !currencyB) {
    return <LoadingChart />
  }

  const SelectedChart = CHART_TYPE_COMPONENT_MAP[chartType]
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
      <ChartActionsContainer>
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
        <PDPChartTypeSelector chartType={chartType} onChartTypeChange={setChartType} />
      </ChartActionsContainer>
    </ChartContainer>
  )
}

interface SelectedChartProps extends ChartSectionProps {
  currencyA: Currency
  currencyB: Currency
  timePeriod: TimePeriod
  height: number
}

function PriceChart({ currencyA, currencyB, timePeriod, height }: SelectedChartProps) {
  const { formatCurrencyAmount, formatPrice } = useFormatter()
  // TODO(info): Update to use subgraph data
  const priceQuery = useTokenPriceQuery({
    variables: { ...toContractInput(currencyA), duration: toHistoryDuration(timePeriod) },
  })
  const prices = usePriceHistory(priceQuery.data)

  const mockedPrices = useMemo(() => mockCandlestickData(prices), [prices])
  const params = useMemo(() => ({ data: mockedPrices, type: PriceChartType.LINE }), [mockedPrices])

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
