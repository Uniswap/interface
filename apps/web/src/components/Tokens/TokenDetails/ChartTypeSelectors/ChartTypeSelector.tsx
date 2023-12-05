import { ChartType } from 'components/Charts/utils'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import PillMultiToggle from 'components/Toggle/PillMultiToggle'
import { useScreenSize } from 'hooks/useScreenSize'
import { Check } from 'react-feather'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { css, useTheme } from 'styled-components'

const CHART_SELECTOR_OPTIONS = [{ value: ChartType.PRICE }, { value: ChartType.VOLUME }, { value: ChartType.TVL }]

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
const ChartTypeDropdown = ({
  currentChartType,
  onSelectOption,
}: {
  currentChartType: ChartType
  onSelectOption: (option: ChartType) => void
}) => {
  const theme = useTheme()
  const toggleMenu = useToggleModal(ApplicationModal.TDP_CHART_TYPE_SELECTOR)

  return (
    <DropdownSelector
      modal={ApplicationModal.TDP_CHART_TYPE_SELECTOR}
      menuLabel={<>{currentChartType}</>}
      internalMenuItems={
        <>
          {CHART_SELECTOR_OPTIONS.map(({ value: chartType }) => {
            return (
              <InternalMenuItem
                key={chartType}
                onClick={() => {
                  onSelectOption(chartType)
                  toggleMenu()
                }}
              >
                {chartType}
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

export default function ChartTypeSelector({
  currentChartType,
  onChartTypeChange,
}: {
  currentChartType: ChartType
  onChartTypeChange: (c: ChartType) => void
}) {
  const screenSize = useScreenSize()
  if (!screenSize['sm']) {
    return <ChartTypeDropdown currentChartType={currentChartType} onSelectOption={onChartTypeChange} />
  } else {
    return (
      <PillMultiToggle
        options={CHART_SELECTOR_OPTIONS}
        currentSelected={currentChartType}
        onSelectOption={onChartTypeChange as (c: string) => void}
      />
    )
  }
}
