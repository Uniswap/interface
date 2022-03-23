import React from 'react'
import useTheme from 'hooks/useTheme'

function Velas({ size }: { size?: number }) {
  const theme = useTheme()
  return (
    <svg width={size || 36} height={size || 36} viewBox="0 0 42 37" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M28.8749 14.7355L21.0007 28.6105L13.1251 14.7355H28.8749ZM36.7505 10.1105H5.24945L21.0007 37.8605L36.7505 10.1105ZM0 0.860504L2.62618 5.4855H39.3753L42 0.860504H0Z"
        fill={theme.text}
      ></path>
    </svg>
  )
}

export default Velas
