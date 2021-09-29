import React from 'react'

const ArrowRight = ({ width, height, fill }: { width?: number; height?: number; fill?: string }) => {
  return (
    <svg width={width || 5} height={height || 10} viewBox="0 0 5 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 10L5 5L-4.37114e-07 0L0 10Z" fill={fill || 'white'} />
    </svg>
  )
}

export default ArrowRight
