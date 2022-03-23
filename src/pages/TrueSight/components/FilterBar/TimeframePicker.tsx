import React from 'react'
import { Flex } from 'rebass'

import useTheme from 'hooks/useTheme'
import { TrueSightTimeframe } from 'pages/TrueSight/index'

const TimeframePickerItem = ({ text, active, onClick }: { text: string; active: boolean; onClick: () => void }) => {
  const theme = useTheme()

  return (
    <div
      style={{
        borderRadius: '4px',
        padding: '7px',
        color: active ? theme.text14 : theme.subText,
        background: active ? theme.primary : 'transparent',
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: '14px',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {text}
    </div>
  )
}

const TimeframePicker = ({
  activeTimeframe,
  setActiveTimeframe,
}: {
  activeTimeframe: TrueSightTimeframe
  setActiveTimeframe: (timeframe: TrueSightTimeframe) => void
}) => {
  const theme = useTheme()

  return (
    <Flex style={{ borderRadius: '4px', padding: '4px', background: theme.background }}>
      <TimeframePickerItem
        text="1D"
        active={activeTimeframe === TrueSightTimeframe.ONE_DAY}
        onClick={() => {
          setActiveTimeframe(TrueSightTimeframe.ONE_DAY)
        }}
      />
      <TimeframePickerItem
        text="7D"
        active={activeTimeframe === TrueSightTimeframe.ONE_WEEK}
        onClick={() => {
          setActiveTimeframe(TrueSightTimeframe.ONE_WEEK)
        }}
      />
    </Flex>
  )
}

export default TimeframePicker
