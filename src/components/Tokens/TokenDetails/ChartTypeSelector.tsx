import { ChartType, TDP_CHART_TYPES } from 'components/Charts/utils'
import { startTransition } from 'react'
import styled from 'styled-components'

const ChartTypeOptionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
  gap: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
  height: 40px;
  padding: 4px;
  width: fit-content;
`
const ChartTypeButton = styled.button<{ active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, active }) => (active ? theme.surface3 : 'transparent')};
  font-weight: 535;
  font-size: 16px;
  padding: 8px 12px;
  border-radius: 15px;
  line-height: 20px;
  border: none;
  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.neutral1 : theme.neutral2)};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  :hover {
    ${({ active, theme }) => !active && `opacity: ${theme.opacity.hover};`}
  }
`

export default function ChartTypeSelector({
  currentChartType,
  onChartTypeChange,
}: {
  currentChartType: ChartType
  onChartTypeChange: (c: ChartType) => void
}) {
  return (
    <ChartTypeOptionsContainer>
      {TDP_CHART_TYPES.map((chart, i) => (
        <ChartTypeButton
          key={i}
          active={currentChartType === chart}
          onClick={() => startTransition(() => onChartTypeChange(chart))}
        >
          {chart}
        </ChartTypeButton>
      ))}
    </ChartTypeOptionsContainer>
  )
}
