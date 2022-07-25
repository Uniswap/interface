import React from 'react'
import { Flex } from 'rebass'

import useTheme from 'hooks/useTheme'
import { TrueSightTimeframe } from 'pages/TrueSight/index'
import styled from 'styled-components'

const TimeframePickerItem = styled.div<{ isActive: boolean }>`
  border-radius: 999px;
  padding: 4px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme, isActive }) => (isActive ? theme.text : theme.subText)};
  background: ${({ theme, isActive }) => (isActive ? theme.tabActive : theme.tabBackgound)};
  cursor: pointer;
  transition: all 0.2s ease;
`

const TimeframePicker = ({
  activeTimeframe,
  setActiveTimeframe,
}: {
  activeTimeframe: TrueSightTimeframe
  setActiveTimeframe: (timeframe: TrueSightTimeframe) => void
}) => {
  const theme = useTheme()

  return (
    <Flex style={{ borderRadius: '999px', padding: '2px', background: theme.tabBackgound }}>
      <TimeframePickerItem
        isActive={activeTimeframe === TrueSightTimeframe.ONE_DAY}
        onClick={() => {
          setActiveTimeframe(TrueSightTimeframe.ONE_DAY)
        }}
      >
        1D
      </TimeframePickerItem>
      <TimeframePickerItem
        isActive={activeTimeframe === TrueSightTimeframe.ONE_WEEK}
        onClick={() => {
          setActiveTimeframe(TrueSightTimeframe.ONE_WEEK)
        }}
      >
        7D
      </TimeframePickerItem>
    </Flex>
  )
}

export default TimeframePicker
