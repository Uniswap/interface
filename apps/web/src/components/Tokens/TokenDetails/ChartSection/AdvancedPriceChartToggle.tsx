import { ReactComponent as CandlestickChartIcon } from 'assets/svg/candlestick-chart-icon.svg'
import { ReactComponent as LineChartIcon } from 'assets/svg/line-chart-icon.svg'
import { PriceChartType } from 'components/Charts/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import { useTranslation } from 'react-i18next'
import { ColorTokens, Flex, SegmentedControl, useMedia, useSporeColors } from 'ui/src'

const CandlestickIcon = ({ color, isDisabled }: { color: ColorTokens; isDisabled?: boolean }) => {
  return (
    <Flex row centered width="$spacing.18">
      <CandlestickChartIcon
        color={color}
        width={14}
        height={14}
        style={isDisabled ? { opacity: 0.2, cursor: 'not-allowed' } : {}}
      />
    </Flex>
  )
}

export const AdvancedPriceChartToggle = ({
  currentChartType,
  onChartTypeChange,
  disableCandlestickUI,
}: {
  currentChartType: PriceChartType
  onChartTypeChange: (c: PriceChartType) => void
  disableCandlestickUI?: boolean
}) => {
  const { t } = useTranslation()
  const media = useMedia()
  const colors = useSporeColors()
  const iconColor = colors.neutral1.val

  const options = [
    {
      value: PriceChartType.LINE,
      display: <LineChartIcon color={iconColor} width={18} height={18} />,
    },
    {
      value: PriceChartType.CANDLESTICK,
      display: <CandlestickIcon color={iconColor} isDisabled={disableCandlestickUI} />,
      disabled: disableCandlestickUI,
      wrapper: disableCandlestickUI ? (
        <MouseoverTooltip
          text={t('token.chart.candlestick.unavailable')}
          placement="bottom"
          style={{ alignContent: 'center' }}
        />
      ) : undefined,
    },
  ]

  return (
    <SegmentedControl
      fullWidth={media.md}
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
