import { Trans } from '@lingui/macro'
import { CHART_TYPE_LABELS, ChartType, PriceChartType } from 'components/Charts/utils'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { MouseoverTooltip } from 'components/Tooltip'
import { useReducer } from 'react'
import { Check, Info } from 'react-feather'
import { css, useTheme } from 'styled-components'

import { isMobile } from 'uniswap/src/utils/platform'

const StyledDropdownButton = css`
  border-radius: 20px;
  width: 100%;
  height: 36px;
`
const StyledMenuFlyout = css`
  min-width: 130px;
  border-radius: 16px;
  right: 0px;
`

interface ChartTypeSelectorOption<T extends ChartType | PriceChartType> {
  value: T // Value to be selected/stored, used as default display value
  display?: JSX.Element // Optional custom display element
}

function getChartTypeSelectorOption<T extends ChartType | PriceChartType>(
  option: ChartTypeSelectorOption<T> | T
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
  const [isMenuOpen, toggleMenu] = useReducer((s) => !s, false)

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
                text={disabled && <Trans>This setting is unavailable for the current chart</Trans>}
                placement={!isMobile ? 'right' : undefined}
              >
                <InternalMenuItem
                  onClick={() => {
                    if (disabled) return
                    onSelectOption(chartType)
                    toggleMenu()
                  }}
                  disabled={disabled}
                >
                  {display ?? CHART_TYPE_LABELS[chartType]}
                  {chartType === currentChartType && <Check size={20} color={theme.accent1} />}
                  {disabled && <Info size={20} color={theme.neutral2} />}
                </InternalMenuItem>
              </MouseoverTooltip>
            )
          })}
        </>
      }
      tooltipText={tooltipText}
      buttonCss={StyledDropdownButton}
      menuFlyoutCss={StyledMenuFlyout}
    />
  )
}
