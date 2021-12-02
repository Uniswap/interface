import React from 'react'
import useTheme from 'hooks/useTheme'

function Ethereum({ size }: { size?: number }) {
  const theme = useTheme()
  return (
    <svg width={size || 36} height={size || 36} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.0667 0L17.8254 0.820144V24.6188L18.0667 24.8597L29.1138 18.3298L18.0667 0Z" fill={theme.text} />
      <path d="M18.0671 0L7.02002 18.3298L18.0671 24.8598V13.3086V0Z" fill={theme.text} />
      <path
        d="M18.0669 26.9514L17.9309 27.1172V35.5948L18.0669 35.992L29.1205 20.4248L18.0669 26.9514Z"
        fill={theme.text}
      />
      <path d="M18.0671 35.9918V26.9512L7.02002 20.4246L18.0671 35.9918Z" fill={theme.text} />
      <path d="M18.0671 24.8596L29.114 18.3298L18.0671 13.3086V24.8596Z" fill={theme.text} />
      <path d="M7.02051 18.33L18.0674 24.8598V13.3088L7.02051 18.33Z" fill={theme.text} />
    </svg>
  )
}

export default Ethereum
