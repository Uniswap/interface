import { Flex, Text } from '@universe/mycelium'
import { SegmentedControl, SegmentedControlOption } from '@universe/mycelium/segmented-control-compat'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChartType } from '~/components/Charts/utils'
import { MouseoverTooltip } from '~/components/Tooltip'

const CHART_TYPE_ORDER = [
  ChartType.PRICE,
  ChartType.VOLUME,
  ChartType.TVL,
  ChartType.LIQUIDITY,
  ChartType.DEPTH,
] as const

export function getChartTypeLabel(t: TFunction, chartType: ChartType): string {
  switch (chartType) {
    case ChartType.PRICE:
      return t('common.price')
    case ChartType.VOLUME:
      return t('common.volume')
    case ChartType.TVL:
      return t('common.totalValueLocked')
    case ChartType.LIQUIDITY:
      return t('common.liquidity')
    case ChartType.DEPTH:
      return t('chart.type.depth')
    default:
      return chartType satisfies never
  }
}

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
      CHART_TYPE_ORDER.filter((value) => availableOptions.includes(value)).map((value) => ({
        value,
        displayText: getChartTypeLabel(t, value),
      })),
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
