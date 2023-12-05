import { ReactComponent as CandlestickChartIcon } from 'assets/svg/candlestick-chart-icon.svg'
import { ReactComponent as LineChartIcon } from 'assets/svg/line-chart-icon.svg'
import { PriceChartType } from 'components/Charts/utils'
import PillMultiToggle from 'components/Toggle/PillMultiToggle'

const ADVANCED_PRICE_CHART_OPTIONS = [
  { value: PriceChartType.LINE, display: <CandlestickChartIcon /> },
  { value: PriceChartType.CANDLESTICK, display: <LineChartIcon /> },
]

export const AdvancedPriceChartToggle = ({
  currentChartType,
  onChartTypeChange,
}: {
  currentChartType: PriceChartType
  onChartTypeChange: (c: PriceChartType) => void
}) => {
  return (
    <PillMultiToggle
      options={ADVANCED_PRICE_CHART_OPTIONS}
      currentSelected={currentChartType}
      onSelectOption={onChartTypeChange as (c: string) => void}
    />
  )
}
