import React from 'react'
import useTheme from 'hooks/useTheme'

function Cronos({ size }: { size?: number }) {
  const theme = useTheme()
  return (
    <svg width={size || 36} height={size || 36} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0)">
        <path
          d="M25.84 1.90735e-06L-1.52588e-05 14.92V44.75L25.84 59.66L51.66 44.75V14.92L25.84 1.90735e-06ZM44.01 40.33L25.84 50.82L7.65999 40.33V19.33L25.84 8.84L44.01 19.33V40.33Z"
          fill={theme.text}
        />
        <path
          d="M37.89 36.8L25.83 43.76L13.76 36.8V22.87L25.83 15.9L37.89 22.87L32.87 25.77L25.83 21.7L18.79 25.77V33.89L25.83 37.96L32.87 33.89L37.89 36.8Z"
          fill={theme.text}
        />
      </g>
      <defs>
        <clipPath id="clip0">
          <rect width="214.71" height="59.66" fill={theme.text} />
        </clipPath>
      </defs>
    </svg>
  )
}

export default Cronos
