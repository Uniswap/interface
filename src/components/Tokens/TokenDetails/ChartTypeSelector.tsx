import { ChartType, TDP_CHART_TYPES } from 'components/Charts/utils'
import { createRef, useEffect, useState } from 'react'
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
const ActivePill = styled.div`
  position: absolute;
  height: 30px;
  background-color: ${({ theme }) => theme.surface3};
  border-radius: 15px;
`
const ChartTypeButton = styled.button<{ active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
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
type ActivePillStyle = {
  left?: string
  width?: string
  transition?: string
}
export default function ChartTypeSelector({
  currentChartType,
  onChartTypeChange,
}: {
  currentChartType: ChartType
  onChartTypeChange: (c: ChartType) => void
}) {
  const buttonRefs = TDP_CHART_TYPES.map(() => createRef<HTMLButtonElement>())
  const [activePillStyle, setActivePillStyle] = useState<ActivePillStyle>({})

  // Set initial active pill position on mount
  useEffect(() => {
    const rect = buttonRefs[0].current?.getBoundingClientRect()
    setActivePillStyle({ left: `${rect?.left}px`, width: `${rect?.width}px` })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ChartTypeOptionsContainer>
      <ActivePill style={activePillStyle} />
      {TDP_CHART_TYPES.map((chart, i) => {
        const ref = buttonRefs[i]
        return (
          <ChartTypeButton
            ref={ref}
            key={i}
            active={currentChartType === chart}
            onClick={() => {
              onChartTypeChange(chart)
              const rect = ref.current?.getBoundingClientRect()
              setActivePillStyle({
                left: `${rect?.left}px`,
                width: `${rect?.width}px`,
                transition: 'left 0.3s ease, width 0.3s ease',
              })
            }}
          >
            {chart}
          </ChartTypeButton>
        )
      })}
    </ChartTypeOptionsContainer>
  )
}
