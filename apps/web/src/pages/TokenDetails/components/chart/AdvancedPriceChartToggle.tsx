import { Flex, type IconSizeTokens } from '@universe/mycelium'
import { CandlestickChart } from '@universe/mycelium/icons/CandlestickChart'
import { LineChartDots } from '@universe/mycelium/icons/LineChartDots'
import { SegmentedControl } from '@universe/mycelium/segmented-control-compat'
import { useTranslation } from 'react-i18next'
import { PriceChartType } from '~/components/Charts/utils'
import { MouseoverTooltip } from '~/components/Tooltip'

export function AdvancedPriceChartToggle({
  currentChartType,
  onChartTypeChange,
  disableCandlestickUI,
}: {
  currentChartType: PriceChartType
  onChartTypeChange: (c: PriceChartType) => void
  disableCandlestickUI?: boolean
}): JSX.Element {
  const { t } = useTranslation()

  const options = [
    {
      value: PriceChartType.LINE,
      display: <LineChartDots color="$neutral1" size="$icon.18" />,
    },
    {
      value: PriceChartType.CANDLESTICK,
      display: <CandlestickIcon isDisabled={disableCandlestickUI} size="$icon.16" />,
      disabled: disableCandlestickUI,
      wrapper: disableCandlestickUI ? (
        <MouseoverTooltip
          text={t('token.chart.candlestick.unavailable')}
          placement="bottom"
          style={{ alignContent: 'center', flex: 1 }}
        />
      ) : undefined,
    },
  ]

  return (
    <SegmentedControl
      options={options}
      selectedOption={currentChartType}
      onSelectOption={(selectedValue) => {
        if (disableCandlestickUI && selectedValue === PriceChartType.CANDLESTICK) {
          // ignore the click if candlestick is disabled
          return
        }
        onChartTypeChange(selectedValue as PriceChartType)
      }}
      size="default"
    />
  )
}

const CandlestickIcon = ({ isDisabled, size }: { isDisabled?: boolean; size: IconSizeTokens }): JSX.Element => {
  return (
    <Flex
      row
      centered
      width="$spacing18"
      opacity={isDisabled ? 0.2 : 1}
      style={isDisabled ? { cursor: 'not-allowed' } : undefined}
    >
      <CandlestickChart color="$neutral1" size={size} />
    </Flex>
  )
}
