import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SegmentedControl, SegmentedControlOption, useMedia } from 'ui/src'
import { ChartType } from '~/components/Charts/utils'
import { MouseoverTooltip } from '~/components/Tooltip'

export function ChartTypeToggle({
  availableOptions,
  currentChartType,
  onChartTypeChange,
  disabledOption,
}: {
  availableOptions: readonly ChartType[]
  currentChartType: ChartType
  onChartTypeChange: (c: ChartType) => void
  disabledOption?: ChartType | ChartType[]
}) {
  const { t } = useTranslation()
  const media = useMedia()

  const options: SegmentedControlOption<ChartType>[] = useMemo(() => {
    const disabledOptions = Array.isArray(disabledOption) ? disabledOption : disabledOption ? [disabledOption] : []
    const isDisabled = (type: ChartType) => disabledOptions.includes(type)
    const disabledTooltip = (
      <MouseoverTooltip
        text={t('chart.settings.unavailable.label')}
        placement="bottom"
        style={{ alignContent: 'center', width: '33.33%' }}
      />
    )
    const withDisabled = (type: ChartType, displayText: string): SegmentedControlOption<ChartType> => ({
      value: type,
      displayText,
      disabled: isDisabled(type),
      wrapper: isDisabled(type) ? disabledTooltip : undefined,
    })
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
      withDisabled(ChartType.LIQUIDITY, t('common.liquidity')),
      withDisabled(ChartType.DEPTH, t('chart.type.depth')),
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
