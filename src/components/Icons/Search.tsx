import React from 'react'

function Search({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size || 24}
      height={size || 24}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14.1931 5.58187C16.525 7.91369 16.525 11.6943 14.1931 14.0261C11.8613 16.358 8.08069 16.358 5.74887 14.0261C3.41704 11.6943 3.41704 7.91369 5.74887 5.58187C8.08069 3.25005 11.8613 3.25005 14.1931 5.58187"
          stroke={color || 'currentColor'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.1499 14.06L19.9999 19.99"
          stroke={color || 'currentColor'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </svg>
  )
}

export default Search
