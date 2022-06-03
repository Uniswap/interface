import React, { ReactNode } from 'react'
import { Box } from 'src/components/layout'

// For overlaying icons in JSX
export default function OverlayIcon({
  icon,
  overlay,
  offset = 4,
}: {
  icon: ReactNode
  overlay: ReactNode
  offset?: number
}) {
  return (
    <>
      {icon}
      <Box bottom={offset} position="absolute" right={offset}>
        {overlay}
      </Box>
    </>
  )
}
