import { ChartType, TDP_CHART_TYPES } from 'components/Charts/utils'
import { startTransition, useState } from 'react'
import styled from 'styled-components'

const ChartTypeOptionsWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
`
const ChartTypeOptionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
  gap: 4px;
  border-radius: 16px;
  height: 40px;
  padding: 4px;
  width: fit-content;

  @media only screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    width: 100%;
    justify-content: space-between;
    border: none;
  }
`
const ChartTypeButton = styled.button<{ active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, active }) => (active ? theme.surface3 : 'transparent')};
  font-weight: 535;
  font-size: 16px;
  padding: 6px 12px;
  border-radius: 12px;
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
  const [chartType, setChartType] = useState(currentChartType)
  return (
    <ChartTypeOptionsWrapper>
      <ChartTypeOptionsContainer>
        {TDP_CHART_TYPES.map((chart, i) => (
          <ChartTypeButton
            key={i}
            active={chartType === chart}
            onClick={() => {
              startTransition(() => onChartTypeChange(chart))
              setChartType(chart)
            }}
          >
            {chart}
          </ChartTypeButton>
        ))}
      </ChartTypeOptionsContainer>
    </ChartTypeOptionsWrapper>
  )
}
