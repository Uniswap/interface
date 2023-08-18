// Divider.tsx

import React from 'react'

interface DividerProps {
  color?: string
  thickness?: string
  margin?: string
  style?: React.CSSProperties
}

export default function Divider({
  color = '#e0e0e0',
  thickness = '1px',
  margin = '16px 0',
  style = {},
  ...props
}: DividerProps) {
  return (
    <hr
      {...props}
      style={{
        backgroundColor: color,
        height: thickness,
        border: 'none',
        margin,
        ...style,
      }}
    />
  )
}
