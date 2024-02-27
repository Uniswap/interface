import { t } from '@lingui/macro'
import { ReactComponent as CandlestickChartIcon } from 'assets/svg/candlestick-chart-icon.svg'
import { ReactComponent as LineChartIcon } from 'assets/svg/line-chart-icon.svg'
import { CHART_TYPE_LABELS, PriceChartType } from 'components/Charts/utils'
import Row from 'components/Row'
import { useScreenSize } from 'hooks/useScreenSize'
import styled from 'styled-components'
import { EllipsisStyle } from 'theme/components'

import { ChartTypeDropdown } from './ChartTypeSelector'

const ChartTypeRow = styled(Row)`
  ${EllipsisStyle}
`
const ADVANCED_PRICE_CHART_OPTIONS = [
  {
    value: PriceChartType.LINE,
    icon: <LineChartIcon width={20} height={20} />,
    display: (
      <ChartTypeRow gap="md">
        <LineChartIcon width={20} height={20} />
        {CHART_TYPE_LABELS[PriceChartType.LINE]}
      </ChartTypeRow>
    ),
  },
  {
    value: PriceChartType.CANDLESTICK,
    icon: <CandlestickChartIcon width={20} height={20} />,
    display: (
      <ChartTypeRow gap="md">
        <CandlestickChartIcon width={20} height={20} />
        {CHART_TYPE_LABELS[PriceChartType.CANDLESTICK]}
      </ChartTypeRow>
    ),
  },
]

export const AdvancedPriceChartToggle = ({
  currentChartType,
  onChartTypeChange,
  disableCandlestickUI,
}: {
  currentChartType: PriceChartType
  onChartTypeChange: (c: PriceChartType) => void
  disableCandlestickUI?: boolean
}) => {
  const screenSize = useScreenSize()
  const isMobileScreen = !screenSize['sm']
  const currentChartTypeDisplayOptions = ADVANCED_PRICE_CHART_OPTIONS.find((o) => o.value === currentChartType)

  return (
    <ChartTypeDropdown
      options={ADVANCED_PRICE_CHART_OPTIONS}
      disabledOption={disableCandlestickUI ? PriceChartType.CANDLESTICK : undefined}
      menuLabel={isMobileScreen ? currentChartTypeDisplayOptions?.display : currentChartTypeDisplayOptions?.icon}
      currentChartType={currentChartType}
      onSelectOption={onChartTypeChange}
      tooltipText={!isMobileScreen ? t`Chart type` : undefined}
    />
  )
}
