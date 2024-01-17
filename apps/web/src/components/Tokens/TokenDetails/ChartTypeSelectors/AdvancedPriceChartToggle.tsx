import { ReactComponent as CandlestickChartIcon } from 'assets/svg/candlestick-chart-icon.svg'
import { ReactComponent as LineChartIcon } from 'assets/svg/line-chart-icon.svg'
import { PriceChartType } from 'components/Charts/utils'
import PillMultiToggle from 'components/Toggle/PillMultiToggle'
import { useTheme } from 'styled-components'
import { FadePresence } from 'theme/components/FadePresence'

const ADVANCED_PRICE_CHART_OPTIONS = [
  { value: PriceChartType.LINE, display: <LineChartIcon /> },
  { value: PriceChartType.CANDLESTICK, display: <CandlestickChartIcon /> },
]

export const AdvancedPriceChartToggle = ({
  currentChartType,
  onChartTypeChange,
}: {
  currentChartType: PriceChartType
  onChartTypeChange: (c: PriceChartType) => void
}) => {
  const theme = useTheme()
  return (
    <FadePresence $transitionDuration={theme.transition.duration.fast}>
      <PillMultiToggle
        options={ADVANCED_PRICE_CHART_OPTIONS}
        currentSelected={currentChartType}
        onSelectOption={onChartTypeChange as (c: string) => void}
      />
    </FadePresence>
  )
}
