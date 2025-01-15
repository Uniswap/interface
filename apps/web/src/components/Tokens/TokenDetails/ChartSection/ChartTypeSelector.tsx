import { CHART_TYPE_LABELS, ChartType, PriceChartType } from 'components/Charts/utils'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { MouseoverTooltip } from 'components/Tooltip'
import { useTheme } from 'lib/styled-components'
import { useState } from 'react'
import { Check, Info } from 'react-feather'
import { Trans } from 'react-i18next'
import { FlexProps } from 'ui/src'
import { isMobileWeb } from 'utilities/src/platform'

const StyledDropdownButton = {
  borderRadius: 20,
  width: '100%',
  height: 36,
} satisfies FlexProps

const StyledMenuFlyout = {
  minWidth: 130,
  borderRadius: '$rounded16',
  right: 0,
  zIndex: '$popover',
} satisfies FlexProps

interface ChartTypeSelectorOption<T extends ChartType | PriceChartType> {
  value: T // Value to be selected/stored, used as default display value
  display?: JSX.Element // Optional custom display element
}

function getChartTypeSelectorOption<T extends ChartType | PriceChartType>(
  option: ChartTypeSelectorOption<T> | T,
): ChartTypeSelectorOption<T> {
  if (typeof option === 'string') {
    return { value: option }
  }
  return option
}

export function ChartTypeDropdown<T extends ChartType | PriceChartType>({
  options,
  disabledOption,
  menuLabel,
  currentChartType,
  onSelectOption,
  tooltipText,
}: {
  options: readonly (ChartTypeSelectorOption<T> | T)[]
  disabledOption?: T
  menuLabel?: JSX.Element
  currentChartType: T
  onSelectOption: (option: T) => void
  tooltipText?: string
}) {
  const theme = useTheme()
  const [isMenuOpen, toggleMenu] = useState(false)

  return (
    <DropdownSelector
      isOpen={isMenuOpen}
      toggleOpen={toggleMenu}
      menuLabel={menuLabel ?? CHART_TYPE_LABELS[currentChartType]}
      internalMenuItems={
        <>
          {options.map((option) => {
            const { value: chartType, display } = getChartTypeSelectorOption(option)
            const disabled = chartType === disabledOption
            return (
              <MouseoverTooltip
                key={chartType}
                text={disabled && <Trans i18nKey="chart.settings.unavailable.label" />}
                placement={!isMobileWeb ? 'right' : undefined}
              >
                <InternalMenuItem
                  onPress={() => {
                    if (disabled) {
                      return
                    }
                    onSelectOption(chartType)
                    toggleMenu(false)
                  }}
                  disabled={disabled}
                >
                  {display ?? CHART_TYPE_LABELS[chartType]}
                  {chartType === currentChartType && <Check size={20} color={theme.accent1} />}
                  {disabled && <Info size={20} color="$neutral2" />}
                </InternalMenuItem>
              </MouseoverTooltip>
            )
          })}
        </>
      }
      tooltipText={tooltipText}
      buttonStyle={StyledDropdownButton}
      dropdownStyle={StyledMenuFlyout}
      adaptToSheet={false}
    />
  )
}
