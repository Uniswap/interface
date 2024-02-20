import { Trans, t } from '@lingui/macro'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { useReducer } from 'react'
import { Check } from 'react-feather'
import { css, useTheme } from 'styled-components'

const StyledDropdownButton = css`
  border-radius: 16px;
  width: 100%;
  height: 32px;
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
  menuLabel,
  currentChartType,
  onSelectOption,
  tooltipText,
}: {
  options: readonly (ChartTypeSelectorOption<T> | T)[]
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
      menuLabel={menuLabel ?? <>{t`${currentChartType}`}</>}
      internalMenuItems={
        <>
          {options.map((option) => {
            const { value: chartType, display } = getChartTypeSelectorOption(option)

            return (
              <InternalMenuItem
                key={chartType}
                onClick={() => {
                  onSelectOption(chartType)
                  toggleMenu()
                }}
              >
                {display ?? <Trans>{chartType}</Trans>}
                {chartType === currentChartType && <Check size={20} color={theme.accent1} />}
              </InternalMenuItem>
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
