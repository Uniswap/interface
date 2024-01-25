import { Trans } from '@lingui/macro'
import { ChartType } from 'components/Charts/utils'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import PillMultiToggle from 'components/Toggle/PillMultiToggle'
import { useScreenSize } from 'hooks/useScreenSize'
import { Check } from 'react-feather'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { css, useTheme } from 'styled-components'

const StyledDropdownButton = css`
  border-radius: 20px;
  min-width: 93px;
  height: 40px;
`
const StyledMenuFlyout = css`
  min-width: 130px;
  border-radius: 16px;
  right: 20px;
`
function ChartTypeDropdown<T extends ChartType>({
  options,
  currentChartType,
  onSelectOption,
}: {
  options: readonly T[]
  currentChartType: T
  onSelectOption: (option: T) => void
}) {
  const theme = useTheme()
  const toggleMenu = useToggleModal(ApplicationModal.TDP_CHART_TYPE_SELECTOR)

  return (
    <DropdownSelector
      modal={ApplicationModal.TDP_CHART_TYPE_SELECTOR}
      menuLabel={<>{currentChartType}</>}
      internalMenuItems={
        <>
          {options.map((chartType) => {
            return (
              <InternalMenuItem
                key={chartType}
                onClick={() => {
                  onSelectOption(chartType)
                  toggleMenu()
                }}
              >
                <Trans>{chartType}</Trans>
                {chartType === currentChartType && <Check size={16} color={theme.accent1} />}
              </InternalMenuItem>
            )
          })}
        </>
      }
      buttonCss={StyledDropdownButton}
      menuFlyoutCss={StyledMenuFlyout}
    />
  )
}

export default function ChartTypeSelector<T extends ChartType>({
  options,
  currentChartType,
  onChartTypeChange,
}: {
  options: readonly T[]
  currentChartType: T
  onChartTypeChange: (c: T) => void
}) {
  const screenSize = useScreenSize()

  if (!screenSize['sm']) {
    return (
      <ChartTypeDropdown options={options} currentChartType={currentChartType} onSelectOption={onChartTypeChange} />
    )
  } else {
    return (
      <PillMultiToggle
        options={options}
        currentSelected={currentChartType}
        onSelectOption={onChartTypeChange as (c: string) => void}
      />
    )
  }
}
