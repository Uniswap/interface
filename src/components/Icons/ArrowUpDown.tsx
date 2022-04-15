import React, { CSSProperties } from 'react'

const ArrowUpDown = ({ size = 16, style }: { size?: number; style?: CSSProperties }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <path
        d="M8.66675 4.66L6.00008 2L3.33341 4.66L5.33341 4.66L5.33341 9.33333L6.66675 9.33333L6.66675 4.66L8.66675 4.66ZM10.0001 14L12.6667 11.34L10.6667 11.34L10.6667 6.66667L9.33341 6.66667L9.33341 11.34L7.33341 11.34L10.0001 14Z"
        fill="#A7B6BD"
      />
    </svg>
  )
}

export default ArrowUpDown
