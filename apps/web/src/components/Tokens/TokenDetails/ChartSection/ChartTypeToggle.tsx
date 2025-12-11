import { ChartType } from 'components/Charts/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SegmentedControl, SegmentedControlOption, useMedia } from 'ui/src'

export function ChartTypeToggle({
  availableOptions,
  currentChartType,
  onChartTypeChange,
  disabledOption,
}: {
  availableOptions: readonly ChartType[]
  currentChartType: ChartType
  onChartTypeChange: (c: ChartType) => void
  disabledOption?: ChartType
}) {
  const { t } = useTranslation()
  const media = useMedia()

  const options: SegmentedControlOption<ChartType>[] = useMemo(() => {
    const liquidityDisabled = disabledOption === ChartType.LIQUIDITY
    const liquidityDisabledTooltip = (
      <MouseoverTooltip
        text={t('chart.settings.unavailable.label')}
        placement="bottom"
        style={{ alignContent: 'center', width: '33.33%' }}
      />
    )
    return [
      {
        value: ChartType.PRICE,
        displayText: t('common.price'),
      },
      {
        value: ChartType.VOLUME,
        displayText: t('common.volume'),
      },
      {
        value: ChartType.TVL,
        displayText: t('common.totalValueLocked'),
      },
      {
        value: ChartType.LIQUIDITY,
        displayText: t('common.liquidity'),
        disabled: liquidityDisabled,
        wrapper: liquidityDisabled ? liquidityDisabledTooltip : undefined,
      },
    ].filter((option) => availableOptions.includes(option.value))
  }, [availableOptions, t, disabledOption])

  return (
    <SegmentedControl
      fullWidth={media.md}
      options={options}
      selectedOption={currentChartType}
      onSelectOption={onChartTypeChange}
    />
  )
}
