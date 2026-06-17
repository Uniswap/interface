import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, SegmentedControl, SegmentedControlOption, Text, useMedia } from 'ui/src'
import { ChartType } from '~/components/Charts/utils'
import { MouseoverTooltip } from '~/components/Tooltip'

export function ChartTypeToggle({
  availableOptions,
  currentChartType,
  onChartTypeChange,
  disabledOption,
  variant = 'segmented',
}: {
  availableOptions: readonly ChartType[]
  currentChartType: ChartType
  onChartTypeChange: (c: ChartType) => void
  disabledOption?: ChartType | ChartType[]
  variant?: 'segmented' | 'text'
}) {
  const { t } = useTranslation()
  const media = useMedia()

  const disabledOptions = useMemo(
    () => (Array.isArray(disabledOption) ? disabledOption : disabledOption ? [disabledOption] : []),
    [disabledOption],
  )

  const baseOptions = useMemo(
    () =>
      [
        { value: ChartType.PRICE, displayText: t('common.price') },
        { value: ChartType.VOLUME, displayText: t('common.volume') },
        { value: ChartType.TVL, displayText: t('common.totalValueLocked') },
        { value: ChartType.LIQUIDITY, displayText: t('common.liquidity') },
        { value: ChartType.DEPTH, displayText: t('chart.type.depth') },
      ].filter((option) => availableOptions.includes(option.value)),
    [availableOptions, t],
  )

  if (variant === 'text') {
    return (
      <Flex row gap="$spacing24" alignItems="center">
        {baseOptions.map((option) => {
          const disabled = disabledOptions.includes(option.value)
          const active = option.value === currentChartType
          return (
            <MouseoverTooltip
              key={option.value}
              text={t('chart.settings.unavailable.label')}
              placement="bottom"
              disabled={!disabled}
            >
              <Text
                variant="subheading1"
                userSelect="none"
                cursor={disabled ? 'default' : 'pointer'}
                color={disabled ? '$neutral3' : active ? '$neutral1' : '$neutral2'}
                hoverStyle={disabled ? undefined : { color: '$neutral1' }}
                onPress={disabled ? undefined : () => onChartTypeChange(option.value)}
              >
                {option.displayText}
              </Text>
            </MouseoverTooltip>
          )
        })}
      </Flex>
    )
  }

  const options: SegmentedControlOption<ChartType>[] = baseOptions.map((option) => {
    const disabled = disabledOptions.includes(option.value)
    return {
      ...option,
      disabled,
      wrapper: disabled ? (
        <MouseoverTooltip
          text={t('chart.settings.unavailable.label')}
          placement="bottom"
          style={{ alignContent: 'center', width: '33.33%' }}
        />
      ) : undefined,
    }
  })

  return (
    <SegmentedControl
      fullWidth={media.md}
      options={options}
      selectedOption={currentChartType}
      onSelectOption={onChartTypeChange}
    />
  )
}
