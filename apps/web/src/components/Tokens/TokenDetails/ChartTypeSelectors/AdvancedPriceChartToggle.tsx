import { t, Trans } from '@lingui/macro'
import { ReactComponent as CandlestickChartIcon } from 'assets/svg/candlestick-chart-icon.svg'
import { ReactComponent as LineChartIcon } from 'assets/svg/line-chart-icon.svg'
import { PriceChartType } from 'components/Charts/utils'
import Row from 'components/Row'
import { useScreenSize } from 'hooks/useScreenSize'
import styled, { useTheme } from 'styled-components'
import { EllipsisStyle } from 'theme/components'
import { FadePresence } from 'theme/components/FadePresence'

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
        <Trans>Line chart</Trans>
      </ChartTypeRow>
    ),
  },
  {
    value: PriceChartType.CANDLESTICK,
    icon: <CandlestickChartIcon width={20} height={20} />,
    display: (
      <ChartTypeRow gap="md">
        <CandlestickChartIcon width={20} height={20} />
        <Trans>Candlestick</Trans>
      </ChartTypeRow>
    ),
  },
]

export const AdvancedPriceChartToggle = ({
  currentChartType,
  onChartTypeChange,
}: {
  currentChartType: PriceChartType
  onChartTypeChange: (c: PriceChartType) => void
}) => {
  const theme = useTheme()
  const screenSize = useScreenSize()
  const isMobileScreen = !screenSize['sm']
  const currentChartTypeDisplayOptions = ADVANCED_PRICE_CHART_OPTIONS.find((o) => o.value === currentChartType)

  return (
    <FadePresence $transitionDuration={theme.transition.duration.fast}>
      <ChartTypeDropdown
        options={ADVANCED_PRICE_CHART_OPTIONS}
        menuLabel={isMobileScreen ? currentChartTypeDisplayOptions?.display : currentChartTypeDisplayOptions?.icon}
        currentChartType={currentChartType}
        onSelectOption={onChartTypeChange}
        tooltipText={!isMobileScreen ? t`Chart type` : undefined}
      />
    </FadePresence>
  )
}
