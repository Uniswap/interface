import React from 'react'

const AddCircle = ({ width, height, color }: { width?: number; height?: number; color?: string }) => {
  return (
    <svg width={width || 24} height={height || 24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 9H16" stroke={color || 'white'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M10 13L8 15L10 17"
        stroke={color || 'white'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 15H8" stroke={color || 'white'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M14 7L16 9L14 11"
        stroke={color || 'white'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default AddCircle
