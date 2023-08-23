// Divider.tsx

import React from 'react'
import { useTheme } from 'styled-components/macro'

interface DividerProps {
  color?: string
  thickness?: string
  margin?: string
  style?: React.CSSProperties
}

export default function Divider({ color, thickness = '1px', margin = '16px 0', style = {}, ...props }: DividerProps) {
  const theme = useTheme()
  const defaultColor = color || theme.accentActive

  return (
    <hr
      {...props}
      style={{
        backgroundColor: defaultColor,
        height: thickness,
        border: 'none',
        margin,
        ...style,
      }}
    />
  )
}
